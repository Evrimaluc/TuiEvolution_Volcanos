export const getContinent = (region, country) => {
    const r = region ? String(region).toLowerCase() : "";
    const c = country ? String(country).toLowerCase() : "";
    const text = r + " " + c;
    
    if (text.includes("antarctica")) return "Antarktika";
    if (text.includes("australia") || text.includes("new zealand") || text.includes("vanuatu") || text.includes("papua") || text.includes("solomon") || text.includes("fiji") || text.includes("tonga") || text.includes("samoa")) return "Avustralya";
    if (text.includes("japan") || text.includes("indonesia") || text.includes("philippines") || text.includes("russia") || text.includes("kamchatka") || text.includes("kuril") || text.includes("india") || text.includes("china") || text.includes("taiwan") || text.includes("vietnam")) return "Asya";
    if (text.includes("italy") || text.includes("iceland") || text.includes("greece") || text.includes("spain") || text.includes("portugal") || text.includes("france") || text.includes("norway") || text.includes("germany") || text.includes("turkey") || text.includes("georgia") || text.includes("armenia")) return "Avrupa";
    if (text.includes("africa") || text.includes("congo") || text.includes("ethiopia") || text.includes("kenya") || text.includes("tanzania") || text.includes("cameroon") || text.includes("cape verde") || text.includes("reunion")) return "Afrika";
    if (text.includes("chile") || text.includes("colombia") || text.includes("ecuador") || text.includes("peru") || text.includes("argentina") || text.includes("bolivia") || text.includes("brazil")) return "Güney Amerika";
    
    return "Kuzey Amerika";
};

// Risk seviyelerine göre renk sınıfları (CSS)
export const getRiskAnimationClass = (risk) => {
    if (!risk) return "";
    const r = risk.toUpperCase();
    
    // DÜŞÜK RİSKLER (Yeşil/Mavi Tonlar)
    if (r.includes("VERY LOW") || r.includes("ÇOK DÜŞÜK") || r.includes("MINIMAL")) return "text-green-400 animate-pulse";
    if (r.includes("LOW") || r.includes("DÜŞÜK")) return "text-green-500";
    
    // ORTA RİSKLER (Sarı/Turuncu)
    if (r.includes("MODERATE") || r.includes("ORTA")) return "text-yellow-400";
    
    // YÜKSEK RİSKLER (Turuncu/Kırmızı)
    if (r.includes("HIGH") || r.includes("YÜKSEK")) return "text-orange-500 font-bold";
    
    // KRİTİK RİSKLER (Koyu Kırmızı/Yanıp Sönen)
    if (r.includes("CRITICAL") || r.includes("KRİTİK") || r.includes("EXTREME")) return "text-red-600 animate-pulse font-black";
    
    return "text-gray-400"; // Bilinmeyen durum
};

export const filterOptions = {
    status: ['Active', 'Dormant', 'Extinct'], // Extinct eklenebilir veri setinde varsa
    elevation: [
      { label: '0 - 1000m', min: 0, max: 1000 },
      { label: '1000m - 2000m', min: 1000, max: 2000 },
      { label: '2000m - 3000m', min: 2000, max: 3000 },
      { label: '3000m - 4000m', min: 3000, max: 4000 },
      { label: '4000m - 5000m', min: 4000, max: 5000 },
      { label: '5000m - 6000m', min: 5000, max: 6000 },
      { label: '6000m+', min: 6000, max: 99999 },
    ],
    continents: ["Afrika", "Antarktika", "Asya", "Avustralya", "Avrupa", "Kuzey Amerika", "Güney Amerika"]
};