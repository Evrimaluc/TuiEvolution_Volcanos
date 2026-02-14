from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import math
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Location(BaseModel):
    lat: float
    lng: float

class VolcanoRequest(BaseModel):
    name: str
    elevation: float
    status: str  # YENİ: Yanardağın aktiflik durumu
    location: Location

# --- BİLİMSEL HESAPLAMA MOTORU ---

def get_activity_factor(status: str) -> float:
    """
    Yanardağ durumuna göre risk katsayısı.
    """
    s = str(status).lower()
    if "historical" in s or "active" in s or "erupting" in s:
        return 1.0  # Aktif
    elif "dormant" in s or "holocene" in s: # Holocene: Son 10.000 yılda patlamış ama şu an uykuda olabilir
        return 0.3  # Uyuyan (Düşük Risk)
    elif "extinct" in s or "pleistocene" in s:
        return 0.05 # Sönmüş (Çok Düşük Risk)
    return 0.5 # Bilinmeyen

def calculate_atmosphere(lat: float, elevation: float):
    """
    Coğrafi konuma dayalı atmosfer simülasyonu.
    """
    # 1. Sıcaklık (Enlem ve Yükseklik Etkisi)
    # Ekvator (0°) ~30°C, Kutuplar (90°) ~-20°C
    lat_factor = 1 - (abs(lat) / 90)
    base_temp = -15 + (45 * lat_factor) 
    
    # Lapse Rate: Her 1000m'de 6.5°C düşüş
    final_temp = base_temp - (elevation / 1000 * 6.5)
    
    # 2. Rüzgar (Yükseklik Etkisi)
    # Yüksek irtifada sürtünme azalır, rüzgar artar.
    base_wind = 5 + (elevation / 500) + random.uniform(-2, 5)
    wind_speed = max(0, base_wind) # Negatif olamaz
    
    # Sürüklenme Katsayısı
    drag_factor = 0.1 + (wind_speed / 50)

    # Durum Metni
    if wind_speed > 25: behavior = "Fırtınalı Dağılım"
    elif wind_speed > 10: behavior = "Sürüklenen Bulut"
    else: behavior = "Stabil Duman"

    return {
        "temp_c": round(final_temp, 1),
        "wind_speed": round(wind_speed, 1),
        "drag_factor": round(min(drag_factor, 1.0), 2),
        "plume_behavior": behavior
    }

@app.post("/calculate")
async def calculate_risk(volcano: VolcanoRequest):
    try:
        activity = get_activity_factor(volcano.status)
        atmos = calculate_atmosphere(volcano.location.lat, volcano.elevation)
        
        # 1. Magma Basıncı (Paskal)
        # Aktif yanardağlarda basınç tam, pasiflerde %30 seviyesinde simüle edilir.
        pressure = (volcano.elevation * 3000 * activity) + 100000 
        
        # 2. Monte Carlo Varyasyonu
        variance = random.uniform(0.9, 1.1)
        
        # 3. Ezilme Mesafesi (Balistik)
        # Basınç ne kadar yüksekse kayaçlar o kadar uzağa fırlar.
        blast_radius = (pressure ** 0.45) / 9.81 * variance
        
        # Sönmüş yanardağlar için yarıçapı çok küçült
        if activity < 0.2: 
            blast_radius = blast_radius / 10

        # 4. Volkanik Patlama İndeksi (VEI Tahmini)
        vei_score = math.log10(max(blast_radius, 1)) * activity * 1.5

        # 5. Nihai Karar
        if vei_score < 1: decision = "ÇOK DÜŞÜK RİSK"
        elif vei_score < 2.5: decision = "DÜŞÜK RİSK"
        elif vei_score < 4.0: decision = "ORTA SEVİYE RİSK"
        elif vei_score < 5.5: decision = "YÜKSEK RİSK"
        else: decision = "KRİTİK TAHLİYE!"

        # 6. Etki Noktaları
        impact_points = []
        for dist in [5, 10, 20, 50]:
            # Mesafe arttıkça enerji düşer
            energy = (pressure / (dist ** 2)) * variance
            # Sıcaklık lav akışına göre düşer
            temp_drop = 50 * dist 
            lava_temp = (1200 * activity) - temp_drop
            final_point_temp = max(atmos["temp_c"], lava_temp)

            impact_points.append({
                "distance_km": dist,
                "temp_c": int(final_point_temp),
                "energy_j": int(energy),
                "label": f"{dist}km Menzil"
            })

        # 7. Güvenli Bölge
        safe_zone = blast_radius * 1.2 if activity > 0.2 else 0

        # 8. Parçacık Yayılımı (3D)
        particle_spread = {
            "x": blast_radius * (1 + atmos["wind_speed"]/10),
            "y": blast_radius * 0.9,
            "z": volcano.elevation + (pressure / 5000)
        }

        return {
            "monte_carlo": {
                "density": int(2600 * variance),
                "pressure": pressure,
                "temp": int(1200 * activity) if activity > 0.1 else int(atmos["temp_c"])
            },
            "crush_distance": blast_radius,
            "safe_zone": safe_zone,
            "impact_points": impact_points,
            "particle_spread": particle_spread,
            "intensity": round(vei_score, 1),
            "atmosphere": atmos,
            "final_decision": decision
        }

    except Exception as e:
        print(f"Hata: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)