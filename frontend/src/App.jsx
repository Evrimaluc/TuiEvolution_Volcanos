import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import Papa from 'papaparse';
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
  MapPin,
  Filter,
  X,
  Check,
  Globe // Bölge için ikon
} from 'lucide-react';
import L from 'leaflet';

import magmaDarkBg from '/assets/magma-bg.jpg';
import magmaLightBg from '/assets/magma_ligthmode.png';

// Leaflet ikon düzeltmesi
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function App() {
  // --- STATE TANIMLAMALARI ---
  const [volcanoes, setVolcanoes] = useState([]); 
  const [selectedVolcano, setSelectedVolcano] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  // --- FİLTRELEME STATE'LERİ ---
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  
  // Seçili olan filtreler (Uygulanmış)
  const [appliedFilters, setAppliedFilters] = useState({
    region: [], // YENİ: Kıta/Bölge
    country: [],
    status: [],
    elevation: [],
  });

  // Menüde geçici olarak seçilenler
  const [tempFilters, setTempFilters] = useState({
    region: [],
    country: [],
    status: [],
    elevation: [],
  });

  // Sabit Seçenekler
  const filterOptions = {
    status: ['Active', 'Dormant'],
    elevation: [
      { label: '0 - 1000m', min: 0, max: 1000 },
      { label: '1000m - 2000m', min: 1000, max: 2000 },
      { label: '2000m - 3000m', min: 2000, max: 3000 },
      { label: '3000m - 4000m', min: 3000, max: 4000 },
      { label: '4000m - 5000m', min: 4000, max: 5000 },
      { label: '5000m - 6000m', min: 5000, max: 6000 },
      { label: '6000m+', min: 6000, max: 99999 },
    ]
  };

  // Dinamik Listeler (Ülke ve Bölge)
  const dynamicOptions = useMemo(() => {
    const countries = [...new Set(volcanoes.map(v => v.country))].sort();
    const regions = [...new Set(volcanoes.map(v => v.region))].sort(); // Location sütununu bölge yaptık
    return { countries, regions };
  }, [volcanoes]);

  // --- CSV OKUMA ---
  useEffect(() => {
    Papa.parse('/processed_volcanoes.csv', {
      download: true,
      header: true,
      dynamicTyping: true, 
      complete: (results) => {
        const rawData = results.data;
        
        const processedData = rawData.filter(v => {
            const elevation = v['Elevation (m)'];
            if (typeof elevation !== 'number' || elevation < 0) return false;
            return true; 
        }).map((v, index) => ({
            id: index,
            name: v['Volcano Name'],
            country: v['Country'],
            region: v['Location'], // Location sütununu 'region' olarak aldık
            elevation: v['Elevation (m)'],
            status: v['Last Known Eruption'] || 'Unknown',
            position: [v['Latitude'], v['Longitude']]
        }));

        setVolcanoes(processedData);
      },
      error: (err) => console.error("CSV Hatası:", err)
    });
  }, []);

  // Dark Mode Efekti
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- FİLTRELEME MANTIĞI ---
  const displayVolcanoes = useMemo(() => {
    return volcanoes.filter(v => {
      // 1. Arama
      const matchesSearch = v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            v.country?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Bölge (Kıta) Filtresi
      if (appliedFilters.region.length > 0) {
        if (!appliedFilters.region.includes(v.region)) return false;
      }

      // 3. Ülke Filtresi
      if (appliedFilters.country.length > 0) {
        if (!appliedFilters.country.includes(v.country)) return false;
      }

      // 4. Durum Filtresi
      if (appliedFilters.status.length > 0) {
        if (!appliedFilters.status.includes(v.status)) return false;
      }

      // 5. Yükseklik Filtresi
      if (appliedFilters.elevation.length > 0) {
        const matchesElevation = appliedFilters.elevation.some(rangeLabel => {
           const range = filterOptions.elevation.find(r => r.label === rangeLabel);
           return range && v.elevation >= range.min && v.elevation < range.max;
        });
        if (!matchesElevation) return false;
      }

      return true;
    });
  }, [volcanoes, searchTerm, appliedFilters]);

  // --- AKSİYONLAR ---
  const toggleTempFilter = (category, value) => {
    setTempFilters(prev => {
      const currentList = prev[category];
      if (currentList.includes(value)) {
        return { ...prev, [category]: currentList.filter(item => item !== value) };
      } else {
        return { ...prev, [category]: [...currentList, value] };
      }
    });
  };

  const applyFilters = () => {
    setAppliedFilters(tempFilters);
    setIsFilterMenuOpen(false);
  };

  const removeFilter = (category, value) => {
    const removeFromState = (state) => ({
      ...state,
      [category]: state[category].filter(item => item !== value)
    });
    setAppliedFilters(removeFromState);
    setTempFilters(removeFromState);
  };

  const openFilterMenu = () => {
    setTempFilters(appliedFilters);
    setIsFilterMenuOpen(!isFilterMenuOpen);
  };

  const handleCalculate = async () => {
    if (!selectedVolcano) return;
    setLoading(true);
    setResults(null);

    try {
      const response = await axios.post('http://localhost:8000/calculate', {
        name: selectedVolcano.name,
        elevation: selectedVolcano.elevation,
        location: { lat: selectedVolcano.position[0], lng: selectedVolcano.position[1] }
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
    ? 'bg-black/50 border-dark-border text-white placeholder-gray-400' 
    : 'bg-white/80 border-light-border text-stone-800 placeholder-stone-500';
  
  const cardClass = darkMode 
    ? 'bg-dark-surface/90 border-dark-border backdrop-blur-sm' 
    : 'bg-white/90 border-light-border backdrop-blur-sm shadow-xl';

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
        backgroundBlendMode: darkMode ? 'hard-light' : 'normal',
        backgroundColor: darkMode ? '#000000' : 'transparent' 
      }}
    >
      <div className={`min-h-screen w-full ${darkMode ? 'bg-black/70' : 'bg-orange-50/20'}`}>
      
      {/* HEADER */}
      <nav className={`p-4 border-b flex justify-between items-center backdrop-blur-md sticky top-0 z-50 
          ${darkMode ? 'border-dark-border bg-black/80' : 'border-light-border bg-white/70'}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Mountain className="text-volcano-red animate-pulse-slow" size={40} strokeWidth={2} />
            <div className="absolute -top-1 right-[35%] w-2 h-2 bg-volcano-orange rounded-full animate-ping"></div>
          </div>
          <h1 className={`text-2xl font-black tracking-widest ${darkMode ? 'text-white' : 'text-stone-800'}`}>
            VOLCANOS <span className="text-volcano-orange text-sm font-extrabold px-1 border border-volcano-orange rounded">SIMULATOR</span>
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
                ${darkMode 
                  ? 'border-volcano-orange text-volcano-orange bg-black hover:bg-volcano-orange hover:text-white' 
                  : 'border-volcano-red text-white bg-volcano-red hover:bg-red-700 shadow-md'}`}>
                {darkMode ? 'Mod: 🔥 MAGMA' : 'Mod: 🌸 FUJI'}
            </button>
        </div>
      </nav>

      <main className="container mx-auto p-4 space-y-6">
        
        {/* ÜST KISIM: HARİTA VE PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
            {/* SOL: HARİTA KARTI */}
            <div className={`md:col-span-2 rounded-xl overflow-hidden border-4 shadow-2xl relative z-20 
                ${darkMode ? 'border-dark-border' : 'border-light-border'}`}>
                
                {/* --- FİLTRE VE ETİKET BAR (HARİTA ÜSTÜNDE) --- */}
                <div className={`absolute top-4 left-14 right-4 z-[500] flex flex-wrap items-center gap-2 pointer-events-none`}>
                    
                    {/* FİLTRELE BUTONU (Tema Uyumlu) */}
                    <button 
                        onClick={openFilterMenu}
                        className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg font-bold transition-all transform hover:scale-105 border
                        ${darkMode 
                            ? 'bg-black/90 border-volcano-orange text-white hover:bg-volcano-orange hover:text-white' 
                            : 'bg-white/95 border-volcano-red text-stone-800 hover:bg-volcano-red hover:text-white'}`}
                    >
                        <Filter size={18} /> Filtrele
                    </button>

                    {/* Seçili Filtre Etiketleri (Chips) */}
                    <div className="flex flex-wrap gap-2 pointer-events-auto">
                        {Object.entries(appliedFilters).map(([category, values]) => 
                            values.map(val => (
                                <div key={`${category}-${val}`} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-md animate-in fade-in zoom-in border border-transparent
                                    ${darkMode ? 'bg-volcano-orange text-white hover:border-white' : 'bg-volcano-red text-white hover:border-stone-800'}`}>
                                    <span>{val}</span>
                                    <button onClick={() => removeFilter(category, val)} className="hover:bg-black/20 rounded-full p-0.5"><X size={12}/></button>
                                </div>
                            ))
                        )}
                        {/* Temizle Butonu */}
                        {(Object.values(appliedFilters).some(arr => arr.length > 0)) && (
                            <button 
                                onClick={() => { 
                                    const resetState = {region:[], country:[], status:[], elevation:[]};
                                    setAppliedFilters(resetState); 
                                    setTempFilters(resetState); 
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold shadow hover:bg-red-700 pointer-events-auto flex items-center gap-1"
                            >
                                <X size={12}/> Temizle
                            </button>
                        )}
                    </div>
                </div>

                {/* --- FİLTRE MENÜSÜ (DROPDOWN) --- */}
                {isFilterMenuOpen && (
                    <div className={`absolute top-16 left-14 z-[500] w-80 max-h-[450px] overflow-y-auto rounded-xl shadow-2xl border flex flex-col animate-in fade-in slide-in-from-top-2
                        ${darkMode ? 'bg-black/95 border-volcano-orange text-gray-200' : 'bg-white/95 border-volcano-red text-gray-800'} volcano-scrollbar`}>
                        
                        <div className="p-4 space-y-5">
                            
                            {/* 1. BÖLGE / KITA FİLTRESİ (En Üstte) */}
                            <div>
                                <h4 className="font-bold text-sm mb-2 opacity-80 uppercase tracking-wider flex items-center gap-2">
                                    <Globe size={14}/> Bölge / Kıta
                                </h4>
                                <div className="max-h-24 overflow-y-auto volcano-scrollbar pr-2 space-y-1 bg-white/5 p-2 rounded border border-white/10">
                                    {dynamicOptions.regions.map(region => (
                                        <label key={region} className="flex items-center gap-2 p-1 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={tempFilters.region.includes(region)}
                                                onChange={() => toggleTempFilter('region', region)}
                                                className="accent-volcano-orange w-4 h-4 rounded-sm"
                                            />
                                            <span className="text-xs truncate">{region}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-white/10" />

                            {/* 2. ÜLKE FİLTRESİ */}
                            <div>
                                <h4 className="font-bold text-sm mb-2 opacity-80 uppercase tracking-wider flex items-center gap-2">
                                    <MapPin size={14}/> Ülke
                                </h4>
                                <div className="max-h-24 overflow-y-auto volcano-scrollbar pr-2 space-y-1 bg-white/5 p-2 rounded border border-white/10">
                                    {dynamicOptions.countries.map(country => (
                                        <label key={country} className="flex items-center gap-2 p-1 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={tempFilters.country.includes(country)}
                                                onChange={() => toggleTempFilter('country', country)}
                                                className="accent-volcano-orange w-4 h-4 rounded-sm"
                                            />
                                            <span className="text-xs truncate">{country}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-white/10" />

                            {/* 3. DURUM FİLTRESİ */}
                            <div>
                                <h4 className="font-bold text-sm mb-2 opacity-80 uppercase tracking-wider">Durum</h4>
                                <div className="flex flex-wrap gap-2">
                                    {filterOptions.status.map(status => (
                                        <button 
                                            key={status}
                                            onClick={() => toggleTempFilter('status', status)}
                                            className={`px-3 py-1 rounded-md text-xs font-bold border transition-all flex items-center gap-1
                                                ${tempFilters.status.includes(status) 
                                                    ? 'bg-volcano-orange text-white border-volcano-orange shadow-inner' 
                                                    : 'border-gray-500/50 hover:bg-gray-500/20 opacity-70 hover:opacity-100'}`}
                                        >
                                            {tempFilters.status.includes(status) && <Check size={12} />} {status === 'Active' ? 'AKTİF 🌋' : 'PASİF 💤'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-white/10" />

                            {/* 4. YÜKSEKLİK FİLTRESİ */}
                            <div>
                                <h4 className="font-bold text-sm mb-2 opacity-80 uppercase tracking-wider flex items-center gap-2">
                                    <Mountain size={14}/> Yükseklik
                                </h4>
                                <div className="space-y-1 bg-white/5 p-2 rounded border border-white/10">
                                    {filterOptions.elevation.map(opt => (
                                        <label key={opt.label} className="flex items-center gap-2 p-1 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={tempFilters.elevation.includes(opt.label)}
                                                onChange={() => toggleTempFilter('elevation', opt.label)}
                                                className="accent-volcano-orange w-4 h-4 rounded-sm"
                                            />
                                            <span className="text-xs">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Alt Butonlar */}
                        <div className={`p-4 border-t flex justify-between items-center sticky bottom-0 backdrop-blur-md
                            ${darkMode ? 'bg-black/80 border-gray-700' : 'bg-white/90 border-gray-300'}`}>
                            <button 
                                onClick={() => setIsFilterMenuOpen(false)}
                                className="text-xs font-bold opacity-60 hover:opacity-100 hover:underline"
                            >
                                Vazgeç
                            </button>
                            <button 
                                onClick={applyFilters}
                                className="px-6 py-2 bg-volcano-orange hover:bg-volcano-red text-white text-sm font-bold rounded shadow-lg transition-transform hover:scale-105"
                            >
                                SONUÇLARI GÖSTER
                            </button>
                        </div>
                    </div>
                )}

                <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                    <ChangeView center={selectedVolcano ? selectedVolcano.position : [20, 0]} zoom={selectedVolcano ? 10 : 2} />
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url={darkMode 
                          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                          : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"} 
                    />
                    
                    {displayVolcanoes.map(v => (
                        <Marker 
                            key={v.id} 
                            position={v.position}
                            eventHandlers={{ click: () => { setSelectedVolcano(v); setResults(null); } }}
                        >
                            <Popup>
                                <div className='font-bold'>{v.name}</div>
                                <div className='text-xs'>{v.country} - {v.elevation}m</div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* SAĞ: BİLGİ PANELİ */}
            <div className={`p-6 rounded-xl border-2 flex flex-col justify-between shadow-lg transition-all ${cardClass}`}>
                <div>
                    <h2 className={`text-xl font-bold border-b pb-2 mb-4 flex items-center gap-2
                      ${darkMode ? 'border-volcano-red text-white' : 'border-light-border text-stone-800'}`}>
                        <Mountain size={24} className="text-volcano-orange" /> 
                        {selectedVolcano ? "Yanardağ Bilgileri" : "Yanardağ Seçiniz"}
                    </h2>
                    
                    {selectedVolcano ? (
                        <div className={`space-y-4 ${darkMode ? 'text-gray-200' : 'text-stone-700'}`}>
                            
                            <div className="flex justify-between items-center p-2 rounded bg-black/10">
                                <span className='flex items-center gap-2'><MapPin size={16}/> Konum:</span>
                                <span className="font-bold text-sm text-right truncate w-40">{selectedVolcano.country}</span>
                            </div>

                            <div className="flex justify-between items-center p-2 rounded bg-black/10">
                                <span>Yükseklik:</span>
                                <span className="font-mono text-volcano-orange font-bold text-lg">{selectedVolcano.elevation} m</span>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 rounded bg-black/10">
                                <span>Durum:</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-sm ${
                                    selectedVolcano.status === 'Active' 
                                    ? 'bg-red-900/50 text-red-400 border border-red-500' 
                                    : 'bg-green-900/50 text-green-400 border border-green-500'
                                }`}>
                                    {selectedVolcano.status === 'Active' ? 'AKTİF 🌋' : 'PASİF 💤'}
                                </span>
                            </div>
                            
                            <div className="p-3 border rounded text-xs opacity-70">
                                {selectedVolcano.name}, {selectedVolcano.region || selectedVolcano.country} bölgesinde yer almaktadır.
                            </div>
                        </div>
                    ) : (
                        <div className="text-center opacity-70 mt-10 space-y-2">
                            <Mountain size={48} className="mx-auto text-volcano-orange opacity-50" />
                            <p>Simülasyon için haritadan bir dağ seçin veya arama yapın.</p>
                            <p className='text-xs opacity-50'>
                                {displayVolcanoes.length} yanardağ listeleniyor.
                            </p>
                        </div>
                    )}
                </div>
                <button 
                    onClick={handleCalculate}
                    disabled={!selectedVolcano || loading}
                    className={`w-full py-4 rounded-lg font-bold text-lg tracking-wider transition-all transform hover:scale-[1.02] active:scale-95 shadow-volcano-glow
                    ${!selectedVolcano ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' : 
                      loading ? 'bg-volcano-orange/80 animate-pulse' : 'bg-volcano-orange hover:bg-volcano-red text-white'}`}
                >
                    {loading ? "HESAPLANIYOR..." : "SİMÜLASYONU BAŞLAT"}
                </button>
            </div>
        </div>

        {/* --- SONUÇLAR (8 CONTAINER) --- */}
        {results && (
            <div className="text-center py-6">
                <h2 className={`text-3xl font-black uppercase tracking-[0.2em] drop-shadow-md inline-block px-6 py-2 rounded-full backdrop-blur-sm
                    ${darkMode ? 'text-volcano-orange bg-black/20' : 'text-stone-800 bg-white/60 border border-light-border'}`}>
                    Simülasyon Sonuçları
                </h2>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
            {/* 1. Monte Carlo */}
            <ResultBox title="1. Monte Carlo Parametreleri" loading={loading} data={results} delay={0} icon={<Activity />} darkMode={darkMode} cardClass={cardClass}>
                {results && (
                    <div className="space-y-2 text-sm font-bold">
                         <p className="flex justify-between border-b border-current pb-1 opacity-70"><span>Yoğunluk:</span> <span className="text-volcano-orange">{results.monte_carlo.density.toFixed(0)} kg/m³</span></p>
                         <p className="flex justify-between border-b border-current pb-1 opacity-70"><span>Basınç:</span> <span className="text-volcano-orange">{(results.monte_carlo.pressure/1e6).toFixed(1)} MPa</span></p>
                         <p className="flex justify-between"><span>Magma Sıcaklığı:</span> <span className="text-volcano-orange">{results.monte_carlo.temp.toFixed(0)} K</span></p>
                    </div>
                )}
            </ResultBox>

            {/* 2. Ezilme Mesafesi */}
            <ResultBox title="2. Ezilme Mesafesi" loading={loading} data={results} delay={300} icon={<AlertTriangle className="text-volcano-red"/>} darkMode={darkMode} cardClass={cardClass}>
                {results && (
                    <div className="text-center">
                        <p className="text-lg opacity-80">Maksimum Kaya Menzili</p>
                        <p className="text-5xl font-black text-volcano-red my-3 drop-shadow-lg">{(results.crush_distance/1000).toFixed(2)} km</p>
                        <p className="text-xs opacity-60">Bu mesafeye kadar kayaç düşme riski var.</p>
                    </div>
                )}
            </ResultBox>

            {/* 3. Sıcaklık ve Enerji Etkisi (Liste Halinde) */}
            <ResultBox title="3. Sıcaklık ve Enerji Etkisi" loading={loading} data={results} delay={600} icon={<Thermometer />} darkMode={darkMode} cardClass={cardClass}>
                {results && (
                    <div className="h-full flex flex-col justify-center">
                        <div className={`grid grid-cols-3 gap-2 text-xs font-bold mb-2 pb-1 border-b ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                            <span>Mesafe</span>
                            <span className="text-center">Sıcaklık</span>
                            <span className="text-right">Enerji</span>
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-[150px] pr-2 volcano-scrollbar">
                            {results.impact_points.map((point, index) => (
                                <div key={index} className={`grid grid-cols-3 gap-2 text-sm p-1 rounded ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                                    <span className="opacity-80 flex flex-col">
                                        <span className="text-[10px] uppercase opacity-50">{point.label}</span>
                                        {point.distance_km} km
                                    </span>
                                    <span className={`text-center font-bold ${point.temp_c > 100 ? 'text-red-500' : 'text-orange-400'}`}>
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
            <ResultBox title="4. Partikül Bulutu Etkisi (3D)" loading={loading} data={results} delay={900} icon={<Layers />} darkMode={darkMode} cardClass={cardClass}>
                {results && (
                    <div className="space-y-4 text-center">
                        <p className="text-sm opacity-80">Rüzgar etkisiyle oluşan bulut sınırları:</p>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-black/20 p-2 rounded">
                                <span className="block text-xs opacity-60">Max X (Doğu/Batı)</span>
                                <span className="font-bold text-volcano-orange">{(results.particle_spread.x / 1000).toFixed(1)} km</span>
                            </div>
                            <div className="bg-black/20 p-2 rounded">
                                <span className="block text-xs opacity-60">Max Y (Kuzey/Güney)</span>
                                <span className="font-bold text-volcano-orange">{(results.particle_spread.y / 1000).toFixed(1)} km</span>
                            </div>
                            <div className="bg-black/20 p-2 rounded">
                                <span className="block text-xs opacity-60">Max Z (Yükseklik)</span>
                                <span className="font-bold text-volcano-orange">{(results.particle_spread.z).toFixed(0)} m</span>
                            </div>
                        </div>
                    </div>
                )}
            </ResultBox>

            {/* 5. Patlama Şiddeti */}
            <ResultBox title="5. Patlama Şiddeti" loading={loading} data={results} delay={1200} icon={<Flame />} darkMode={darkMode} cardClass={cardClass}>
                {results && (
                    <div className="text-center">
                        <p className="text-lg opacity-80">Volkanik Patlama İndeksi</p>
                        <p className="text-4xl font-bold text-volcano-orange my-2">{results.intensity.toFixed(1)}</p>
                        <p className="text-xs opacity-60">Yanardağ boyutu ve basınç baz alındı.</p>
                    </div>
                )}
            </ResultBox>

            {/* 6. Güvenli Bölge Analizi */}
            <ResultBox title="6. Güvenli Bölge Analizi" loading={loading} data={results} delay={1500} icon={<ShieldAlert className="text-green-500" />} darkMode={darkMode} cardClass={cardClass}>
                {results && (
                    <div className={`p-4 rounded border-2 text-center ${darkMode ? 'border-green-800 bg-green-900/20' : 'border-green-300 bg-green-100'}`}>
                        <p className="font-bold text-green-600 mb-2">Önerilen Güvenli Mesafe</p>
                        <p className="text-3xl font-black">{(results.safe_zone / 1000).toFixed(1)} km</p>
                        <p className="text-xs mt-2 opacity-70">Merkezden itibaren bu yarıçap dışı güvenlidir.</p>
                    </div>
                )}
            </ResultBox>

            {/* 7. Atmosferik Etki */}
            <ResultBox title="7. Atmosferik Etki (Sürüklenme)" loading={loading} data={results} delay={1800} icon={<Wind />} darkMode={darkMode} cardClass={cardClass}>
                {results && results.atmosphere && (
                    <div className="space-y-4 font-medium">
                        <div className={`flex justify-between items-center border-b pb-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                            <span className="opacity-80">Rüzgar Hızı:</span>
                            <span className="font-mono font-bold text-volcano-orange">{results.atmosphere.wind_speed.toFixed(1)} m/s</span>
                        </div>

                        <div className={`flex justify-between items-center border-b pb-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                            <span className="opacity-80">Sürüklenme Katsayısı:</span>
                            <span className={`font-bold ${results.atmosphere.drag_factor > 0.7 ? 'text-red-500' : 'text-green-500'}`}>
                                {results.atmosphere.drag_factor}
                            </span>
                        </div>

                        <div className={`text-center p-3 rounded ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                            <span className="text-[10px] uppercase tracking-widest opacity-60 block mb-1">Bulut Davranışı</span>
                            <p className={`text-lg font-black leading-tight ${results.atmosphere.drag_factor > 0.7 ? 'text-red-500' : 'text-volcano-orange'}`}>
                                {results.atmosphere.plume_behavior || "Analiz Ediliyor..."}
                            </p>
                        </div>
                    </div>
                )}
            </ResultBox>

            {/* 8. NİHAİ RİSK KARARI */}
            <ResultBox 
                title="8. Nihai Risk Kararı" 
                loading={loading} 
                data={results} 
                delay={2100} 
                icon={<CheckCircle className={results ? "text-volcano-orange" : "text-volcano-red"} />} 
                darkMode={darkMode} 
                cardClass={cardClass}
            >
                {results && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                        <span className={`font-black text-6xl tracking-wider drop-shadow-lg uppercase ${getRiskAnimationClass(results.final_decision)}`}>
                            {results.final_decision}
                        </span>
                        <p className="text-sm opacity-80 border-t border-gray-500/30 pt-2 w-full">
                            Tahmini risk seviyesi hesaplandı.
                        </p>
                    </div>
                )}
            </ResultBox>

        </div>
      </main>
      </div>
    </div>
  );
}

// --- ORTAK SONUÇ KUTUSU ---
function ResultBox({ title, loading, data, children, delay, icon, darkMode, cardClass }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (data && !loading) {
            const timer = setTimeout(() => setShow(true), delay);
            return () => clearTimeout(timer);
        } else {
            setShow(false);
        }
    }, [data, loading, delay]);

    return (
        <div className={`rounded-xl p-6 min-h-[220px] flex flex-col relative overflow-hidden transition-all border-2 hover:border-volcano-orange ${cardClass}`}>
            <div className={`flex items-center gap-3 mb-4 border-b pb-3 ${darkMode ? 'border-gray-700' : 'border-yellow-600/30'}`}>
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-black/40' : 'bg-white/50'}`}>
                  {icon}
                </div>
                <h3 className={`font-bold text-lg tracking-wide ${darkMode ? 'text-white' : 'text-stone-800'}`}>{title}</h3>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
                {loading ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-volcano-orange border-t-volcano-yellow rounded-full animate-spin"></div>
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