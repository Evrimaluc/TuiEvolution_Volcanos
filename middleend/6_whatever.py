import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.widgets import Button

# Parametreler
vent_radius = 500      # Yanardağ çapı (m)
vent_height = 1421     # Yanardağ yüksekliği (m)
n_particles = 300      # Partikül sayısı (100 kırmızı, 100 sarı, 100 siyah)
n_ash = 300            # Kül partikül sayısı (gri)
n_rocks = 50           # Kayaç sayısı

# Boyut parametreleri
ash_diameter = 0.001
particle_diameter = 0.02
rock_diameter = particle_diameter * 5  # Kayaçlar 5 kat daha büyük

w0 = 800               # Yüksek çıkış hızı (m/s)
gravity = 9.81         # Yerçekimi (m/s²)
air_resistance = 0.98  # Hava direnci faktörü
frame_interval = 0.005     # Animasyon kare süresi (ms) (0.0005 ms çok düşük olduğu için 5 ms olarak ayarlandı)

current_wind = np.array([0.0, 0.0])

n_red = 50
n_yellow = 50
n_black = 50

is_split = np.zeros(n_particles, dtype=int)  # Dağılma aşamasını izler (0: Dağılmamış, 1: İlk dağılma, 2: İkinci dağılma)

ash = np.zeros((n_ash, 3))          
ash_velocities = np.zeros((n_ash, 3))
ash_colors = np.ones((n_ash, 3)) * 0.5

particles = np.zeros((n_particles, 3))
velocities = np.zeros((n_particles, 3))
colors = np.zeros((n_particles, 3))

rocks = np.zeros((n_rocks, 3))
rock_velocities = np.zeros((n_rocks, 3))
rock_color = np.zeros((n_rocks, 3))
rock_color[:] = [0, 0, 0]

max_x = 0
max_y = 0
max_black_distance = 0

max_height = 4000  # Maksimum yükseklik (m)

def volcano_surface(x, y):
    r = np.sqrt(x**2 + y**2)
    z = vent_height * (1 - r / vent_radius)
    z[z < 0] = 0
    return z

def initialize_particles_and_rocks_and_ash():
    global particles, velocities, colors, ash, ash_velocities, ash_colors, rocks, rock_velocities, max_x, max_y, max_black_distance, is_split

    # Kül partikülleri
    theta_a = np.random.uniform(0, 2*np.pi, n_ash)
    r_a = np.random.uniform(0, vent_radius, n_ash)
    ash[:,0] = r_a * np.cos(theta_a)
    ash[:,1] = r_a * np.sin(theta_a)
    ash[:,2] = vent_height
    ash_velocities[:,0] = np.random.normal(0, w0/10, n_ash)
    ash_velocities[:,1] = np.random.normal(0, w0/10, n_ash)
    ash_velocities[:,2] = np.random.uniform(w0 / 4, w0 / 2, n_ash)

    # Partiküller
    theta_p = np.random.uniform(0, 2 * np.pi, n_particles)
    r_p = np.random.uniform(0, vent_radius, n_particles)
    particles[:, 0] = r_p * np.cos(theta_p)
    particles[:, 1] = r_p * np.sin(theta_p)
    particles[:, 2] = vent_height

    velocities[:, 0] = np.random.normal(0, w0 / 5, n_particles)
    velocities[:, 1] = np.random.normal(0, w0 / 5, n_particles)
    velocities[:, 2] = np.random.uniform(w0 / 2, w0, n_particles)

    # Renkler
    colors[:n_red] = [1, 0, 0]
    colors[n_red:n_red+n_yellow] = [1, 1, 0]
    colors[n_red+n_yellow:] = [0, 0, 0]

    # Kayaçlar
    theta_r = np.random.uniform(0, 2 * np.pi, n_rocks)
    r_r = np.random.uniform(0, vent_radius / 2, n_rocks)
    rocks[:, 0] = r_r * np.cos(theta_r)
    rocks[:, 1] = r_r * np.sin(theta_r)
    rocks[:, 2] = vent_height

    rock_velocities[:, 0] = np.random.normal(0, w0 / 5, n_rocks)
    rock_velocities[:, 1] = np.random.normal(0, w0 / 5, n_rocks)
    rock_velocities[:, 2] = np.random.uniform(w0 / 2, w0, n_rocks)

    max_x, max_y = 0, 0
    max_black_distance = 0

    # Başlangıç konumlarını ayarla
    particles[:] = [0, 0, vent_height]
    ash[:] = [0, 0, vent_height]
    rocks[:] = [0, 0, vent_height]

    # Hızları koni dağılımıyla başlat
    speeds = np.sqrt(velocities[:, 0] ** 2 + velocities[:, 1] ** 2 + velocities[:, 2] ** 2)
    phi = np.random.uniform(0, 2 * np.pi, n_particles)
    theta_cone = np.random.uniform(0, np.radians(30), n_particles)
    velocities[:, 0] = speeds * np.sin(theta_cone)*np.cos(phi)
    velocities[:, 1] = speeds * np.sin(theta_cone)*np.sin(phi)
    velocities[:, 2] = speeds * np.cos(theta_cone)

    # Kül partiküllerini koni dağılımıyla başlat
    a_speeds = np.sqrt(ash_velocities[:, 0] ** 2 + ash_velocities[:, 1] ** 2 + ash_velocities[:, 2] ** 2)
    a_phi = np.random.uniform(0, 2 * np.pi, n_ash)
    a_theta_cone = np.random.uniform(0, np.radians(30), n_ash)
    ash_velocities[:, 0] = a_speeds * np.sin(a_theta_cone)*np.cos(a_phi)
    ash_velocities[:, 1] = a_speeds * np.sin(a_theta_cone)*np.sin(a_phi)
    ash_velocities[:, 2] = a_speeds * np.cos(a_theta_cone)

    # Kayaç partiküllerini koni dağılımıyla başlat
    r_speeds = np.sqrt(rock_velocities[:, 0] ** 2 + rock_velocities[:, 1] ** 2 + rock_velocities[:, 2] ** 2)
    r_phi = np.random.uniform(0, 2 * np.pi, n_rocks)
    r_theta_cone = np.random.uniform(0, np.radians(30), n_rocks)
    rock_velocities[:, 0] = r_speeds * np.sin(r_theta_cone)*np.cos(r_phi)
    rock_velocities[:, 1] = r_speeds * np.sin(r_theta_cone)*np.sin(r_phi)
    rock_velocities[:, 2] = r_speeds * np.cos(r_theta_cone)

