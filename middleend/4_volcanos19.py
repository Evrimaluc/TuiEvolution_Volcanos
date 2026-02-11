import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.widgets import Button, RadioButtons

# Parametrelerin tanımlanması
vent_radius = 50  # Yanardağ çapı (m)
vent_height = 20  # Yanardağ yüksekliği (m)
n_particles = 500  # Partikül sayısı
g = 9.81  # Yerçekimi ivmesi (m/s^2)
sigma = 1000.0  # Partikül yoğunluğu (kg/m^3)
mu = 1.81e-5   # Havanın dinamik viskozitesi (kg/(m.s))
rho_a = 1.225  # Hava yoğunluğu (kg/m^3)
particle_diameter = 0.1  # Partikül çapı (m)
w0 = 134.0  # Çıkış hızı (m/s)
T0 = 1273.15  # Magma sıcaklığı (K)
frame_interval = 100  # Animasyon kare süresi (ms)
current_wind = np.array([0.0, 0.0])  # Başlangıçta rüzgar etkisi yok (x, y bileşenleri)
current_model = 'Volcano'  # Başlangıç modeli
start_time = 0  # Simülasyon başlangıç zamanı
eruption_time = 10  # Patlamanın başlangıcı

# Partiküller ve hızlar
particles = np.zeros((n_particles, 3))  # x, y, z koordinatları
velocities = np.zeros((n_particles, 3))  # x, y, z hız bileşenleri

# Terminal hız hesaplaması
def calculate_terminal_velocity(Re, particle_diameter, sigma, mu, rho_a):
    if Re > 500.0:
        Vt = 3.1 * np.sqrt(g * sigma * particle_diameter / rho_a)
    elif Re > 6.0:
        Vt = (particle_diameter * 4 * g * sigma) / (225.0 * mu * rho_a) * (1 / 3)
    else:
        Vt = (g * sigma * particle_diameter**2) / (18.0 * mu)
    return Vt

# Partikülleri başlat
def initialize_particles():
    global particles, velocities
    theta = np.random.uniform(0, 2 * np.pi, n_particles)
    r = np.random.uniform(0, vent_radius / 3, n_particles)
    particles[:, 0] = r * np.cos(theta)
    particles[:, 1] = r * np.sin(theta)
    particles[:, 2] = vent_height

    # Reynolds sayısı ve terminal hız hesaplaması
    Re = (sigma * particle_diameter * w0) / mu
    terminal_velocity = calculate_terminal_velocity(Re, particle_diameter, sigma, mu, rho_a)

    velocities[:, 0] = np.random.uniform(-terminal_velocity, terminal_velocity, n_particles)
    velocities[:, 1] = np.random.uniform(-terminal_velocity, terminal_velocity, n_particles)
    velocities[:, 2] = np.random.uniform(30, 50, n_particles)

# Yanardağ yüzeyi fonksiyonu
def volcano_surface(x, y, height_factor=0.4, radius=vent_radius):
    r = np.sqrt(x**2 + y**2)
    return height_factor * (1 - np.sqrt(r / radius)) * radius

# Magma patlama fonksiyonu
def simulate_volcano_eruption(intensity, base_size, height, spread, time, eruption_time):
    x = np.linspace(-base_size, base_size, 200)
    y = np.linspace(-base_size, base_size, 200)
    x, y = np.meshgrid(x, y)
    z_base = height - np.sqrt(x**2 + y**2)
    eruption = np.zeros_like(z_base)
    if time >= eruption_time:
        eruption = intensity * np.exp(-np.sqrt((x**2 + y**2) + (time-eruption_time)**2) / spread)
    z = np.clip(z_base + eruption, 0, height + 30)
    return x, y, z

# Rüzgar oluşturma fonksiyonu
def generate_random_wind():
    speed = np.random.uniform(0, 1.0)  # Rüzgar hızı (m/s)
    angle = np.random.uniform(0, 2 * np.pi)  # Rüzgar yönü (radyan)
    return np.array([speed * np.cos(angle), speed * np.sin(angle)])

