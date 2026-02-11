import tkinter as tk
from tkinter import scrolledtext
import numpy as np

#########################
# Monte Carlo Parametreleri
#########################
g = 9.81  # Yerçekimi ivmesi (m/s²)
w0 = 100  # Çıkış hızı (m/s) - Daha gerçekçi bir değer için 100 m/s'ye düşürüldü
air_resistance = 0.98

initial_mixture_density_mu = 5.74
initial_mixture_density_sigma = 0.5
mass_discharge_rate_mu = 1.5e6
mass_discharge_rate_sigma = 1e5
magma_temperature_mu = 1273.15
magma_temperature_sigma = 50
volatile_content_a = 3
volatile_content_b = 2
gas_constant_mu = 462
gas_constant_sigma = 50
Cva_min = 680
Cva_max = 740
Cvg_alpha = 2
Cvg_beta = 0.5
Cvs_mu = 1100
Cvs_sigma = 100

def simulate_distribution(n=1000):
    initial_mixture_density = np.random.normal(initial_mixture_density_mu, initial_mixture_density_sigma, n)
    mass_discharge_rate = np.random.normal(mass_discharge_rate_mu, mass_discharge_rate_sigma, n)
    magma_temperature = np.random.normal(magma_temperature_mu, magma_temperature_sigma, n)
    volatile_content = np.random.beta(volatile_content_a, volatile_content_b, n) * 100
    gas_constant = np.random.normal(gas_constant_mu, gas_constant_sigma, n)
    Cva = np.random.triangular(Cva_min, (Cva_min + Cva_max) / 2, Cva_max, n)
    Cvg = np.random.gamma(Cvg_alpha, Cvg_beta, n)
    Cvs = np.random.normal(Cvs_mu, Cvs_sigma, n)
    return {
        'initial_mixture_density': np.mean(initial_mixture_density),
        'mass_discharge_rate': np.mean(mass_discharge_rate),
        'magma_temperature': np.mean(magma_temperature),
        'volatile_content': np.mean(volatile_content),
        'gas_constant': np.mean(gas_constant),
        'Cva': np.mean(Cva),
        'Cvg': np.mean(Cvg),
        'Cvs': np.mean(Cvs)
    }

dist_results = simulate_distribution()

#########################
# Parametreler
#########################
vent_radius = 500       # Ventin yarıçapı (m)
vent_height = 1421      # Ventin yüksekliği (m)

# Partikül ve kayaç sayısı
n_particles = 100
n_rocks = 20

# Partiküller
particles = np.zeros((n_particles, 2))      # 2D konum (x, y)
velocities = np.zeros((n_particles, 2))     # 2D hız (vx, vy)

# Kayaçlar
rocks = np.zeros((n_rocks, 2))              # 2D konum (x, y)
rock_velocities = np.zeros((n_rocks, 2))    # 2D hız (vx, vy)

# Simülasyon ayarları
current_wind = np.array([0.0, 0.0])

# Simülasyon hızı ve süresi
steps_per_frame = 100  # Her frame için 100 adım
total_frames = 300     # Toplam frame sayısı

# Maksimum mesafe takibi
max_particle_distance = 0
max_particle_id = -1
max_particle_pos = np.array([0.0, 0.0])

max_rock_distance = 0
max_rock_id = -1
max_rock_pos = np.array([0.0, 0.0])

# Kayaç çarpma hızları
rock_impact_speeds = [None] * n_rocks

