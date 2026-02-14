import ResultBox from './ResultBox';
import { Activity, AlertTriangle, Thermometer, Layers, Flame, ShieldAlert, Wind, CheckCircle } from 'lucide-react';
import { getRiskAnimationClass } from '../utils/helpers';

export default function SimulationResults({ results, loading, darkMode, cardClass }) {
  return (
    <>
        {/* Başlık HER ZAMAN görünür (kullanıcı isteği) */}
        <div className="text-center py-6">
            <h2 className={`text-3xl font-black uppercase tracking-[0.2em] drop-shadow-md inline-block px-6 py-2 rounded-full backdrop-blur-sm
                ${darkMode ? 'text-volcano-orange bg-black/20' : 'text-stone-800 bg-white/60 border border-light-border'}`}>
                Simülasyon Sonuçları
            </h2>
        </div>

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

            {/* 3. Sıcaklık */}
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

            {/* 4. Bulut */}
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

            {/* 5. Şiddet */}
            <ResultBox title="5. Patlama Şiddeti" loading={loading} data={results} delay={1200} icon={<Flame />} darkMode={darkMode} cardClass={cardClass}>
                {results && (
                    <div className="text-center">
                        <p className="text-lg opacity-80">Volkanik Patlama İndeksi</p>
                        <p className="text-4xl font-bold text-volcano-orange my-2">{results.intensity.toFixed(1)}</p>
                        <p className="text-xs opacity-60">Yanardağ boyutu ve basınç baz alındı.</p>
                    </div>
                )}
            </ResultBox>

            {/* 6. Güvenli Bölge */}
            <ResultBox title="6. Güvenli Bölge Analizi" loading={loading} data={results} delay={1500} icon={<ShieldAlert className="text-green-500" />} darkMode={darkMode} cardClass={cardClass}>
                {results && (
                    <div className={`p-4 rounded border-2 text-center ${darkMode ? 'border-green-800 bg-green-900/20' : 'border-green-300 bg-green-100'}`}>
                        <p className="font-bold text-green-600 mb-2">Önerilen Güvenli Mesafe</p>
                        <p className="text-3xl font-black">{(results.safe_zone / 1000).toFixed(1)} km</p>
                        <p className="text-xs mt-2 opacity-70">Merkezden itibaren bu yarıçap dışı güvenlidir.</p>
                    </div>
                )}
            </ResultBox>

            {/* 7. Atmosfer */}
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

            {/* 8. Karar */}
            <ResultBox title="8. Nihai Risk Kararı" loading={loading} data={results} delay={2100} icon={<CheckCircle className={results ? "text-volcano-orange" : "text-volcano-red"} />} darkMode={darkMode} cardClass={cardClass}>
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
    </>
  );
}