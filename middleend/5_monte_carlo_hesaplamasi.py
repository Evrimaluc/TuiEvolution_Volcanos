import numpy as np
import pandas as pd
import tkinter as tk
from tkinter import scrolledtext

# #########################
# # Monte Carlo Parametreleri
# #########################
g = 9.81  # Yerçekimi ivmesi (m/s²)
air_resistance = 0.98
wind = np.array([0.0, 0.0])  # Rüzgar hızı (m/s)

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
    """
    Monte Carlo simülasyonu ile parametrelerin ortalama ve standart sapmalarını hesaplar.
    """
    initial_mixture_density = np.random.normal(initial_mixture_density_mu, initial_mixture_density_sigma, n)
    mass_discharge_rate = np.random.normal(mass_discharge_rate_mu, mass_discharge_rate_sigma, n)
    magma_temperature = np.random.normal(magma_temperature_mu, magma_temperature_sigma, n)
    volatile_content = np.random.beta(volatile_content_a, volatile_content_b, n) * 100
    gas_constant = np.random.normal(gas_constant_mu, gas_constant_sigma, n)
    Cva = np.random.triangular(Cva_min, (Cva_min + Cva_max) / 2, Cva_max, n)
    Cvg = np.random.gamma(Cvg_alpha, Cvg_beta, n)
    Cvs = np.random.normal(Cvs_mu, Cvs_sigma, n)
    return {
        'Initial Mixture Density (kg/m³)': {
            'Mean': np.mean(initial_mixture_density),
            'Std Dev': np.std(initial_mixture_density)
        },
        'Mass Discharge Rate (kg/s)': {
            'Mean': np.mean(mass_discharge_rate),
            'Std Dev': np.std(mass_discharge_rate)
        },
        'Magma Temperature (K)': {
            'Mean': np.mean(magma_temperature),
            'Std Dev': np.std(magma_temperature)
        },
        'Volatile Content (%)': {
            'Mean': np.mean(volatile_content),
            'Std Dev': np.std(volatile_content)
        },
        'Gas Constant': {
            'Mean': np.mean(gas_constant),
            'Std Dev': np.std(gas_constant)
        },
        'Cva': {
            'Mean': np.mean(Cva),
            'Std Dev': np.std(Cva)
        },
        'Cvg': {
            'Mean': np.mean(Cvg),
            'Std Dev': np.std(Cvg)
        },
        'Cvs': {
            'Mean': np.mean(Cvs),
            'Std Dev': np.std(Cvs)
        }
    }

# #########################
# # Simülasyon Parametreleri
# #########################
vent_radius = 500       # Ventin yarıçapı (m)
vent_height = 1421      # Ventin yüksekliği (m)

# Partikül sayısı: 25 sarı, 25 turuncu, 25 kırmızı, 25 siyah
n_particles = 100
n_yellow = 25
n_orange = 25
n_red = 25
n_black = 25

n_ash = 300             # Kül partikülü sayısı
n_rocks = 20            # Kayaç sayısı

w0 = 800  # Çıkış hızı (m/s)