def initialize():
    global particles, velocities, rocks, rock_velocities
    global max_particle_distance, max_particle_id, max_particle_pos
    global max_rock_distance, max_rock_id, max_rock_pos, rock_impact_speeds
    global current_wind
    
    # Rüzgarın rastgele hızı ve yönü (10-30 m/s)
    wind_magnitude = np.random.uniform(10, 30)  # m/s
    wind_direction = np.random.uniform(0, 2 * np.pi)  # Radyan cinsinden
    current_wind = np.array([
        wind_magnitude * np.cos(wind_direction),
        wind_magnitude * np.sin(wind_direction)
    ])
    
    # Partiküllerin rastgele yönlerde fırlatılması
    theta_p = np.random.uniform(0, 2 * np.pi, n_particles)
    speed_p = np.random.uniform(w0 / 2, w0, n_particles)  # Hız aralığı: 50-100 m/s
    velocities[:, 0] = speed_p * np.cos(theta_p)  # vx
    velocities[:, 1] = speed_p * np.sin(theta_p)  # vy
    # Partiküllerin başlangıç konumu (vent noktası)
    particles[:, 0] = 0.0
    particles[:, 1] = vent_height
    
    # Kayaçların rastgele yönlerde fırlatılması
    theta_r = np.random.uniform(0, 2 * np.pi, n_rocks)
    speed_r = np.random.uniform(w0 / 2, w0, n_rocks)  # Hız aralığı: 50-100 m/s
    rock_velocities[:, 0] = speed_r * np.cos(theta_r)  # vx
    rock_velocities[:, 1] = speed_r * np.sin(theta_r)  # vy
    # Kayaçların başlangıç konumu (vent noktası)
    rocks[:, 0] = 0.0
    rocks[:, 1] = vent_height
    
    # Takip değişkenlerini sıfırlama
    max_particle_distance = 0
    max_particle_id = -1
    max_particle_pos = np.array([0.0, 0.0])
    
    max_rock_distance = 0
    max_rock_id = -1
    max_rock_pos = np.array([0.0, 0.0])
    rock_impact_speeds[:] = [None] * n_rocks

def run_simulation():
    global particles, velocities, rocks, rock_velocities
    global max_particle_distance, max_particle_id, max_particle_pos
    global max_rock_distance, max_rock_id, max_rock_pos, rock_impact_speeds
    global current_wind
    
    print("Simülasyon başlatılıyor...")
    initialize()
    wind_speed = np.linalg.norm(current_wind)
    wind_angle = np.arctan2(current_wind[1], current_wind[0]) * 180 / np.pi  # Derece cinsinden
    wind_angle = wind_angle if wind_angle >=0 else wind_angle + 360  # 0-360 derece aralığı
    print(f"Rüzgar Hızı: {wind_speed:.2f} m/s")
    print(f"Rüzgar Yönü: {wind_angle:.2f} derece\n")
    
    print("Monte Carlo Parametreleri:")
    for k, v in dist_results.items():
        print(f"{k}: {v:.2f}")
    print("\nSimülasyon başlıyor...\n")
    
    for frame in range(total_frames):
        for _ in range(steps_per_frame):
            # Partiküllerin hız ve konum güncellenmesi
            velocities[:, 1] -= g * 0.05  # Yerçekimi
            velocities[:, 0] *= air_resistance  # Hava direnci
            velocities[:, 0] += current_wind[0] * 0.05  # Rüzgar etkisi x
            velocities[:, 1] += current_wind[1] * 0.05  # Rüzgar etkisi y
            particles += velocities * 0.05  # Konum güncellemesi
            
            # Kayaçların hız ve konum güncellenmesi
            rock_velocities[:, 1] -= g * 0.05 * 5  # Kayaçlar için daha güçlü yerçekimi
            rock_velocities[:, 0] *= air_resistance  # Hava direnci
            rock_velocities[:, 0] += current_wind[0] * 0.05  # Rüzgar etkisi x
            rock_velocities[:, 1] += current_wind[1] * 0.05  # Rüzgar etkisi y
            rocks += rock_velocities * 0.05  # Konum güncellemesi
            
            # En uzağa giden partikülün takibi
            distances_p = np.sqrt(particles[:, 0]**2 + particles[:, 1]**2)
            current_max_particle_distance = np.max(distances_p)
            if current_max_particle_distance > max_particle_distance:
                max_particle_distance = current_max_particle_distance
                max_particle_id = np.argmax(distances_p)
                max_particle_pos = particles[max_particle_id].copy()
            
            # En uzağa giden kayaçın takibi
            distances_r = np.sqrt(rocks[:, 0]**2 + rocks[:, 1]**2)
            current_max_rock_distance = np.max(distances_r)
            if current_max_rock_distance > max_rock_distance:
                max_rock_distance = current_max_rock_distance
                max_rock_id = np.argmax(distances_r)
                max_rock_pos = rocks[max_rock_id].copy()
            
            # Kayaç çarpma hızı
            for j in range(n_rocks):
                if rocks[j, 1] <= 0 and rock_impact_speeds[j] is None:
                    speed_magnitude = np.linalg.norm(rock_velocities[j])
                    rock_impact_speeds[j] = speed_magnitude
        
        # İsteğe bağlı olarak, her 50 frame'de bir ilerlemeyi yazdır
        if (frame +1) % 50 ==0 or frame ==0:
            print(f"{frame +1}. Frame tamamlandı.")
    
    print("\nSimülasyon tamamlandı.\n")
    print_results()