def split_particles(i, count):
    # Bu fonksiyon tanımlanmış ama içi boş, böylece kod hata vermeden çalışır.
    pass

def split_particle(i):
    global particles, velocities, colors, is_split
    # Bu fonksiyonda split_particles(i, 3) çağrısı var.
    # split_particles fonksiyonunu yukarıda boş olarak tanımladık.
    # Böylece kod çalışacak.

    original_pos = particles[i].copy()
    original_vel = velocities[i].copy()
    original_col = colors[i].copy()
    original_split = is_split[i]

    # Yeni 3 partikül oluştur
    for _ in range(3):
        # Yeni partikülleri yere çarptıkları noktada oluştur
        new_particle = np.array([original_pos[0], original_pos[1], 0])
        # 4000 m'ye kadar yükselebilecek şekilde hız ata
        v0 = np.sqrt(2 * gravity * max_height)  # ~282 m/s
        # Koni dağılımıyla hız yönünü belirle
        phi = np.random.uniform(0, 2 * np.pi)
        theta_cone = np.random.uniform(0, np.radians(30))
        # Hızı belirle (yaklaşık max_height'a ulaşacak şekilde)
        v_magnitude = np.random.uniform(100, v0)
        new_velocity_x = v_magnitude * np.sin(theta_cone) * np.cos(phi)
        new_velocity_y = v_magnitude * np.sin(theta_cone) * np.sin(phi)
        new_velocity_z = v_magnitude * np.cos(theta_cone)
        new_velocity = np.array([new_velocity_x, new_velocity_y, new_velocity_z])
        # Yeni partikülü ekle
        particles = np.vstack((particles, new_particle))
        velocities = np.vstack((velocities, new_velocity))
        colors = np.vstack((colors, original_col))
        is_split = np.append(is_split, 0)  # Yeni partiküller dağılmamış

    # Orijinal partikülü sil
    particles = np.delete(particles, i, axis=0)
    velocities = np.delete(velocities, i, axis=0)
    colors = np.delete(colors, i, axis=0)
    is_split = np.delete(is_split, i)