# #########################
# # Fonksiyonlar
# #########################
def initialize_simulation():
    """
    Parçacıkların ve kayaçların başlangıç konum ve hızlarını belirler.
    """
    # Küller (Ash) - Bu sefer dahil etmeyeceğiz çünkü simülasyon döngüsünü kaldırıyoruz.
    
    # Partiküller
    particles_pos = np.zeros((n_particles, 3))
    particles_vel = np.zeros((n_particles, 3))
    colors = np.zeros((n_particles, 3))
    
    theta_p = np.random.uniform(0, 2 * np.pi, n_particles)
    phi_p = np.random.uniform(0, np.pi / 2, n_particles)  # Çıkış açısı (0 ile 90 derece arasında)
    v_p = np.random.uniform(w0 / 2, w0, n_particles)  # Çıkış hızı
    
    particles_vel[:, 0] = v_p * np.cos(phi_p) * np.cos(theta_p)
    particles_vel[:, 1] = v_p * np.cos(phi_p) * np.sin(theta_p)
    particles_vel[:, 2] = v_p * np.sin(phi_p)
    
    particles_pos[:, 0] = 0
    particles_pos[:, 1] = 0
    particles_pos[:, 2] = vent_height
    
    # Renk ataması: 25 sarı, 25 turuncu, 25 kırmızı, 25 siyah
    colors[:n_yellow] = [1, 1, 0]             # Sarı
    colors[n_yellow:n_yellow + n_orange] = [1, 0.5, 0]  # Turuncu
    colors[n_yellow + n_orange:n_yellow + n_orange + n_red] = [1, 0, 0]  # Kırmızı
    colors[n_yellow + n_orange + n_red:] = [0, 0, 0]  # Siyah
    
    # Kayaçlar
    rocks_pos = np.zeros((n_rocks, 3))
    rocks_vel = np.zeros((n_rocks, 3))
    rocks_color = np.zeros((n_rocks, 3))
    rocks_color[:] = [0, 0, 0]  # Siyah renk
    
    theta_r = np.random.uniform(0, 2 * np.pi, n_rocks)
    phi_r = np.random.uniform(0, np.pi / 2, n_rocks)  # Çıkış açısı
    v_r = np.random.uniform(w0 / 2, w0, n_rocks)  # Çıkış hızı
    
    rocks_vel[:, 0] = v_r * np.cos(phi_r) * np.cos(theta_r)
    rocks_vel[:, 1] = v_r * np.cos(phi_r) * np.sin(theta_r)
    rocks_vel[:, 2] = v_r * np.sin(phi_r)
    
    rocks_pos[:, 0] = 0
    rocks_pos[:, 1] = 0
    rocks_pos[:, 2] = vent_height
    
    return particles_pos, particles_vel, colors, rocks_pos, rocks_vel, rocks_color

def calculate_trajectory(v0, theta, phi):
    """
    Hava direnci ve rüzgar etkisini ihmal ederek mermi hareketi denklemlerini kullanarak
    maksimum mesafe ve uçuş süresini hesaplar.
    """
    # Uçuş süresi
    t_flight = (2 * v0 * np.sin(phi)) / g
    
    # Maksimum yatay mesafe
    range_x = v0 * np.cos(phi) * t_flight
    
    return t_flight, range_x

def calculate_results():
    """
    Simülasyon olmadan parçacık ve kayaçların maksimum mesafe ve çarpma hızlarını hesaplar.
    """
    particles_pos, particles_vel, colors, rocks_pos, rocks_vel, rocks_color = initialize_simulation()
    
    # Parçacıklar için hesaplamalar
    particle_ranges = []
    particle_flight_times = []
    particle_final_speeds = []
    for i in range(n_particles):
        v0 = np.linalg.norm(particles_vel[i])
        theta = np.arctan2(particles_vel[i, 1], particles_vel[i, 0])
        phi = np.arcsin(particles_vel[i, 2] / v0)
        
        t_flight, range_p = calculate_trajectory(v0, theta, phi)
        particle_ranges.append(range_p)
        particle_flight_times.append(t_flight)
        
        # Çarpma anındaki hız (sadece yerçekimi etkisi)
        v_final = np.sqrt(particles_vel[i, 0]**2 + particles_vel[i, 1]**2 + (particles_vel[i, 2] - g * t_flight)**2)
        particle_final_speeds.append(v_final)
    
    max_particle_distance = np.max(particle_ranges)
    max_particle_id = np.argmax(particle_ranges)
    max_particle_pos = particles_pos[max_particle_id] + particles_vel[max_particle_id] * particle_flight_times[max_particle_id]
    
    # Kayaçlar için hesaplamalar
    rock_ranges = []
    rock_flight_times = []
    rock_final_speeds = []
    for i in range(n_rocks):
        v0 = np.linalg.norm(rocks_vel[i])
        theta = np.arctan2(rocks_vel[i, 1], rocks_vel[i, 0])
        phi = np.arcsin(rocks_vel[i, 2] / v0)
        
        t_flight, range_r = calculate_trajectory(v0, theta, phi)
        rock_ranges.append(range_r)
        rock_flight_times.append(t_flight)
        
        # Çarpma anındaki hız
        v_final = np.sqrt(rocks_vel[i, 0]**2 + rocks_vel[i, 1]**2 + (rocks_vel[i, 2] - g * t_flight)**2)
        rock_final_speeds.append(v_final)
    
    max_rock_distance = np.max(rock_ranges)
    max_rock_id = np.argmax(rock_ranges)
    max_rock_pos = rocks_pos[max_rock_id] + rocks_vel[max_rock_id] * rock_flight_times[max_rock_id]
    max_rock_speed = rock_final_speeds[max_rock_id]
    
    return {
        'max_particle_distance': max_particle_distance,
        'max_particle_id': max_particle_id,
        'max_particle_pos': max_particle_pos,
        'max_particle_speed': particle_final_speeds[max_particle_id],
        'max_rock_distance': max_rock_distance,
        'max_rock_id': max_rock_id,
        'max_rock_pos': max_rock_pos,
        'max_rock_speed': max_rock_speed
    }

