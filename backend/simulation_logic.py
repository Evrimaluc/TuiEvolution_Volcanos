import numpy as np

# --- Fiziksel Sabitler ---
g = 9.81
air_resistance_base = 0.95 

# Monte Carlo Parametre Dağılımları
params = {
    'initial_mixture_density': {'mu': 2500, 'sigma': 200}, 
    'magma_temperature': {'mu': 1273.15, 'sigma': 50},     
    'pressure': {'mu': 20e6, 'sigma': 5e6}                 
}

def get_monte_carlo_params(n=1000):
    """Monte Carlo ile başlangıç koşullarını belirler."""
    density = np.mean(np.random.normal(params['initial_mixture_density']['mu'], params['initial_mixture_density']['sigma'], n))
    temperature = np.mean(np.random.normal(params['magma_temperature']['mu'], params['magma_temperature']['sigma'], n))
    pressure = np.mean(np.random.normal(params['pressure']['mu'], params['pressure']['sigma'], n))
    return density, temperature, pressure

def calculate_particle_spread(vent_height, intensity_factor, wind_speed, wind_angle_rad):
    """3D Partikül Dağılım Simülasyonu (Koordinat Hesabı)."""
    n_particles = 200
    v0_base = 150 * intensity_factor 
    
    max_x = 0
    max_y = 0
    max_z = vent_height 
    
    for _ in range(n_particles):
        theta = np.random.uniform(0, 2 * np.pi) 
        phi = np.random.uniform(0, np.pi / 3)   
        v0 = np.random.normal(v0_base, 20)      
        
        vx = v0 * np.sin(phi) * np.cos(theta) + (wind_speed * np.cos(wind_angle_rad)) 
        vy = v0 * np.sin(phi) * np.sin(theta) + (wind_speed * np.sin(wind_angle_rad))
        vz = v0 * np.cos(phi)
        
        delta = vz**2 + 2*g*vent_height
        t_flight = (vz + np.sqrt(delta)) / g
        
        dist_x = vx * t_flight * air_resistance_base 
        dist_y = vy * t_flight * air_resistance_base
        
        h_max_local = (vz**2) / (2*g)
        absolute_h_max = vent_height + h_max_local
        
        if abs(dist_x) > abs(max_x): max_x = abs(dist_x)
        if abs(dist_y) > abs(max_y): max_y = abs(dist_y)
        if absolute_h_max > max_z: max_z = absolute_h_max
        
    return max_x, max_y, max_z

def calculate_impact_points(max_distance, temperature, intensity):
    """
    Mesafeyi 5 eşit parçaya bölerek (Başlangıç, %25, %50, %75, Son) 
    her noktadaki enerji ve sıcaklık etkisini hesaplar.
    """
    points = []
    # 5 nokta: 0.0, 0.25, 0.5, 0.75, 1.0 çarpanları
    ratios = [0.0, 0.25, 0.5, 0.75, 1.0]
    
    for r in ratios:
        d_meter = max_distance * r
        d_km = d_meter / 1000
        
        # Enerji Sönümlemesi (Joule)
        # Merkezde çok yüksek, uzaklaştıkça hızla düşer
        E = (intensity * 1e5) / (1 + 0.1 * (d_meter**1.5))
        
        # Sıcaklık Sönümlemesi (Kelvin -> Derece)
        # Lav sıcaklığından ortam sıcaklığına (25C) düşüş
        T_kelvin = temperature * np.exp(-d_meter / (max_distance * 0.4)) + 298.15 
        T_celsius = T_kelvin - 273.15
        
        points.append({
            "distance_km": round(d_km, 2),
            "energy_j": int(E),
            "temp_c": int(T_celsius),
            "label": f"%{int(r*100)} Mesafe"
        })
        
    return points
def run_full_simulation(elevation, name):
    """Tüm simülasyonları çalıştırır."""
    
    # 1. PARAMETRELER
    density, temp, pressure = get_monte_carlo_params()
    
    # 2. ŞİDDET VE FİZİK
    intensity_factor = (elevation / 3000) + (pressure / 20e6)
    explosion_intensity = 50 * intensity_factor 
    
    # 3. ATMOSFERİK ETKİ (BU KISIM EKSİK OLABİLİR, DİKKAT!)
    wind_speed = np.random.uniform(10, 60) 
    wind_angle = np.random.uniform(0, 360)
    wind_rad = np.radians(wind_angle)
    
    # Sürüklenme Faktörü Hesabı
    drag_factor = wind_speed / (explosion_intensity * 1.5)
    if drag_factor > 1.0: drag_factor = 1.0 
    
    # Durum Belirleme (Metin Olarak)
    plume_behavior = "Dikey Yükselim"
    if drag_factor > 0.4: plume_behavior = "Eğimli Yükselim"
    if drag_factor > 0.7: plume_behavior = "Yatay Sürüklenme (Tehlikeli)"
    
    # Diğer Hesaplamalar...
    cloud_x, cloud_y, cloud_z = calculate_particle_spread(elevation, intensity_factor, wind_speed, wind_rad)
    max_cloud_reach = max(cloud_x, cloud_y) 
    rock_max_distance = max_cloud_reach * 1.5 * (density / 2500)
    impact_speed = np.sqrt(2 * g * elevation + (100 * intensity_factor)**2)
    safe_zone = rock_max_distance * 1.2 
    impact_data_points = calculate_impact_points(rock_max_distance, temp, explosion_intensity)
    
    # Risk
    risk_level = "DÜŞÜK"
    if rock_max_distance < 2000: risk_level = "ÇOK DÜŞÜK"
    elif rock_max_distance < 5000: risk_level = "DÜŞÜK"
    elif rock_max_distance < 15000: risk_level = "ORTA"
    elif rock_max_distance < 30000: risk_level = "YÜKSEK"
    else: risk_level = "KRİTİK - TAHLİYE"
    
    return {
        "monte_carlo": { "density": density, "temp": temp, "pressure": pressure },
        "crush_distance": rock_max_distance,
        "impact_points": impact_data_points,
        "particle_spread": { "x": cloud_x, "y": cloud_y, "z": cloud_z },
        "intensity": explosion_intensity,
        "safe_zone": safe_zone,
        # BURADAKİ KEY İSİMLERİ ÇOK ÖNEMLİ:
        "atmosphere": {
            "wind_speed": wind_speed,
            "drag_factor": round(drag_factor, 2), # Frontend bunu bekliyor
            "plume_behavior": plume_behavior      # Frontend bunu bekliyor
        },
        "impact_speed": impact_speed,
        "final_decision": risk_level
    }