import { Navigation } from 'lucide-react';

export default function VolcanoList({ displayVolcanoes, handleSelectFromList, darkMode }) {
  return (
    <div className="flex flex-col h-full">
        <div className="text-center opacity-70 mb-2 flex-shrink-0">
            <p className='text-xs font-bold text-volcano-orange border-b border-volcano-orange/30 pb-2'>
                {displayVolcanoes.length} yanardağ listeleniyor.
            </p>
        </div>
        
        <div className="flex-1 overflow-y-auto volcano-scrollbar pr-2 space-y-2">
            {displayVolcanoes.length > 0 ? displayVolcanoes.map(v => (
                <div 
                    key={v.id}
                    onClick={() => handleSelectFromList(v)}
                    className={`p-3 rounded border cursor-pointer transition-all flex justify-between items-center group
                        ${darkMode 
                            ? 'bg-white/5 border-gray-800 hover:bg-volcano-orange hover:border-volcano-orange hover:text-white' 
                            : 'bg-black/5 border-gray-200 hover:bg-volcano-red hover:text-white'}`}
                >
                    <div>
                        <div className="font-bold text-sm group-hover:text-white">{v.name}</div>
                        <div className="text-[10px] opacity-60 group-hover:text-white/80">{v.country}</div>
                    </div>
                    <Navigation size={14} className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1"/>
                </div>
            )) : (
                <div className="text-center opacity-50 text-sm mt-10">
                    Kriterlere uygun yanardağ bulunamadı.
                </div>
            )}
        </div>
    </div>
  );
}