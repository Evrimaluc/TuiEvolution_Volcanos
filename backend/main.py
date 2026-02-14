from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import math
import random

app = FastAPI()

# CORS: Frontend'in Backend'e erişmesine izin ver
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
    status: str
    location: Location

# --- BİLİMSEL HESAPLAMA FONKSİYONLARI ---

def get_activity_factor(status: str) -> float:
    """
    Yanardağın statüsüne göre tehlike katsayısı belirler.
    Active: 1.0 (Tam Tehlike)
    Dormant (Uyuyan): 0.2 (Düşük basınç, gaz çıkışı riski)
    Extinct (Sönmüş): 0.0 (Risk yok denecek kadar az)
    """
    s = status.lower()
    if "active" in s or "erupting" in s:
        return 1.0
    elif "dormant" in s or "potentially" in s:
        return 0.2
    elif "extinct" in s:
        return 0.05
    return 0.5 # Bilinmeyen durumlar için orta karar

def calculate_atmosphere(lat: float, elevation: float):
    """
    Konuma ve yüksekliğe dayalı atmosferik modelleme.
    Canlı API yerine coğrafi fizik kuralları kullanılır.
    """
    # 1. Sıcaklık Hesabı (Enlem etkisi + Yükseklik etkisi)
    # Ekvatorda (0°) ortalama 30°C, Kutuplarda (90°) -20°C baz alınır.
    lat_factor = 1 - (abs(lat) / 90) 
    base_temp = -20 + (50 * lat_factor) # -20 ile 30 arası
    
    # Lapse Rate: Her 1000m'de 6.5°C düşüş
    final_temp = base_temp - (elevation / 1000 * 6.5)
    
    # 2. Rüzgar Hesabı (Jet Stream ve Yükseklik)
    # Yüksek irtifada rüzgar logaritmik artar.
    # 30°-60° enlemleri arası (Westerlies) rüzgar daha şiddetlidir.
    wind_lat_bonus = 10 if 30 < abs(lat) < 60 else 0
    wind_speed = 5 + (elevation / 400) + wind_lat_bonus + random.uniform(-2, 5)
    
    # Rüzgar yönü sapma katsayısı (Coriolis)
    drag_factor = 0.1 + (wind_speed / 100)

    return {
        "temp_c": round(final_temp, 1),
        "wind_speed": round(wind_speed, 1),
        "drag_factor": round(min(drag_factor, 1.0), 2),
        "condition": "Fırtınalı" if wind_speed > 20 else "Rüzgarlı" if wind_speed > 10 else "Sakin"
    }

@app.post("/calculate")
async def calculate_risk(volcano: VolcanoRequest):
    try:
        # 1. Aktivite Çarpanı (Mauna Kea sorununu çözer)
        activity = get_activity_factor(volcano.status)
        
        # 2. Atmosfer Verisi
        atmos = calculate_atmosphere(volcano.location.lat, volcano.elevation)
        
        # 3. Fiziksel Simülasyon (Basınç ve Enerji)
        # Sönmüş yanardağda basınç birikimi olmaz.
        magma_chamber_pressure = (volcano.elevation * 2000 * activity) 
        
        # Monte Carlo Varyasyonu (Simülasyona doğallık katar)
        uncertainty = random.uniform(0.9, 1.1)
        
        # Ezilme Mesafesi (Risk Alanı)
        # d = v^2 / g (Basitleştirilmiş balistik)
        # v (çıkış hızı) basınçla orantılıdır.
        blast_radius = (magma_chamber_pressure ** 0.5) / 9.81 * uncertainty
        
        # Güvenli Bölge
        safe_zone = blast_radius * 1.5 if blast_radius > 100 else 500 # En az 500m
        
        # Volkanik Patlama İndeksi (VEI) Tahmini (0-8 arası logaritmik)
        if blast_radius > 0:
            vei_score = math.log10(blast_radius) 
        else:
            vei_score = 0

        # Nihai Risk Kararı
        if vei_score < 1 or activity < 0.1:
            decision = "ÇOK DÜŞÜK RİSK" # Sönmüş/Pasif Dağlar
        elif vei_score < 2.5:
            decision = "DÜŞÜK RİSK"
        elif vei_score < 3.5:
            decision = "ORTA SEVİYE RİSK"
        elif vei_score < 5:
            decision = "YÜKSEK RİSK"
        else:
            decision = "KRİTİK - ACİL TAHLİYE"

        # Etki Noktaları (Isı ve Enerji Yayılımı)
        impact_points = []
        for dist in [5, 10, 20, 50]:
            # Mesafe arttıkça etki azalır (Inverse Square Law)
            energy = (magma_chamber_pressure / (dist**2)) * uncertainty
            temp = atmos["temp_c"] + (1000 * activity / dist) # Lav ısısı etkisi
            
            impact_points.append({
                "distance_km": dist,
                "temp_c": int(temp),
                "energy_j": int(energy),
                "label": f"{dist}km Çapı"
            })

        # Partikül Yayılımı (Rüzgar Yönünde)
        particle_spread = {
            "x": blast_radius * (1 + atmos["wind_speed"]/10),
            "y": blast_radius * 0.8,
            "z": volcano.elevation + (blast_radius / 2)
        }

        return {
            "monte_carlo": {
                "density": int(2600 * uncertainty),
                "pressure": magma_chamber_pressure,
                "temp": int(1200 * activity) if activity > 0 else int(atmos["temp_c"])
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