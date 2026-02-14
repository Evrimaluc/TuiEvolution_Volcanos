from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import math
import random

app = FastAPI()

# CORS Ayarları
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
    status: str  # YENİ: Yanardağın durumu (Active, Dormant, vb.)
    location: Location

# --- YARDIMCI FONKSİYONLAR ---

def get_activity_factor(status: str) -> float:
    """Yanardağın durumuna göre aktivite katsayısı döndürür."""
    s = status.lower()
    if "active" in s or "erupting" in s:
        return 1.0  # Tam güç
    elif "dormant" in s or "potentially" in s:
        return 0.15 # Çok düşük risk (Sadece gaz çıkışı vb.)
    elif "extinct" in s:
        return 0.01 # Neredeyse sıfır risk
    return 0.5 # Bilinmeyen durum

def calculate_atmosphere(lat: float, elevation: float):
    """
    Rastgelelik yerine Enlem ve Yüksekliğe dayalı atmosferik veri üretir.
    """
    # 1. Sıcaklık: Ekvator (0 lat) sıcak, Kutuplar (90 lat) soğuk
    base_temp = 30 - (abs(lat) * 0.5) # Ekvatorda 30C, Kutuplarda -15C baz
    
    # Her 1000m'de sıcaklık 6.5C düşer (Lapse Rate)
    final_temp = base_temp - (elevation / 1000 * 6.5)
    
    # 2. Rüzgar: Enleme göre rüzgar kuşakları (Trade winds, Westerlies)
    # Basit bir model: Yüksek dağlarda rüzgar daha serttir
    base_wind = 5 + (elevation / 500) # Yükseklik arttıkça rüzgar artar
    
    # Rüzgar yönü sapması (Coriolis etkisi simülasyonu - basit)
    drag_factor = min(0.95, 0.2 + (base_wind / 50)) 

    return {
        "temp_c": final_temp,
        "wind_speed": base_wind,
        "drag_factor": round(drag_factor, 2)
    }

@app.post("/calculate")
async def calculate_risk(volcano: VolcanoRequest):
    try:
        # 1. Aktivite Katsayısı (Mauna Kea sorununu çözen kısım)
        activity_multiplier = get_activity_factor(volcano.status)
        
        # 2. Atmosferik Hesaplama (Konuma dayalı)
        atmos = calculate_atmosphere(volcano.location.lat, volcano.elevation)
        
        # 3. Magma Odası Basıncı (Simüle)
        # Aktif yanardağlarda basınç yüksek, pasiflerde düşüktür.
        # Pascal cinsinden (Active: ~200MPa, Dormant: ~10MPa)
        base_pressure = (volcano.elevation * 5000) + 10000000 
        real_pressure = base_pressure * activity_multiplier

        # 4. Monte Carlo Benzeri Dağılım (Stokastik süreç)
        # Pasif yanardağlarda varyasyon çok az olur.
        variance = random.uniform(0.9, 1.1) if activity_multiplier > 0.5 else 1.0
        
        density = 2600 * variance  # Kayaç yoğunluğu (kg/m3)
        magma_temp = (1200 if activity_multiplier > 0.5 else 400) * variance # Kelvin

        # 5. Ezilme Mesafesi (Balistik fırlatma menzili)
        # Fizik formülü: d = (v^2 * sin(2theta)) / g
        # Basınçtan çıkış hızı tahmini: v = sqrt(2 * P / density)
        if real_pressure > 0:
            exit_velocity = (2 * real_pressure / density) ** 0.5
            crush_distance = (exit_velocity ** 2) / 9.81 * 0.8 # Sürtünme kaybı
        else:
            crush_distance = 0

        # 6. Enerji ve Etki Alanı
        blast_energy = real_pressure * (volcano.elevation / 10) # Joule (Basitleştirilmiş)
        
        # Risk Seviyesi Belirleme
        # VEI (Volcanic Explosivity Index) benzeri bir skor (0-8 arası)
        risk_score = (math.log10(max(blast_energy, 1)) - 6) * activity_multiplier
        
        if risk_score < 1:
            final_decision = "ÇOK DÜŞÜK RİSK"
        elif risk_score < 2:
            final_decision = "DÜŞÜK RİSK"
        elif risk_score < 4:
            final_decision = "ORTA SEVİYE RİSK"
        elif risk_score < 6:
            final_decision = "YÜKSEK RİSK - HAZIR OLUN"
        else:
            final_decision = "KRİTİK TAHLİYE!"

        # Etki Noktaları (Mesafe vs Sıcaklık/Enerji)
        impact_points = []
        steps = [5, 10, 20, 50] # km
        for step in steps:
            # Mesafe arttıkça enerji düşer (Inverse square law benzeri)
            # Pasif yanardağlarda sıcaklık çevre sıcaklığına yakındır.
            dist_factor = 1 / (step ** 0.5)
            point_temp = atmos["temp_c"] + ((magma_temp - 273) * dist_factor * activity_multiplier * 0.1)
            point_energy = blast_energy * (1 / (step ** 2)) * 0.01
            
            impact_points.append({
                "distance_km": step,
                "temp_c": round(point_temp, 1),
                "energy_j": int(point_energy),
                "label": f"Bölge {step}km"
            })

        # Güvenli Bölge (Risk skoru 0 ise güvenli bölge 0km'dir yani her yer güvenli)
        safe_zone = crush_distance * 1.5 if activity_multiplier > 0.2 else 0

        # Bulut Yayılımı (Rüzgar etkisiyle)
        particle_spread = {
            "x": crush_distance * (1 + atmos["wind_speed"]/10),
            "y": crush_distance * (1 - atmos["wind_speed"]/20),
            "z": volcano.elevation + (real_pressure / 10000)
        }

        return {
            "monte_carlo": {
                "density": density,
                "pressure": real_pressure,
                "temp": magma_temp
            },
            "crush_distance": crush_distance,
            "impact_points": impact_points,
            "particle_spread": particle_spread,
            "intensity": risk_score if risk_score > 0 else 0,
            "safe_zone": safe_zone,
            "atmosphere": {
                "wind_speed": atmos["wind_speed"],
                "drag_factor": atmos["drag_factor"],
                "plume_behavior": "Stabil" if atmos["wind_speed"] < 10 else "Sürüklenen Bulut"
            },
            "final_decision": final_decision
        }

    except Exception as e:
        print(f"Hata: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)