import { useState, useEffect } from 'react';
import { Mountain } from 'lucide-react';

export default function ResultBox({ title, loading, data, children, delay, icon, darkMode, cardClass }) {
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