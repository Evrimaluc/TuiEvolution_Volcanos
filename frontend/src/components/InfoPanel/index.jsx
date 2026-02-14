import { Mountain } from 'lucide-react';
import VolcanoList from './VolcanoList';
import VolcanoDetail from './VolcanoDetail';

export default function InfoPanel({ 
    selectedVolcano, 
    setSelectedVolcano, 
    displayVolcanoes, 
    handleSelectFromList, 
    handleCalculate, 
    loading, 
    darkMode, 
    cardClass 
}) {
  return (
    <div className={`p-6 rounded-xl border-2 flex flex-col h-full shadow-lg transition-all overflow-hidden ${cardClass}`} style={{maxHeight: '100%'}}>
        
        {/* Üst Başlık (Sabit) */}
        <div className="flex-shrink-0">
            <h2 className={`text-xl font-bold border-b pb-2 mb-4 flex items-center gap-2
              ${darkMode ? 'border-volcano-red text-white' : 'border-light-border text-stone-800'}`}>
                <Mountain size={24} className="text-volcano-orange" /> 
                {selectedVolcano ? "Yanardağ Bilgileri" : "Yanardağ Seçiniz"}
            </h2>
        </div>
        
        {/* İçerik Değiştirici */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
            {selectedVolcano ? (
                <VolcanoDetail 
                    selectedVolcano={selectedVolcano}
                    onBack={() => setSelectedVolcano(null)}
                    onSimulate={handleCalculate}
                    loading={loading}
                    darkMode={darkMode}
                />
            ) : (
                <VolcanoList 
                    displayVolcanoes={displayVolcanoes}
                    handleSelectFromList={handleSelectFromList}
                    darkMode={darkMode}
                />
            )}
        </div>
    </div>
  );
}