def update_particles_and_rocks_and_ash():
    global particles, velocities, rocks, rock_velocities, ash, ash_velocities, max_x, max_y, max_black_distance, colors, current_wind, is_split

    dt = 0.05  # Zaman adımı

    # Yeni bir rüzgar oluştur
    current_wind = generate_wind()

    # Kül partiküllerinin hızlarını hava direnci ve rüzgar ile güncelle
    ash_velocities[:, :2] *= air_resistance
    ash_velocities[:, :2] += current_wind * 0.05
    ash += ash_velocities * dt

    # Küllerin 8000 metreye ulaştığında yok olmasını sağla
    ash_mask = ash[:,2] < 8000
    ash = ash[ash_mask]
    ash_velocities = ash_velocities[ash_mask]
    # ash_colors değişkeni code snippet'te global scope'ta tanımlanmış değil, 
    # ama yukarıda ash_colors = np.ones((n_ash,3))*0.5 var. Onu da filtrele
    global ash_colors
    ash_colors = ash_colors[ash_mask]

    # Partikül hızlarını yerçekimi ve hava direnci ile güncelle
    velocities[:, 2] -= gravity * 0.5  # gravity * 0.25
    velocities[:, :2] *= air_resistance
    velocities[:, :2] += current_wind * 0.05
    particles += velocities * dt

    # Kayaç hızlarını yerçekimi ve hava direnci ile güncelle
    rock_velocities[:, 2] -= gravity * 3.0  # gravity * 5.0
    rock_velocities[:, :2] *= air_resistance
    rock_velocities[:, :2] += current_wind * 0.05
    rocks += rock_velocities * dt

    # Maksimum yükseklik sınırı (4000 m)
    # Partiküller
    over_max = particles[:,2] >= max_height
    particles[over_max,2] = max_height
    velocities[over_max,2] = -np.abs(velocities[over_max,2])  # Düşüş için negatif yap

    # Kayaçlar için maksimum yükseklik sınırı
    over_max_rocks = rocks[:,2] >= max_height
    rocks[over_max_rocks,2] = max_height
    rock_velocities[over_max_rocks,2] = -np.abs(rock_velocities[over_max_rocks,2])  # Düşüş için negatif yap

    # Plotlama sınırlarını güncellemek için maksimum x ve y değerlerini hesapla
    all_x = np.concatenate((particles[:,0], rocks[:,0], ash[:,0]))
    all_y = np.concatenate((particles[:,1], rocks[:,1], ash[:,1]))
    global max_x, max_y, max_black_distance
    max_x = max(max_x, np.max(np.abs(all_x)))
    max_y = max(max_y, np.max(np.abs(all_y)))

    # Siyah partiküllerin maksimum uzaklığını takip et
    black_indices = np.where((colors[:,0]==0) & (colors[:,1]==0) & (colors[:,2]==0))[0]
    if len(black_indices) > 0:
        black_distances = np.sqrt(particles[black_indices,0]**2 + particles[black_indices,1]**2)
        current_max_black = np.max(black_distances)
        if current_max_black > max_black_distance:
            max_black_distance = current_max_black

    # Partiküllerin yere (yükseklik <=0) ulaştığını kontrol et
    ground_hits = particles[:,2] <= 0
    ground_hit_indices = np.where(ground_hits)[0]
    for i in sorted(ground_hit_indices, reverse=True):
        if is_split[i] == 0:  # Eğer bu partikül daha önce bölünmemişse
            split_particle(i)  # Partikülü üçe böl
        else:
            particles[i,2] = 0  # Zemin seviyesinde kal

    # Kayaçların yere ulaştığını kontrol et
    rocks_ground_hits = rocks[:,2] <= 0
    for j in np.where(rocks_ground_hits)[0]:
        rocks[j,2] = 0

def update_plot(frame):
    global particles, colors, rocks, rock_color, max_x, max_y, ash, ash_colors
    ax.cla()
    update_particles_and_rocks_and_ash()

    x_range = max(max_x, vent_radius) * 1.1
    y_range = max(max_y, vent_radius) * 1.1

    all_z = np.concatenate((particles[:,2], rocks[:,2], ash[:,2]))
    max_z_ = np.max(all_z)
    max_z_range = max(max_z_, max_height * 1.5)

    ax.set_xlim([-x_range, x_range])
    ax.set_ylim([-y_range, y_range])
    ax.set_zlim([0, max_z_range])

    x = np.linspace(-x_range, x_range, 100)
    y = np.linspace(-y_range, y_range, 100)
    X, Y = np.meshgrid(x, y)
    Z = volcano_surface(X, Y)
    ax.plot_surface(X, Y, Z, color='saddlebrown', alpha=0.7)

    ax.scatter(particles[:, 0], particles[:, 1], particles[:, 2], c=colors, s=5)
    ax.scatter(rocks[:, 0], rocks[:, 1], rocks[:, 2], c=rock_color, s=25)
    ax.scatter(ash[:, 0], ash[:, 1], ash[:, 2], c=ash_colors, s=2)

    black_indices = np.where((colors[:,0]==0) & (colors[:,1]==0) & (colors[:,2]==0))[0]
    black_distances = np.sqrt(particles[black_indices,0]**2 + particles[black_indices,1]**2) if len(black_indices) >0 else [0]
    max_black = np.max(black_distances) if len(black_indices) >0 else 0

    ax.set_title(f'Frame: {frame}\nMax X: {max_x:.2f} m, Max Y: {max_y:.2f} m\nMax Black Distance: {max_black:.2f} m\nVolcanic Seismicity: ACTIVE')

def generate_wind():
    speed = np.random.uniform(50, 200)  
    angle = np.random.uniform(0, 2 * np.pi)  
    return np.array([speed * np.cos(angle), speed * np.sin(angle)])

def start_simulation(event):
    global current_wind
    current_wind = generate_wind()
    initialize_particles_and_rocks_and_ash()

fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection='3d')
initialize_particles_and_rocks_and_ash()

ax_button_start = plt.axes([0.8, 0.05, 0.1, 0.075])
button_start = Button(ax_button_start, 'Start')
button_start.on_clicked(start_simulation)

ani = animation.FuncAnimation(fig, update_plot, frames=300, interval=frame_interval)
plt.show()