def print_results():
    global dist_results
    global max_particle_distance, max_particle_id, max_particle_pos
    global max_rock_distance, max_rock_id, max_rock_pos, rock_impact_speeds

    root = tk.Tk()
    root.title("Simülasyon Raporu")

    # Add a scrolled text widget to display the results
    text_area = scrolledtext.ScrolledText(root, wrap=tk.WORD, width=80, height=30, font=("Courier", 12))
    text_area.pack(padx=10, pady=10)

    def append_to_text_area(content):
        text_area.insert(tk.END, content + "\n")
        text_area.see(tk.END)

    append_to_text_area("#############################")
    append_to_text_area("        Simülasyon Raporu    ")
    append_to_text_area("#############################\n")
    
    append_to_text_area("Monte Carlo Simülasyon Sonuçları:")
    for k, v in dist_results.items():
        append_to_text_area(f"{k}: {v:.2f}")
    
    append_to_text_area("\nEn Uzağa Giden Partikül:")
    if max_particle_id != -1:
        max_particle_distance_km = int(max_particle_distance / 1000)
        max_particle_x_km = int(max_particle_pos[0] / 1000)
        max_particle_y_km = int(max_particle_pos[1] / 1000)
        append_to_text_area(f"  ID: {max_particle_id}")
        append_to_text_area(f"  Yanardağ bacasından Mesafe: {(max_particle_distance_km)/100} km")
        append_to_text_area(f"  Konum: X = {(max_particle_x_km)} km, Y = {(max_particle_y_km)/100} km")
    else:
        append_to_text_area("  Partiküller henüz hareket etmedi.")
    
    append_to_text_area("\nEn Uzağa Giden Kayaç:")
    if max_rock_id != -1:
        max_rock_distance_km = int(max_rock_distance / 1000)
        max_rock_x_km = int(max_rock_pos[0] / 1000)
        max_rock_y_km = int(max_rock_pos[1] / 1000)
        append_to_text_area(f"  ID: {max_rock_id}")
        append_to_text_area(f"  Yanardağ bacasından Mesafe: {(max_rock_distance_km)/10} m")
        append_to_text_area(f"  Konum: X = {(max_rock_x_km)*20} m, Y = {(max_rock_y_km)/10} m")
        if rock_impact_speeds[max_rock_id] is not None:
            rock_impact_speed = int(rock_impact_speeds[max_rock_id])
            append_to_text_area(f"  Çarpma Hızı: {(rock_impact_speed)*2} m/s")
        else:
            append_to_text_area("  Kayaç yere çarpmadı veya hız kaydı yok.")
    else:
        append_to_text_area("  Kayaçlar henüz hareket etmedi.")
    
    if max_rock_distance > 0:
        max_rock_distance_km = int(max_rock_distance / 1000)
        append_to_text_area(f"""\nKaya altında kalmamak için en uzak kayaç mesafesi olan {(max_rock_distance_km)/10} m uzak durun! """
                            f"""Düşününce ezilmeyi hesap edecek kadar yakınsanız zaten ölüsünüz, 
                            Ama yine de iyi kaçmaya çalışmalar :)""")
    else:
        append_to_text_area(f"\nKaya altında kalmamak için uzak durun! Ama ezilmeyi hesap edecek kadar yakınsanız zaten ölüsünüz, "
                            f"ama yine de iyi kaçmaya çalışmalar :)")
    
    append_to_text_area("\n#############################")

    root.mainloop()

if __name__ == "__main__":
    run_simulation()
