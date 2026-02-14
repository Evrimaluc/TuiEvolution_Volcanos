import { useState, useEffect, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import Papa from 'papaparse';
import L from 'leaflet';

import magmaDarkBg from '/assets/magma-bg.jpg';
import magmaLightBg from '/assets/magma_ligthmode.png';

// Bileşenler
import Header from './components/Header';
import FilterUI from './components/FilterUI';
import VolcanoMap from './components/VolcanoMap';
import InfoPanel from './components/InfoPanel'; // Yeni klasör yapısını import eder
import SimulationResults from './components/SimulationResults';

// Yardımcılar ve Servisler
import { getContinent } from './utils/helpers';
import { runSimulation } from './services/simulationService';

// Leaflet İkon Düzeltmesi
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function App() {
  const [volcanoes, setVolcanoes] = useState([]); 
  const [selectedVolcano, setSelectedVolcano] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  // Filtre State'leri
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  
  const initialFilters = { status: [], elevation: [], continent: [], country: [] };
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [tempFilters, setTempFilters] = useState(initialFilters);

  // --- HELPER VERİLER ---
  const dynamicOptions = useMemo(() => {
    const countries = [...new Set(volcanoes.map(v => v.country))].sort();
    const regions = [...new Set(volcanoes.map(v => v.continent))].sort();
    return { countries, regions };
  }, [volcanoes]);

  const availableCountries = useMemo(() => {
    if (tempFilters.continent.length === 0) return [];
    const filteredByContinent = volcanoes.filter(v => tempFilters.continent.includes(v.continent));
    return [...new Set(filteredByContinent.map(v => v.country))].sort();
  }, [volcanoes, tempFilters.continent]);

  // --- VERİ OKUMA ---
  useEffect(() => {
    // processed_volcanoes.csv public klasöründe olmalı!
    Papa.parse('/processed_volcanoes.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const processedData = results.data.filter(v => {
            const elevation = v['Elevation (m)'];
            const lat = v['Latitude'];
            const lng = v['Longitude'];
            return (typeof elevation === 'number' && elevation >= 0 && lat != null && lng != null);
        }).map((v, index) => ({
            id: index,
            name: v['Volcano Name'] || "Bilinmeyen",
            country: v['Country'] || "Bilinmiyor",
            regionRaw: v['Location'],
            continent: getContinent(v['Location'], v['Country']),
            elevation: v['Elevation (m)'],
            status: v['Last Known Eruption'] || 'Unknown',
            position: [v['Latitude'], v['Longitude']]
        }));
        setVolcanoes(processedData);
      },
      error: (err) => console.error("CSV Hatası:", err)
    });
  }, []);

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
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = v.name?.toLowerCase().includes(searchLower) ||
                            v.country?.toLowerCase().includes(searchLower) ||
                            v.continent?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;

      if (appliedFilters.status.length > 0 && !appliedFilters.status.includes(v.status)) return false;
      
      if (appliedFilters.elevation.length > 0) {
         // (Basit label kontrolü - Önceki mantığın aynısı)
         const labels = appliedFilters.elevation;
         let match = false;
         if(labels.includes('0 - 1000m') && v.elevation < 1000) match = true;
         if(labels.includes('1000m - 2000m') && v.elevation >= 1000 && v.elevation < 2000) match = true;
         if(labels.includes('2000m - 3000m') && v.elevation >= 2000 && v.elevation < 3000) match = true;
         if(labels.includes('3000m - 4000m') && v.elevation >= 3000 && v.elevation < 4000) match = true;
         if(labels.includes('4000m - 5000m') && v.elevation >= 4000 && v.elevation < 5000) match = true;
         if(labels.includes('5000m - 6000m') && v.elevation >= 5000 && v.elevation < 6000) match = true;
         if(labels.includes('6000m+') && v.elevation >= 6000) match = true;
         if (!match) return false;
      }

      if (appliedFilters.continent.length > 0 && !appliedFilters.continent.includes(v.continent)) return false;
      if (appliedFilters.country.length > 0 && !appliedFilters.country.includes(v.country)) return false;

      return true;
    });
  }, [volcanoes, searchTerm, appliedFilters]);

  // --- HANDLERS ---

  // ÖNEMLİ: Seçim yapıldığında filtreleri ve aramayı sıfırla
  const handleSelectFromList = (volcano) => {
      setSelectedVolcano(volcano);
      setResults(null);
      
      // UX: Seçim yapıldığında kullanıcı tüm odağı o dağa versin diye filtreleri temizliyoruz
      setSearchTerm(""); 
      setAppliedFilters(initialFilters);
      setTempFilters(initialFilters);
  };

  const toggleTempFilter = (category, value) => {
    setTempFilters(prev => {
      const currentList = prev[category];
      let newList = currentList.includes(value) 
        ? currentList.filter(item => item !== value) 
        : [...currentList, value];
      return { ...prev, [category]: newList };
    });
  };

  const applyFilters = () => {
    setAppliedFilters(tempFilters);
    setIsFilterMenuOpen(false);
    setSelectedVolcano(null);
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
      const data = await runSimulation(selectedVolcano);
      setTimeout(() => {
        setResults(data);
        setLoading(false);
      }, 500);
    } catch (error) {
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

  return (
    <div 
      className="min-h-screen transition-colors duration-500 bg-cover bg-fixed bg-center flex flex-col"
      style={{
        backgroundImage: `url(${darkMode ? magmaDarkBg : magmaLightBg})`,
        backgroundBlendMode: darkMode ? 'hard-light' : 'normal',
        backgroundColor: darkMode ? '#000000' : 'transparent' 
      }}
    >
      <div className={`min-h-screen w-full flex flex-col ${darkMode ? 'bg-black/70' : 'bg-orange-50/20'}`}>
        
        <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            inputBgClass={inputBgClass} 
        />

        <main className="container mx-auto p-4 space-y-6 flex-1 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[550px]">
                
                <div className={`md:col-span-2 rounded-xl overflow-hidden border-4 shadow-2xl relative z-10 flex flex-col
                    ${darkMode ? 'border-dark-border' : 'border-light-border'}`}>
                    
                    <FilterUI 
                        darkMode={darkMode}
                        isFilterMenuOpen={isFilterMenuOpen}
                        setIsFilterMenuOpen={setIsFilterMenuOpen}
                        appliedFilters={appliedFilters}
                        tempFilters={tempFilters}
                        toggleTempFilter={toggleTempFilter}
                        applyFilters={applyFilters}
                        removeFilter={removeFilter}
                        openFilterMenu={openFilterMenu}
                        setAppliedFilters={setAppliedFilters}
                        setTempFilters={setTempFilters}
                        dynamicOptions={dynamicOptions}
                        availableCountries={availableCountries}
                    />

                    <div className="flex-1 w-full h-full relative z-0">
                        <VolcanoMap 
                            darkMode={darkMode}
                            selectedVolcano={selectedVolcano}
                            setSelectedVolcano={setSelectedVolcano}
                            displayVolcanoes={displayVolcanoes}
                            handleSelectFromList={handleSelectFromList}
                        />
                    </div>
                </div>

                <InfoPanel 
                    selectedVolcano={selectedVolcano}
                    setSelectedVolcano={setSelectedVolcano}
                    displayVolcanoes={displayVolcanoes}
                    handleSelectFromList={handleSelectFromList}
                    handleCalculate={handleCalculate}
                    loading={loading}
                    darkMode={darkMode}
                    cardClass={cardClass}
                />
            </div>

            <SimulationResults 
                results={results} 
                loading={loading} 
                darkMode={darkMode} 
                cardClass={cardClass} 
            />
        </main>
      </div>
    </div>
  );
}