# #########################
# # Deneme ve Raporlama
# #########################
def perform_trials(trial_counts):
    """
    Belirtilen deneme sayılarına göre hesaplamaları yapar ve sonuçları raporlar.
    """
    results = []
    report_lines = []
    for count in trial_counts:
        report_lines.append(f"\n{count} Deneme Başlatılıyor...")
        print(f"\n{count} Deneme Başlatılıyor...")
        trial_result = calculate_results()
        results.append(trial_result)
        report_lines.append(f"{count} Deneme Tamamlandı.")
        print(f"{count} Deneme Tamamlandı.")
    
    # Raporlama
    for idx, count in enumerate(trial_counts):
        report_lines.append(f"\n===== {count} Deneme Sonuçları =====")
        print(f"\n===== {count} Deneme Sonuçları =====")
        trial = results[idx]
        report_lines.append(f"En Uzağa Giden Partikül ID: {trial['max_particle_id']}, Mesafe: {trial['max_particle_distance']:.2f} m")
        print(f"En Uzağa Giden Partikül ID: {trial['max_particle_id']}, Mesafe: {trial['max_particle_distance']:.2f} m")
        report_lines.append(f"Partikül Konumu: X={trial['max_particle_pos'][0]:.2f}, Y={trial['max_particle_pos'][1]:.2f}, Z={trial['max_particle_pos'][2]:.2f}")
        print(f"Partikül Konumu: X={trial['max_particle_pos'][0]:.2f}, Y={trial['max_particle_pos'][1]:.2f}, Z={trial['max_particle_pos'][2]:.2f}")
        report_lines.append(f"Partikül Çarpma Hızı: {trial['max_particle_speed']:.2f} m/s")
        print(f"Partikül Çarpma Hızı: {trial['max_particle_speed']:.2f} m/s")
        
        report_lines.append(f"En Uzağa Giden Kayaç ID: {trial['max_rock_id']}, Mesafe: {trial['max_rock_distance']:.2f} m")
        print(f"En Uzağa Giden Kayaç ID: {trial['max_rock_id']}, Mesafe: {trial['max_rock_distance']:.2f} m")
        report_lines.append(f"Kayaç Konumu: X={trial['max_rock_pos'][0]:.2f}, Y={trial['max_rock_pos'][1]:.2f}, Z={trial['max_rock_pos'][2]:.2f}")
        print(f"Kayaç Konumu: X={trial['max_rock_pos'][0]:.2f}, Y={trial['max_rock_pos'][1]:.2f}, Z={trial['max_rock_pos'][2]:.2f}")
        report_lines.append(f"Kayaç Çarpma Hızı: {trial['max_rock_speed']:.2f} m/s")
        print(f"Kayaç Çarpma Hızı: {trial['max_rock_speed']:.2f} m/s")
    
    # İstatistiklerin Hesaplanması
    max_particle_distances = [res['max_particle_distance'] for res in results]
    max_rock_distances = [res['max_rock_distance'] for res in results]
    rock_speeds = [res['max_rock_speed'] for res in results]
    
    # Genel İstatistikler
    report_lines.append("\n===== Genel İstatistikler =====")
    print("\n===== Genel İstatistikler =====")
    for count, res in zip(trial_counts, results):
        report_lines.append(f"\n{count} Deneme için:")
        print(f"\n{count} Deneme için:")
        report_lines.append(f"  En Uzağa Giden Partikül Mesafesi: {res['max_particle_distance']:.2f} m")
        print(f"  En Uzağa Giden Partikül Mesafesi: {res['max_particle_distance']:.2f} m")
        report_lines.append(f"  En Uzağa Giden Kayaç Mesafesi: {res['max_rock_distance']:.2f} m")
        print(f"  En Uzağa Giden Kayaç Mesafesi: {res['max_rock_distance']:.2f} m")
        report_lines.append(f"  En Uzağa Giden Kayaç Çarpma Hızı: {res['max_rock_speed']:.2f} m/s")
        print(f"  En Uzağa Giden Kayaç Çarpma Hızı: {res['max_rock_speed']:.2f} m/s")
    
    # Ortalama ve Standart Sapma
    avg_particle_distance = np.mean(max_particle_distances)
    std_particle_distance = np.std(max_particle_distances)
    avg_rock_distance = np.mean(max_rock_distances)
    std_rock_distance = np.std(max_rock_distances)
    avg_rock_speed = np.mean(rock_speeds)
    std_rock_speed = np.std(rock_speeds)
    
    report_lines.append(f"\nTüm Denemeler İçin Ortalama Partikül Mesafesi: {avg_particle_distance:.2f} m")
    report_lines.append(f"Tüm Denemeler İçin Partikül Mesafesi Standart Sapması: {std_particle_distance:.2f} m")
    report_lines.append(f"Tüm Denemeler İçin Ortalama Kayaç Mesafesi: {avg_rock_distance:.2f} m")
    report_lines.append(f"Tüm Denemeler İçin Kayaç Mesafesi Standart Sapması: {std_rock_distance:.2f} m")
    report_lines.append(f"Tüm Denemeler İçin Ortalama Kayaç Çarpma Hızı: {avg_rock_speed:.2f} m/s")
    report_lines.append(f"Tüm Denemeler İçin Kayaç Çarpma Hızı Standart Sapması: {std_rock_speed:.2f} m/s")
    
    print(f"\nTüm Denemeler İçin Ortalama Partikül Mesafesi: {avg_particle_distance:.2f} m")
    print(f"Tüm Denemeler İçin Partikül Mesafesi Standart Sapması: {std_particle_distance:.2f} m")
    print(f"Tüm Denemeler İçin Ortalama Kayaç Mesafesi: {avg_rock_distance:.2f} m")
    print(f"Tüm Denemeler İçin Kayaç Mesafesi Standart Sapması: {std_rock_distance:.2f} m")
    print(f"Tüm Denemeler İçin Ortalama Kayaç Çarpma Hızı: {avg_rock_speed:.2f} m/s")
    print(f"Tüm Denemeler İçin Kayaç Çarpma Hızı Standart Sapması: {std_rock_speed:.2f} m/s")
    
    # Tkinter Penceresinde Raporu Gösterme
    root = tk.Tk()
    root.title("Monte Carlo Simulation Report")
    
    # Pencere Boyutunu Ayarla
    root.geometry("800x600")
    
    # Kaydırılabilir Metin Alanı Oluştur
    txt = scrolledtext.ScrolledText(root, wrap=tk.WORD, font=("Helvetica", 10))
    txt.pack(expand=True, fill='both')
    
    # Raporu Ekleyin
    txt.insert(tk.END, "\n".join(report_lines))
    
    # Metni Okunabilir Hale Getirin
    txt.configure(state='disabled')
    
    root.mainloop()

# #########################
# # Çalıştırma
# #########################
if __name__ == "__main__":
    # Deneme sayıları listesi
    trial_counts = [10, 100, 1000]
    perform_trials(trial_counts)
