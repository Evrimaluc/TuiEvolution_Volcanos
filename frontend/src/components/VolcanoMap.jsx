import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Zoom ve Odaklama Kontrolcüsü
function MapController({ selectedVolcano }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedVolcano && selectedVolcano.position) {
      const [lat, lng] = selectedVolcano.position;
      // Koordinat geçerliliğini kontrol et
      if (lat != null && lng != null) {
        map.flyTo([lat, lng], 12, { 
            duration: 2.5, // Uçuş süresi
            easeLinearity: 0.25
        }); 
      }
    }
  }, [selectedVolcano, map]);
  
  return null;
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function VolcanoMap({ darkMode, selectedVolcano, setSelectedVolcano, displayVolcanoes, handleSelectFromList }) {
  return (
    <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <ChangeView center={selectedVolcano ? selectedVolcano.position : [20, 0]} zoom={selectedVolcano ? 10 : 2} />
        
        {/* Seçim değişince haritayı oraya uçur */}
        <MapController selectedVolcano={selectedVolcano} />
        
        <TileLayer
            attribution='&copy; OpenStreetMap'
            url={darkMode 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"} 
        />
        
        {displayVolcanoes.map(v => (
            <Marker 
                key={v.id} 
                position={v.position}
                eventHandlers={{ click: () => { handleSelectFromList(v); } }}
            >
                <Popup>
                    <div className='font-bold'>{v.name}</div>
                    <div className='text-xs'>{v.country} - {v.elevation}m</div>
                </Popup>
            </Marker>
        ))}
    </MapContainer>
  );
}