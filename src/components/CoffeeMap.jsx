import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoffeeData } from '../hooks/useCoffeeData';
import { MapPin, X, Coffee } from 'lucide-react';

// Pojas uzgoja kave - između Tropika Raka (23.5°N) i Tropika Jarca (23.5°S)
// U SVG viewBox "0 0 750 500", ekvator je na približno y=250
// Tropic of Cancer (23.5°N): y ≈ 185
// Tropic of Capricorn (23.5°S): y ≈ 315
const COFFEE_BELT = { top: 256, bottom: 343, equator: 301 };

// SVG viewBox dimenzije
const SVG_VIEWBOX = {
  width: 750,
  height: 500
};

// Funkcija za konverziju geografskih koordinata u SVG koordinate
// Longitude (-180 do 180) -> X (0 do 750)
// Latitude (90 do -90) -> Y (0 do 500)
function latLngToSvg(lat, lng) {
  // Longitude: -180 (zapad) -> 0, 0 (Greenwich) -> 375, 180 (istok) -> 750
  const x = ((lng + 180) / 360) * SVG_VIEWBOX.width;
  
  // Latitude: 90 (sjever) -> 0, 0 (ekvator) -> 250, -90 (jug) -> 500
  const y = ((90 - lat) / 180) * SVG_VIEWBOX.height;
  
  return { x, y };
}

