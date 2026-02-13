import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import {
  Mountain,
  Activity,
  AlertTriangle,
  Wind,
  Gauge,
  CheckCircle,
  BarChart2,
  Layers,
  Flame,
  ShieldAlert,
  Thermometer,
} from "lucide-react";
import L from "leaflet";

import magmaDarkBg from "/assets/magma-bg.jpg";
import magmaLightBg from "/assets/magma_ligthmode.png";

// Leaflet ikon düzeltmesi
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const VOLCANOES = [
  {
    id: 1,
    name: "Etna",
    elevation: 3357,
    position: [37.75, 14.99],
    status: "Active",
  },
  {
    id: 2,
    name: "Vesuvius",
    elevation: 1281,
    position: [40.81, 14.42],
    status: "Dormant",
  },
  {
    id: 3,
    name: "Mount Fuji",
    elevation: 3776,
    position: [35.36, 138.72],
    status: "Active",
  },
  {
    id: 4,
    name: "Mount St. Helens",
    elevation: 2549,
    position: [46.19, -122.19],
    status: "Active",
  },
  {
    id: 5,
    name: "Agri Dagi (Ararat)",
    elevation: 5137,
    position: [39.7, 44.29],
    status: "Dormant",
  },
];

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function App() {
  const [selectedVolcano, setSelectedVolcano] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const filteredVolcanoes = VOLCANOES.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCalculate = async () => {
    if (!selectedVolcano) return;
    setLoading(true);
    setResults(null);

    try {
      const response = await axios.post("http://localhost:8000/calculate", {
        name: selectedVolcano.name,
        elevation: selectedVolcano.elevation,
        location: {
          lat: selectedVolcano.position[0],
          lng: selectedVolcano.position[1],
        },
      });

      setTimeout(() => {
        setResults(response.data);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Hata:", error);
      setLoading(false);
      alert("Simülasyon sunucusu yanıt vermedi.");
    }
  };

  const inputBgClass = darkMode
    ? "bg-black/50 border-dark-border text-white placeholder-gray-400"
    : "bg-white/80 border-light-border text-stone-800 placeholder-stone-500";

  const cardClass = darkMode
    ? "bg-dark-surface/90 border-dark-border backdrop-blur-sm"
    : "bg-white/90 border-light-border backdrop-blur-sm shadow-xl";
  // Nihai Karar için CSS Sınıfını Belirle (SADECE METİN RENGİ İÇİN)
  const getRiskAnimationClass = (risk) => {
    if (!risk) return "";
    if (risk.includes("ÇOK DÜŞÜK")) return "text-anim-very-low";
    if (risk === "DÜŞÜK") return "text-anim-low";
    if (risk === "ORTA") return "text-anim-medium";
    if (risk === "YÜKSEK") return "text-anim-high";
    if (risk.includes("KRİTİK")) return "text-anim-critical";
    return "";
  };
  return (
    <div
      className="min-h-screen transition-colors duration-500 bg-cover bg-fixed bg-center"
      style={{
        backgroundImage: `url(${darkMode ? magmaDarkBg : magmaLightBg})`,
        backgroundBlendMode: darkMode ? "hard-light" : "normal",
        backgroundColor: darkMode ? "#000000" : "transparent",
      }}
    >
      <div
        className={`min-h-screen w-full ${
          darkMode ? "bg-black/70" : "bg-orange-50/20"
        }`}
      >
        {/* HEADER */}
        <nav
          className={`p-4 border-b flex justify-between items-center backdrop-blur-md sticky top-0 z-50 
          ${
            darkMode
              ? "border-dark-border bg-black/80"
              : "border-light-border bg-white/70"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Mountain
                className="text-volcano-red animate-pulse-slow"
                size={40}
                strokeWidth={2}
              />
              <div className="absolute -top-1 right-[35%] w-2 h-2 bg-volcano-orange rounded-full animate-ping"></div>
            </div>
            <h1
              className={`text-2xl font-black tracking-widest ${
                darkMode ? "text-white" : "text-stone-800"
              }`}
            >
              VOLCANOS{" "}
              <span className="text-volcano-orange text-sm font-extrabold px-1 border border-volcano-orange rounded">
                SIMULATOR
              </span>
            </h1>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Yanardağ Ara..."
              className={`px-3 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-volcano-orange ${inputBgClass}`}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`text-sm border px-4 py-1 rounded font-bold transition-all transform hover:scale-105
                ${
                  darkMode
                    ? "border-volcano-orange text-volcano-orange bg-black hover:bg-volcano-orange hover:text-white"
                    : "border-volcano-red text-white bg-volcano-red hover:bg-red-700 shadow-md"
                }`}
            >
              {darkMode ? "Mod: 🔥 MAGMA" : "Mod: 🌸 FUJI"}
            </button>
          </div>
        </nav>

        <main className="container mx-auto p-4 space-y-6">
          {/* ÜST KISIM: HARİTA VE PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
            <div
              className={`md:col-span-2 rounded-xl overflow-hidden border-4 shadow-2xl relative z-0 
                ${darkMode ? "border-dark-border" : "border-light-border"}`}
            >
              <MapContainer
                center={[20, 0]}
                zoom={2}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <ChangeView
                  center={selectedVolcano ? selectedVolcano.position : [20, 0]}
                  zoom={selectedVolcano ? 10 : 2}
                />
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url={
                    darkMode
                      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  }
                />
                {filteredVolcanoes.map((v) => (
                  <Marker
                    key={v.id}
                    position={v.position}
                    eventHandlers={{
                      click: () => {
                        setSelectedVolcano(v);
                        setResults(null);
                      },
                    }}
                  >
                    <Popup>{v.name}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div
              className={`p-6 rounded-xl border-2 flex flex-col justify-between shadow-lg transition-all ${cardClass}`}
            >
              <div>
                <h2
                  className={`text-xl font-bold border-b pb-2 mb-4 flex items-center gap-2
                      ${
                        darkMode
                          ? "border-volcano-red text-white"
                          : "border-light-border text-stone-800"
                      }`}
                >
                  <Mountain size={24} className="text-volcano-orange" />
                  {selectedVolcano ? "Yanardağ Bilgileri" : "Yanardağ Seçiniz"}
                </h2>
                {selectedVolcano ? (
                  <div
                    className={`space-y-4 ${
                      darkMode ? "text-gray-200" : "text-stone-700"
                    }`}
                  >
                    <div className="flex justify-between items-center p-2 rounded bg-black/10">
                      <span>Yükseklik:</span>
                      <span className="font-mono text-volcano-orange font-bold text-lg">
                        {selectedVolcano.elevation} m
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-black/10">
                      <span>Durum:</span>
                      <span className="font-bold px-2 py-0.5 rounded bg-red-900/50 text-red-400">
                        {selectedVolcano.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center opacity-70 mt-10">
                    <p>Lütfen haritadan bir dağ seçin.</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleCalculate}
                disabled={!selectedVolcano || loading}
                className={`w-full py-4 rounded-lg font-bold text-lg tracking-wider transition-all transform hover:scale-[1.02] active:scale-95 shadow-volcano-glow
                    ${
                      !selectedVolcano
                        ? "bg-gray-600/50 text-white cursor-not-allowed"
                        : loading
                        ? "bg-volcano-orange/80 animate-pulse"
                        : "bg-volcano-orange hover:bg-volcano-red text-white"
                    }`}
              >
                {loading ? "HESAPLANIYOR..." : "SİMÜLASYONU BAŞLAT"}
              </button>
            </div>
          </div>

          {/* --- SONUÇLAR (8 CONTAINER) --- */}
          {results && (
            <div className="text-center py-6">
              <h2
                className={`text-3xl font-black uppercase tracking-[0.2em] drop-shadow-md inline-block px-6 py-2 rounded-full backdrop-blur-sm
                    ${
                      darkMode
                        ? "text-volcano-orange bg-black/20"
                        : "text-stone-800 bg-white/60 border border-light-border"
                    }`}
              >
                Simülasyon Sonuçları
              </h2>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
            {/* 1. Monte Carlo */}
            <ResultBox
              title="1. Monte Carlo Parametreleri"
              loading={loading}
              data={results}
              delay={0}
              icon={<Activity />}
              darkMode={darkMode}
              cardClass={cardClass}
            >
              {results && (
                <div className="space-y-2 text-sm font-bold">
                  <p className="flex justify-between border-b border-current pb-1 opacity-70">
                    <span>Yoğunluk:</span>{" "}
                    <span className="text-volcano-orange">
                      {results.monte_carlo.density.toFixed(0)} kg/m³
                    </span>
                  </p>
                  <p className="flex justify-between border-b border-current pb-1 opacity-70">
                    <span>Basınç:</span>{" "}
                    <span className="text-volcano-orange">
                      {(results.monte_carlo.pressure / 1e6).toFixed(1)} MPa
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Magma Sıcaklığı:</span>{" "}
                    <span className="text-volcano-orange">
                      {results.monte_carlo.temp.toFixed(0)} K
                    </span>
                  </p>
                </div>
              )}
            </ResultBox>

            {/* 2. Ezilme Mesafesi */}
            <ResultBox
              title="2. Ezilme Mesafesi"
              loading={loading}
              data={results}
              delay={300}
              icon={<AlertTriangle className="text-volcano-red" />}
              darkMode={darkMode}
              cardClass={cardClass}
            >
              {results && (
                <div className="text-center">
                  <p className="text-lg opacity-80">Maksimum Kaya Menzili</p>
                  <p className="text-5xl font-black text-volcano-red my-3 drop-shadow-lg">
                    {(results.crush_distance / 1000).toFixed(2)} km
                  </p>
                  <p className="text-xs opacity-60">
                    Bu mesafeye kadar kayaç düşme riski var.
                  </p>
                </div>
              )}
            </ResultBox>

            {/* 3. Sıcaklık ve Enerji Etkisi (Liste Halinde) */}
            <ResultBox
              title="3. Sıcaklık ve Enerji Etkisi"
              loading={loading}
              data={results}
              delay={600}
              icon={<Thermometer />}
              darkMode={darkMode}
              cardClass={cardClass}
            >
              {results && (
                <div className="h-full flex flex-col justify-center">
                  <div
                    className={`grid grid-cols-3 gap-2 text-xs font-bold mb-2 pb-1 border-b ${
                      darkMode ? "border-gray-600" : "border-gray-300"
                    }`}
                  >
                    <span>Mesafe</span>
                    <span className="text-center">Sıcaklık</span>
                    <span className="text-right">Enerji</span>
                  </div>
                  <div className="space-y-2 overflow-y-auto max-h-[150px] pr-2 volcano-scrollbar">
                    {results.impact_points.map((point, index) => (
                      <div
                        key={index}
                        className={`grid grid-cols-3 gap-2 text-sm p-1 rounded ${
                          darkMode ? "hover:bg-white/10" : "hover:bg-black/5"
                        }`}
                      >
                        <span className="opacity-80 flex flex-col">
                          <span className="text-[10px] uppercase opacity-50">
                            {point.label}
                          </span>
                          {point.distance_km} km
                        </span>
                        <span
                          className={`text-center font-bold ${
                            point.temp_c > 100
                              ? "text-red-500"
                              : "text-orange-400"
                          }`}
                        >
                          {point.temp_c} °C
                        </span>
                        <span className="text-right font-mono text-volcano-orange">
                          {point.energy_j.toLocaleString()} J
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ResultBox>

            {/* 4. Partikül Bulutu Etkisi */}
            <ResultBox
              title="4. Partikül Bulutu Etkisi (3D)"
              loading={loading}
              data={results}
              delay={900}
              icon={<Layers />}
              darkMode={darkMode}
              cardClass={cardClass}
            >
              {results && (
                <div className="space-y-4 text-center">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-black/20 p-2 rounded">
                      <span className="block text-xs opacity-60">
                        Max X (Doğu/Batı)
                      </span>
                      <span className="text-4xl font-bold text-volcano-orange">
                        {(results.particle_spread.x / 1000).toFixed(1)} km
                      </span>
                    </div>
                    <div className="bg-black/20 p-2 rounded">
                      <span className="block text-xs opacity-60">
                        Max Y (Kuzey/Güney)
                      </span>
                      <span className="text-4xl font-bold text-volcano-orange">
                        {(results.particle_spread.y / 1000).toFixed(1)} km
                      </span>
                    </div>
                    <div className="bg-black/20 p-2 rounded">
                      <span className="block text-xs opacity-60">
                        Max Z (Yükseklik)
                      </span>
                      <span className="text-4xl font-bold text-volcano-orange">
                        {results.particle_spread.z.toFixed(0)} m
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </ResultBox>

            {/* 5. Patlama Şiddeti */}
            <ResultBox
              title="5. Patlama Şiddeti"
              loading={loading}
              data={results}
              delay={1200}
              icon={<Flame />}
              darkMode={darkMode}
              cardClass={cardClass}
            >
              {results && (
                <div className="text-center">
                  <p className="text-lg opacity-80">Volkanik Patlama İndeksi</p>
                  <p className="text-4xl font-bold text-volcano-orange my-2">
                    {results.intensity.toFixed(1)}
                  </p>
                </div>
              )}
            </ResultBox>

            {/* 6. Güvenli Bölge Analizi */}
            <ResultBox
              title="6. Güvenli Bölge Analizi"
              loading={loading}
              data={results}
              delay={1500}
              icon={<ShieldAlert className="text-green-500" />}
              darkMode={darkMode}
              cardClass={cardClass}
            >
              {results && (
                <div
                  className={`p-4 rounded border-2 text-center ${
                    darkMode
                      ? "border-green-800 bg-green-900/20"
                      : "border-green-300 bg-green-100"
                  }`}
                >
                  <p className="font-bold text-green-600 mb-2">
                    Önerilen Güvenli Mesafe
                  </p>
                  <p className="text-4xl font-black">
                    {(results.safe_zone / 1000).toFixed(1)} km
                  </p>
                  <p className="text-xs mt-2 opacity-70">
                    Merkezden itibaren bu yarıçap dışı güvenlidir.
                  </p>
                </div>
              )}
            </ResultBox>

            {/* 7. Atmosferik Etki */}
            <ResultBox
              title="7. Atmosferik Etki (Sürüklenme)"
              loading={loading}
              data={results}
              delay={1800}
              icon={<Wind />}
              darkMode={darkMode}
              cardClass={cardClass}
            >
              {results && results.atmosphere && (
                <div className="space-y-4 font-medium">
                  {/* 1. Satır: Rüzgar Hızı */}
                  <div
                    className={`flex justify-between items-center border-b pb-2 ${
                      darkMode ? "border-gray-600" : "border-gray-300"
                    }`}
                  >
                    <span className="opacity-80">Rüzgar Hızı:</span>
                    <span className="font-mono font-bold text-volcano-orange">
                      {results.atmosphere.wind_speed.toFixed(1)} m/s
                    </span>
                  </div>

                  {/* 2. Satır: Sürüklenme Katsayısı (Sayısal) */}
                  <div
                    className={`flex justify-between items-center border-b pb-2 ${
                      darkMode ? "border-gray-600" : "border-gray-300"
                    }`}
                  >
                    <span className="opacity-80">Sürüklenme Katsayısı:</span>
                    <span
                      className={`font-bold ${
                        results.atmosphere.drag_factor > 0.7
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {results.atmosphere.drag_factor}
                    </span>
                  </div>

                  {/* 3. Satır: Bulut Davranışı (Durum Metni) */}
                  <div
                    className={`text-center p-3 rounded ${
                      darkMode ? "bg-white/5" : "bg-black/5"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-widest opacity-60 block mb-1">
                      Bulut Davranışı
                    </span>
                    {/* Veri gelmezse 'Hesaplanıyor' yazsın diye kontrol ekledik */}
                    <p
                      className={`text-lg font-black leading-tight ${
                        results.atmosphere.drag_factor > 0.7
                          ? "text-red-500"
                          : "text-volcano-orange"
                      }`}
                    >
                      {results.atmosphere.plume_behavior ||
                        "Analiz Ediliyor..."}
                    </p>
                  </div>
                </div>
              )}
            </ResultBox>
            {/* 8. NİHAİ RİSK KARARI (GÜNCELLENMİŞ HALİ) */}
            <ResultBox
              title="8. Nihai Risk Kararı"
              loading={loading}
              data={results}
              delay={2100}
              icon={
                <CheckCircle
                  className={
                    results ? "text-volcano-orange" : "text-volcano-red"
                  }
                />
              }
              darkMode={darkMode}
              cardClass={cardClass}
            >
              {results && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                  {/* Animasyon sınıfı SADECE buradaki span etiketine uygulanıyor */}
                  <span
                    className={`font-black text-6xl tracking-wider drop-shadow-lg uppercase ${getRiskAnimationClass(
                      results.final_decision
                    )}`}
                  >
                    {results.final_decision}
                  </span>
                </div>
              )}
            </ResultBox>
          </div>
        </main>
      </div>
    </div>
  );
}
// --- GÜNCELLENMİŞ ORTAK SONUÇ KUTUSU ---
// specialAnimClass prop'u eklendi.
function ResultBox({
  title,
  loading,
  data,
  children,
  delay,
  icon,
  darkMode,
  cardClass,
  specialAnimClass = "",
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (data && !loading) {
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [data, loading, delay]);

  // Eğer özel animasyon sınıfı varsa, standart cardClass'ı ezeriz.
  // Metin rengini beyaz, border'ı şeffaf yaparız.
  const finalContainerClass =
    show && data && specialAnimClass
      ? `rounded-xl p-6 min-h-[220px] flex flex-col relative overflow-hidden transition-all border-2 text-white shadow-xl backdrop-blur-md ${specialAnimClass}`
      : `rounded-xl p-6 min-h-[220px] flex flex-col relative overflow-hidden transition-all border-2 hover:border-volcano-orange ${cardClass}`;

  // Header stillerini duruma göre ayarla
  const headerBorderClass =
    show && data && specialAnimClass
      ? "border-white/30"
      : darkMode
      ? "border-gray-700"
      : "border-yellow-600/30";
  const headerIconBgClass =
    show && data && specialAnimClass
      ? "bg-white/20"
      : darkMode
      ? "bg-black/40"
      : "bg-white/50";
  const headerTextClass =
    show && data && specialAnimClass
      ? "text-white"
      : darkMode
      ? "text-white"
      : "text-stone-800";

  return (
    <div className={finalContainerClass}>
      <div
        className={`flex items-center gap-3 mb-4 border-b pb-3 ${headerBorderClass}`}
      >
        <div className={`p-2 rounded-lg ${headerIconBgClass}`}>{icon}</div>
        <h3 className={`font-bold text-lg tracking-wide ${headerTextClass}`}>
          {title}
        </h3>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            {/* Yükleme simgesi animasyonlu arka planda beyaz olmalı */}
            <div
              className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${
                specialAnimClass
                  ? "border-white"
                  : "border-volcano-orange border-t-volcano-yellow"
              }`}
            ></div>
          </div>
        ) : show && data ? (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        ) : (
          <span className="opacity-50 text-sm italic flex items-center gap-2">
            <Mountain size={16} /> Veri bekleniyor...
          </span>
        )}
      </div>
    </div>
  );
}
