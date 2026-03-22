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
        <h1 className={`text-3xl font-black tracking-widest ${darkMode ? 'text-white' : 'text-stone-800'}`}>
          VOLCANOS <span className="text-volcano-orange text-base font-black px-2.5 py-0.5 border-2 border-volcano-orange rounded-md tracking-wider ml-1">
            SIMULATOR
          </span>
        </h1>
      </div>

      {/* Sağ Kısım: Arama, Tema ve TUIEVOLUTION */}
      <div className="flex items-center gap-6">
        {/* Arama Çubuğu */}
        <input
          type="text"
          placeholder="Yanardağ Ara (İsim veya Ülke)..."
          className={`px-3 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-volcano-orange w-64 transition-all ${inputBgClass}`}
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
        />

        {/* Tema Değiştirme Butonu */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`text-sm border px-4 py-1 rounded font-bold transition-all transform hover:scale-105
            ${darkMode
              ? 'border-volcano-orange text-volcano-orange bg-black hover:bg-volcano-orange hover:text-white'
              : 'border-volcano-red text-white bg-volcano-red hover:bg-red-700 shadow-md'}`}>
          {darkMode ? 'Mod: 🔥 MAGMA' : 'Mod: 🌸 FUJI'}
        </button>

        <a
          href="https://tuievolution.vercel.app/"
          target="_blank"
          rel="noreferrer"
          className="tracking-tighter hover:scale-105 transition-transform duration-300 ml-4"
        >
          <h2 className="text-3xl font-[1000] uppercase leading-none">
            <span className={`bg-clip-text text-transparent bg-gradient-to-r 
      ${darkMode
                ? 'from-volcano-red via-volcano-orange to-yellow-500'
                : 'from-red-800 via-volcano-red to-volcano-orange'} 
      drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]`}>
              TUIEVOLUTION
            </span>
          </h2>
        </a>
      </div>
    </nav>
  );
}