export default function CoffeeMap() {
  const { countries, coffees } = useCoffeeData();
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [clickedPosition, setClickedPosition] = useState(null);
  
  // State za prilagodbu pozicija linija
  const [coffeeBelt, setCoffeeBelt] = useState(COFFEE_BELT);

  // Broj kava po državi (podrška za više država po kavi)
  const coffeesByCountry = useMemo(() => {
    return coffees.reduce((acc, coffee) => {
      // Podrška za novi format (countryIds) i stari (countryId)
      const countryIds = coffee.countryIds || (coffee.countryId ? [coffee.countryId] : []);
      countryIds.forEach(countryId => {
        acc[countryId] = (acc[countryId] || 0) + 1;
      });
      return acc;
    }, {});
  }, [coffees]);

  const getCountryColor = (countryId) => {
    const count = coffeesByCountry[countryId] || 0;
    if (count === 0) return '#D4C4A8';
    if (count === 1) return '#D4A574';
    if (count <= 3) return '#8B6914';
    return '#3C2415';
  };

  const selectedCountryData = selectedCountry 
    ? countries.find(c => c.id === selectedCountry)
    : null;

  const countryCoffees = selectedCountry
    ? coffees.filter(c => {
        const countryIds = c.countryIds || (c.countryId ? [c.countryId] : []);
        return countryIds.includes(selectedCountry);
      })
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card rounded-2xl p-6 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h3 className="text-lg font-display font-bold text-coffee-dark">
          Pojas uzgoja kave
        </h3>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-[#C9A227] bg-[#C9A227]/15" />
            <span className="text-coffee-roast text-xs">Pojas uzgoja kave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#D4C4A8]" />
            <span className="text-coffee-roast text-xs">Nema kava</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3C2415]" />
            <span className="text-coffee-roast text-xs">Više kava</span>
          </div>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              debugMode 
                ? 'bg-red-500 text-white' 
                : 'bg-neutral-200 text-coffee-dark hover:bg-neutral-300'
            }`}
            title="Debug mod: klikni na karti za koordinate"
          >
            {debugMode ? '✕ Debug' : '🔧 Debug'}
          </button>
        </div>
      </div>
      
      {/* Debug Info */}
      {debugMode && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs space-y-4">
          <div>
            <p className="font-semibold text-yellow-800 mb-1">Debug mod aktiviran</p>
            <p className="text-yellow-700">Klikni na karti gdje bi trebala biti zastavica. Koordinate će se prikazati u konzoli i ovdje.</p>
            {clickedPosition && (
              <div className="mt-2 space-y-1">
                <p className="font-mono text-yellow-900">
                  Koordinate: x={clickedPosition.x.toFixed(1)}, y={clickedPosition.y.toFixed(1)}
                </p>
                <p className="text-yellow-700 text-xs">
                  Dodaj u countries.json: <code className="bg-yellow-100 px-1 rounded">"svgPosition": {"{"} "x": {clickedPosition.x.toFixed(1)}, "y": {clickedPosition.y.toFixed(1)} {"}"}</code>
                </p>
              </div>
            )}
          </div>
          
          {/* Prilagodba pozicija linija */}
          <div className="border-t border-yellow-300 pt-3">
            <p className="font-semibold text-yellow-800 mb-2">Prilagodba pozicija linija:</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-yellow-700 mb-1">Tropik Raka (Y):</label>
                <input
                  type="number"
                  value={coffeeBelt.top}
                  onChange={(e) => setCoffeeBelt(prev => ({ ...prev, top: Number(e.target.value) }))}
                  className="w-full px-2 py-1 border border-yellow-300 rounded text-yellow-900"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-yellow-700 mb-1">Ekvator (Y):</label>
                <input
                  type="number"
                  value={coffeeBelt.equator}
                  onChange={(e) => setCoffeeBelt(prev => ({ ...prev, equator: Number(e.target.value) }))}
                  className="w-full px-2 py-1 border border-yellow-300 rounded text-yellow-900"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-yellow-700 mb-1">Tropik Jarca (Y):</label>
                <input
                  type="number"
                  value={coffeeBelt.bottom}
                  onChange={(e) => setCoffeeBelt(prev => ({ ...prev, bottom: Number(e.target.value) }))}
                  className="w-full px-2 py-1 border border-yellow-300 rounded text-yellow-900"
                  step="1"
                />
              </div>
            </div>
            <p className="mt-2 text-yellow-600 text-xs">
              Klikni na karti gdje bi trebale biti linije da dobiješ Y koordinate, ili ručno unesi vrijednosti.
            </p>
            <div className="mt-2">
              <p className="text-yellow-700 text-xs mb-1">Kopiraj u CoffeeMap.jsx:</p>
              <code className="block bg-yellow-100 px-2 py-1 rounded text-yellow-900 text-xs">
                const COFFEE_BELT = {"{"} top: {coffeeBelt.top}, bottom: {coffeeBelt.bottom}, equator: {coffeeBelt.equator} {"}"};
              </code>
            </div>
          </div>
        </div>
      )}
      
      {/* Map Container */}
      <div className="relative aspect-[3/2] bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl overflow-hidden">
        {/* World Map SVG Background */}
        <div className="absolute inset-0">
          <img 
            src="/images/world_map.svg" 
            alt="World Map" 
            className="w-full h-full object-cover opacity-90"
          />
        </div>
        
        {/* Coffee Belt Overlay */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 750 500"
          preserveAspectRatio="xMidYMid meet"
          onClick={(e) => {
            if (!debugMode) return;
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();
            const viewBox = { width: 750, height: 500 };
            
            // Izračunaj relativnu poziciju unutar SVG elementa
            const x = ((e.clientX - rect.left) / rect.width) * viewBox.width;
            const y = ((e.clientY - rect.top) / rect.height) * viewBox.height;
            
            setClickedPosition({ x, y });
            console.log(`SVG koordinate za ${viewBox.width}x${viewBox.height}: x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
            console.log(`Dodaj u countries.json: "svgPosition": { "x": ${x.toFixed(1)}, "y": ${y.toFixed(1)} }`);
          }}
        >
          {/* Coffee Belt Highlight - poluprozirni overlay */}
          <rect 
            x="0" 
            y={coffeeBelt.top} 
            width="750" 
            height={coffeeBelt.bottom - coffeeBelt.top} 
            fill="#C9A227" 
            opacity="0.15"
            className="coffee-belt-overlay"
          />
          
          {/* Tropic of Cancer (23.5°N) */}
          <line 
            x1="0" 
            y1={coffeeBelt.top} 
            x2="750" 
            y2={coffeeBelt.top} 
            stroke="#C9A227" 
            strokeWidth={debugMode ? "3" : "1.5"} 
            strokeDasharray="8,4" 
            opacity={debugMode ? "1" : "0.7"}
            className={debugMode ? "cursor-pointer" : ""}
            onClick={(e) => {
              if (!debugMode) return;
              e.stopPropagation();
              const svg = e.currentTarget.ownerSVGElement;
              const rect = svg.getBoundingClientRect();
              const viewBox = { width: 750, height: 500 };
              const y = ((e.clientY - rect.top) / rect.height) * viewBox.height;
              setCoffeeBelt(prev => ({ ...prev, top: y }));
              console.log(`Tropik Raka Y: ${y.toFixed(1)}`);
            }}
            style={{ pointerEvents: debugMode ? 'all' : 'none' }}
          />
          
          {/* Equator */}
          <line 
            x1="0" 
            y1={coffeeBelt.equator} 
            x2="750" 
            y2={coffeeBelt.equator} 
            stroke="#8B6914" 
            strokeWidth={debugMode ? "3" : "2"} 
            opacity={debugMode ? "1" : "0.5"}
            className={debugMode ? "cursor-pointer" : ""}
            onClick={(e) => {
              if (!debugMode) return;
              e.stopPropagation();
              const svg = e.currentTarget.ownerSVGElement;
              const rect = svg.getBoundingClientRect();
              const viewBox = { width: 750, height: 500 };
              const y = ((e.clientY - rect.top) / rect.height) * viewBox.height;
              setCoffeeBelt(prev => ({ ...prev, equator: y }));
              console.log(`Ekvator Y: ${y.toFixed(1)}`);
            }}
            style={{ pointerEvents: debugMode ? 'all' : 'none' }}
          />
          
          {/* Tropic of Capricorn (23.5°S) */}
          <line 
            x1="0" 
            y1={coffeeBelt.bottom} 
            x2="750" 
            y2={coffeeBelt.bottom} 
            stroke="#C9A227" 
            strokeWidth={debugMode ? "3" : "1.5"} 
            strokeDasharray="8,4" 
            opacity={debugMode ? "1" : "0.7"}
            className={debugMode ? "cursor-pointer" : ""}
            onClick={(e) => {
              if (!debugMode) return;
              e.stopPropagation();
              const svg = e.currentTarget.ownerSVGElement;
              const rect = svg.getBoundingClientRect();
              const viewBox = { width: 750, height: 500 };
              const y = ((e.clientY - rect.top) / rect.height) * viewBox.height;
              setCoffeeBelt(prev => ({ ...prev, bottom: y }));
              console.log(`Tropik Jarca Y: ${y.toFixed(1)}`);
            }}
            style={{ pointerEvents: debugMode ? 'all' : 'none' }}
          />
          
          {/* Coffee Belt Label */}
          <text
            x="375"
            y={(coffeeBelt.top + coffeeBelt.bottom) / 2}
            textAnchor="middle"
            className="text-sm font-bold fill-[#C9A227] pointer-events-none select-none"
            style={{ 
              textShadow: '2px 2px 4px rgba(255,255,255,0.8)',
              letterSpacing: '0.1em'
            }}
          >
            POJAS UZGOJA KAVE
          </text>
          
          {/* Tropic Labels */}
          <text
            x="20"
            y={coffeeBelt.top - 5}
            className="text-xs fill-[#C9A227] pointer-events-none select-none font-semibold"
            style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
          >
            Tropik Raka (23.5°N)
          </text>
          <text
            x="20"
            y={coffeeBelt.bottom + 15}
            className="text-xs fill-[#C9A227] pointer-events-none select-none font-semibold"
            style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
          >
            Tropik Jarca (23.5°S)
          </text>
          
          {/* Debug Click Marker */}
          {debugMode && clickedPosition && (
            <circle
              cx={clickedPosition.x}
              cy={clickedPosition.y}
              r="10"
              fill="red"
              opacity="0.5"
              stroke="red"
              strokeWidth="2"
            />
          )}
          
          {/* Country Markers */}
          {countries
            .filter(country => 
              (country.coordinates && country.coordinates.lat && country.coordinates.lng) || 
              country.svgPosition
            )
            .map((country) => {
              const countryId = country.id;
              const count = coffeesByCountry[countryId] || 0;
              const isHovered = hoveredCountry === countryId;
              const isSelected = selectedCountry === countryId;
              const markerSize = count > 0 ? (count <= 1 ? 8 : count <= 3 ? 12 : 16) : 6;
              const markerColor = getCountryColor(countryId);
              
              // Koristi ručne SVG koordinate ako postoje, inače konvertiraj geografske koordinate
              const position = country.svgPosition 
                ? { x: country.svgPosition.x, y: country.svgPosition.y }
                : latLngToSvg(country.coordinates.lat, country.coordinates.lng);
              
              return (
                <g key={countryId} transform={`translate(${position.x}, ${position.y})`}>
                  {/* Country Flag */}
                  <motion.text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    className="text-2xl cursor-pointer select-none"
                    onMouseEnter={() => setHoveredCountry(countryId)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    onClick={() => setSelectedCountry(countryId === selectedCountry ? null : countryId)}
                    whileHover={{ 
                      scale: 1.2,
                      transition: { duration: 0.15, ease: "easeOut" }
                    }}
                    animate={{ 
                      scale: isSelected ? 1.15 : 1,
                      transition: { duration: 0.15, ease: "easeOut" }
                    }}
                    style={{ 
                      pointerEvents: 'all',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      filter: isHovered || isSelected 
                        ? 'drop-shadow(0 0 4px rgba(201, 162, 39, 0.8)) brightness(1.2)' 
                        : 'drop-shadow(0 0 2px rgba(255,255,255,0.5))',
                      transformOrigin: 'center center'
                    }}
                  >
                    {country.flag}
                  </motion.text>
                  
                  {/* Coffee Count Badge */}
                  {count > 0 && (
                    <text
                      x="0"
                      y="20"
                      textAnchor="middle"
                      className="text-xs font-bold fill-white pointer-events-none select-none"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      {count}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>
        
        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoveredCountry && !selectedCountry && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 glass-card rounded-xl p-4 shadow-lg max-w-xs z-10"
            >
              {(() => {
                const country = countries.find(c => c.id === hoveredCountry);
                const count = coffeesByCountry[hoveredCountry] || 0;
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{country?.flag}</span>
                      <div>
                        <p className="font-semibold text-coffee-dark">{country?.name}</p>
                        <p className="text-sm text-coffee-roast">{count} {count === 1 ? 'kava' : count < 5 ? 'kave' : 'kava'}</p>
                      </div>
                    </div>
                    {country?.coffeeProduction && (
                      <p className="text-xs text-coffee-roast mt-2 pt-2 border-t border-neutral-200">
                        {country.coffeeProduction}
                      </p>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Country Panel */}
      <AnimatePresence>
        {selectedCountryData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="bg-coffee-cream/50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedCountryData.flag}</span>
                  <div>
                    <h4 className="font-display font-bold text-coffee-dark">
                      {selectedCountryData.name}
                    </h4>
                    <p className="text-sm text-coffee-roast">{selectedCountryData.region}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCountry(null)}
                  className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <X className="w-4 h-4 text-coffee-roast" />
                </button>
              </div>
              
              <p className="text-sm text-coffee-roast mb-3">
                {selectedCountryData.coffeeProduction}
              </p>
              
              {selectedCountryData.varieties?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-coffee-dark mb-1">Sorte:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedCountryData.varieties.map(variety => (
                      <span 
                        key={variety}
                        className="px-2 py-0.5 bg-white/70 rounded-full text-xs text-coffee-roast"
                      >
                        {variety}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Coffees from this country */}
              {countryCoffees.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-coffee-dark mb-2">
                    Kave iz ove zemlje ({countryCoffees.length}):
                  </p>
                  <div className="space-y-1">
                    {countryCoffees.slice(0, 3).map(coffee => (
                      <div 
                        key={coffee.id}
                        className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2"
                      >
                        <Coffee className="w-4 h-4 text-coffee-roast" />
                        <span className="text-sm text-coffee-dark">
                          {coffee.brand?.name} - {coffee.name}
                        </span>
                      </div>
                    ))}
                    {countryCoffees.length > 3 && (
                      <p className="text-xs text-coffee-roast pl-2">
                        +{countryCoffees.length - 3} više...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

