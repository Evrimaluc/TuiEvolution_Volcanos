import { Filter, X, Globe, MapPin, Activity, Mountain, Check } from 'lucide-react';
import { filterOptions } from '../utils/helpers';

export default function FilterUI({ 
    darkMode, 
    isFilterMenuOpen, 
    setIsFilterMenuOpen, 
    appliedFilters, 
    tempFilters, 
    toggleTempFilter, 
    applyFilters, 
    removeFilter, 
    openFilterMenu,
    setAppliedFilters,
    setTempFilters,
    dynamicOptions,
    availableCountries
}) {
  return (
    <>
        {/* Buton ve Etiketler */}
        <div className={`absolute top-4 left-14 right-4 z-[1000] flex flex-wrap items-center gap-2 pointer-events-none`}>
            <button 
                onClick={openFilterMenu}
                className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg font-bold transition-all transform hover:scale-105 border
                ${darkMode 
                    ? 'bg-black/90 border-volcano-orange text-white hover:bg-volcano-orange hover:text-white' 
                    : 'bg-white/95 border-volcano-red text-stone-800 hover:bg-volcano-red hover:text-white'}`}
            >
                <Filter size={18} /> Filtrele
            </button>

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
                {(Object.values(appliedFilters).some(arr => arr.length > 0)) && (
                    <button 
                        onClick={() => { 
                            const resetState = {continent:[], country:[], status:[], elevation:[]};
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

        {/* Açılır Menü */}
        {isFilterMenuOpen && (
            <div className={`absolute top-16 left-14 z-[1001] w-80 max-h-[80%] overflow-y-auto rounded-xl shadow-2xl border flex flex-col animate-in fade-in slide-in-from-top-2
                ${darkMode ? 'bg-black/95 border-volcano-orange text-gray-200' : 'bg-white/95 border-volcano-red text-gray-800'} volcano-scrollbar`}>
                
                <div className="p-4 space-y-5">
                    
                    {/* KITA */}
                    <div>
                        <h4 className="font-bold text-sm mb-2 opacity-80 uppercase tracking-wider flex items-center gap-2">
                            <Globe size={14}/> Bölge / Kıta
                        </h4>
                        <div className="space-y-1 bg-white/5 p-2 rounded border border-white/10">
                            {filterOptions.continents.map(cont => (
                                <label key={cont} className="flex items-center gap-2 p-1 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={tempFilters.continent.includes(cont)}
                                        onChange={() => toggleTempFilter('continent', cont)}
                                        className="accent-volcano-orange w-4 h-4 rounded-sm"
                                    />
                                    <span className="text-xs">{cont}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <hr className="border-current opacity-20" />

                    {/* ÜLKE */}
                    <div>
                        <h4 className="font-bold text-sm mb-2 opacity-80 uppercase tracking-wider flex items-center gap-2">
                            <MapPin size={14}/> Ülke <span className='text-[10px] opacity-50 normal-case font-normal'>(Önce Kıta Seçiniz)</span>
                        </h4>
                        <div className="max-h-32 overflow-y-auto volcano-scrollbar pr-2 space-y-1 bg-white/5 p-2 rounded border border-white/10">
                            {availableCountries.length > 0 ? availableCountries.map(country => (
                                <label key={country} className="flex items-center gap-2 p-1 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={tempFilters.country.includes(country)}
                                        onChange={() => toggleTempFilter('country', country)}
                                        className="accent-volcano-orange w-4 h-4 rounded-sm"
                                    />
                                    <span className="text-xs truncate">{country}</span>
                                </label>
                            )) : (
                                <div className="text-xs opacity-50 p-2 text-center italic">Lütfen listelenmesi için bir kıta seçin.</div>
                            )}
                        </div>
                    </div>

                    <hr className="border-current opacity-20" />

                    {/* DURUM */}
                    <div>
                        <h4 className="font-bold text-sm mb-2 opacity-80 uppercase tracking-wider flex items-center gap-2">
                            <Activity size={14}/> Durum
                        </h4>
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

                    <hr className="border-current opacity-20" />

                    {/* YÜKSEKLİK */}
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
    </>
  );
}