# Partikülleri renklendir
def get_particle_colors():
    colors = np.zeros((n_particles, 3))
    n_per_group = n_particles // 4

    colors[:n_per_group] = [1, 0, 0]  # Kırmızı
    colors[n_per_group:2 * n_per_group] = [1, 1, 0]  # Sarı
    colors[2 * n_per_group:3 * n_per_group] = [0.5, 0.5, 0.5]  # Gri
    colors[3 * n_per_group:] = [0, 0, 0]  # Siyah

    return colors

# Partikülleri güncelle
def update_particles():
    global particles, velocities, current_wind
    velocities[:, 2] -= g * 0.1  # Yerçekimi etkisi
    particles += velocities * 0.1  # Hareket

    # Hava direnci ve rüzgar etkisi
    velocities[:, 0:2] *= 0.98  # Hava direnci
    velocities[:, 0] += current_wind[0]  # Rüzgar x bileşeni
    velocities[:, 1] += current_wind[1]  # Rüzgar y bileşeni

    # Partiküller yere çarptığında yanardağın eğiminde kayma
    for i in range(len(particles)):
        if particles[i, 2] <= volcano_surface(particles[i, 0], particles[i, 1]):
            particles[i, 2] = volcano_surface(particles[i, 0], particles[i, 1])
            velocities[i, 0] *= 0.9  # Yavaşlama
            velocities[i, 1] *= 0.9
            velocities[i, 2] = 0  # Z ekseni hareketini durdur

# Simülasyonu güncelle ve çiz
def update_plot(frame):
    global start_time
    ax.cla()  # Eksenleri temizle
    update_particles()

    # Yanardağ yüzeyini çiz
    x = np.linspace(-vent_radius, vent_radius, 100)
    y = np.linspace(-vent_radius, vent_radius, 100)
    X, Y = np.meshgrid(x, y)
    Z = volcano_surface(X, Y)
    ax.plot_surface(X, Y, Z, cmap='copper', alpha=0.6)

    # Partikülleri renklendir
    colors = get_particle_colors()  # Partikülleri 3 grupta renklendir
    ax.scatter(particles[:, 0], particles[:, 1], particles[:, 2], c=colors, s=2)

    # Patlama simülasyonu
    if current_model == 'Magma':
        # Magma parametreleri
        intensity = 50
        base_size = vent_radius
        height = vent_height
        spread = 20
        time = start_time + frame * frame_interval / 1000.0  # Geçen zamanı hesapla
        x, y, z = simulate_volcano_eruption(intensity, base_size, height, spread, time, eruption_time)
        ax.plot_surface(x, y, z, cmap='hot', edgecolor='none', alpha=0.5)
        ax.set_title('Magma Model')
    else:  # 'Magma' modeline geçildiğinde
        ax.set_title('Volcano Model')

    ax.set_xlabel('X Distance')
    ax.set_ylabel('Y Distance')
    ax.set_zlabel('Height')
    ax.set_zlim(0, vent_height + 30)

# Model seçici
def set_model(label):
    global current_model
    current_model = label
    initialize_particles()

# Animasyonu başlatma fonksiyonu
def start_simulation(event):
    global current_wind, start_time
    current_wind = generate_random_wind()
    start_time = 0  # Simülasyon başlangıç zamanını sıfırla
    initialize_particles()

# Grafik ayarları
fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection='3d')

# Başlat düğmesi
ax_button_start = plt.axes([0.8, 0.02, 0.1, 0.05])
button_start = Button(ax_button_start, 'Start')
button_start.on_clicked(start_simulation)

# Model seçici radyo düğmeleri
ax_radio = plt.axes([0.02, 0.7, 0.2, 0.2])
radio = RadioButtons(ax_radio, ('Volcano', 'Magma'))
radio.on_clicked(set_model)

# Animasyon
ani = animation.FuncAnimation(fig, update_plot, frames=100, interval=frame_interval)
plt.show()
