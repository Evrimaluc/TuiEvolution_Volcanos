import numpy as np
import matplotlib.pyplot as plt

# Önceki parametrelerden bazılarını kullanıyoruz (temsilî):
g = 9.81  # Yerçekimi
w0 = 800  # Çıkış hızı
air_resistance = 0.98

# Monte Carlo sonuçlarını varsayım olarak alıyoruz (daha önce elde edilmesi gerekirdi)
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
    volatile_content = np.random.beta(volatile_content_a, volatile_content_b, n)*100
    gas_constant = np.random.normal(gas_constant_mu, gas_constant_sigma, n)
    Cva = np.random.triangular(Cva_min, (Cva_min+Cva_max)/2, Cva_max, n)
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

# Önceki simülasyonda kullanılan bazı varsayılan parametreler
intensity = 50
vent_radius = 500       # metre
vent_height = 1421      # metre
spread = 50             # Rastgele bir yayılım parametresi
time = 0                # Patlama anı

def energy_at_distance(distance, intensity, time, decay_factor=0.1):
    energy = intensity / (1 + decay_factor*(distance**2))
    return energy

def temperature_at_distance(distance, magma_temp, spread):
    T = magma_temp * np.exp(-distance/spread)
    return T

distances = np.arange(0, 110, 10)  # 0,10,20,...,100

magma_temp = dist_results['magma_temperature']  # ortalama magma sıcaklığı (K)
adjusted_intensity = intensity * (dist_results['mass_discharge_rate'] / 1.5e6) 

energies = [energy_at_distance(d, adjusted_intensity, time) for d in distances]
temperatures = [temperature_at_distance(d, magma_temp, spread) for d in distances]

# Şehirlerin mesafelerini rastgele belirle (0-100 km arası)
evrim_dist = np.random.uniform(0, 100)
bugra_dist = np.random.uniform(0, 100)
tuana_dist = np.random.uniform(0, 100)

cities = [
    (evrim_dist, "Evrim"),
    (bugra_dist, "Buğra"),
    (tuana_dist, "Tuana")
]

energy_death_threshold = 20     
temperature_death_threshold = 473  

def is_survivable(distance):
    E = energy_at_distance(distance, adjusted_intensity, time)
    T = temperature_at_distance(distance, magma_temp, spread)
    if E > energy_death_threshold or T > temperature_death_threshold:
        return False
    return True

city_survival = []
for (cdist, cname) in cities:
    survive = is_survivable(cdist)
    city_survival.append((cname, cdist, survive))

fig, ax1 = plt.subplots(figsize=(10,6))
color_energy = 'tab:red'
color_temp = 'tab:blue'

ax1.set_xlabel('Mesafe (km)')
ax1.set_ylabel('Enerji (J)', color=color_energy)
ax1.plot(distances, energies, color=color_energy, marker='o', label='Enerji')
ax1.tick_params(axis='y', labelcolor=color_energy)

ax2 = ax1.twinx()
ax2.set_ylabel('Sıcaklık (K)', color=color_temp)
ax2.plot(distances, temperatures, color=color_temp, marker='s', label='Sıcaklık')
ax2.tick_params(axis='y', labelcolor=color_temp)

plt.title('Volkan Patlaması: Mesafeye Göre Enerji ve Sıcaklık')

for cname, cdist, survive in city_survival:
    ax1.axvline(cdist, color='green' if survive else 'black', linestyle='--', alpha=0.7)
    text_ypos = ax1.get_ylim()[1]*0.7  
    status = "Yaşar" if survive else "Ölür"
    ax1.text(cdist, text_ypos, f"{cname}\n{cdist:.1f} km\n{status}", ha='center', color='white', 
             bbox=dict(facecolor='green' if survive else 'red', alpha=0.7))

plt.show()
