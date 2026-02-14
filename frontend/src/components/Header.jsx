import { Mountain } from 'lucide-react';

export default function Header({ darkMode, setDarkMode, searchTerm, setSearchTerm, inputBgClass }) {
  return (
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
            placeholder="Yanardağ Ara (İsim veya Ülke)..." 
            className={`px-3 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-volcano-orange w-64 transition-all ${inputBgClass}`}
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm} // Controlled Input: App state'ine bağlı
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
  );
}