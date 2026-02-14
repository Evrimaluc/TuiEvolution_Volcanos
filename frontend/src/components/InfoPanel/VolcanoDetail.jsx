import { MapPin, ArrowLeft } from 'lucide-react';

export default function VolcanoDetail({ selectedVolcano, onBack, onSimulate, loading, darkMode }) {
  return (
    <div className={`flex-1 flex flex-col space-y-4 overflow-y-auto volcano-scrollbar pr-2 ${darkMode ? 'text-gray-200' : 'text-stone-700'} animate-in fade-in slide-in-from-right-4`}>
        
        <button 
            onClick={onBack} 
            className="text-xs flex items-center gap-1 opacity-70 hover:opacity-100 hover:text-volcano-orange transition-colors mb-1 self-start sticky top-0 bg-inherit z-10 py-2"
        >
            <ArrowLeft size={12}/> Listeye Geri Dön
        </button>

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
            {selectedVolcano.name}, {selectedVolcano.continent} kıtasında, {selectedVolcano.country} ülkesinde yer almaktadır.
        </div>

        {/* Simülasyon Butonu */}
        <div className="pt-4 mt-auto pb-2">
            <button 
                onClick={onSimulate}
                disabled={loading}
                className={`w-full py-4 rounded-lg font-bold text-lg tracking-wider transition-all transform hover:scale-[1.02] active:scale-95 shadow-volcano-glow
                ${loading ? 'bg-volcano-orange/80 animate-pulse' : 'bg-volcano-orange hover:bg-volcano-red text-white'}`}
            >
                {loading ? "HESAPLANIYOR..." : "SİMÜLASYONU BAŞLAT"}
            </button>
        </div>
    </div>
  );
}