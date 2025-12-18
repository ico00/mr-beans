import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoffeeData } from '../hooks/useCoffeeData';
import { MapPin, X, Coffee } from 'lucide-react';

// Pojednostavljeni SVG putevi za zemlje proizvođače kave
const countryPaths = {
  brazil: "M300,280 L340,260 L380,270 L400,300 L390,350 L350,380 L310,370 L280,340 L290,300 Z",
  colombia: "M240,230 L270,220 L290,240 L285,270 L260,280 L240,260 Z",
  ethiopia: "M520,220 L550,200 L570,220 L560,250 L530,260 L510,240 Z",
  kenya: "M540,260 L560,250 L575,270 L565,295 L545,290 L535,270 Z",
  vietnam: "M680,200 L700,180 L710,200 L705,240 L690,250 L680,230 Z",
  indonesia: "M680,280 L750,270 L780,290 L760,310 L700,320 L680,300 Z",
  guatemala: "M190,210 L210,200 L220,215 L210,230 L195,225 Z",
  costa_rica: "M220,235 L235,230 L245,245 L235,255 L225,250 Z"
};

// Pozicije za label
const countryLabelPositions = {
  brazil: { x: 340, y: 320 },
  colombia: { x: 260, y: 250 },
  ethiopia: { x: 540, y: 230 },
  kenya: { x: 550, y: 275 },
  vietnam: { x: 695, y: 215 },
  indonesia: { x: 720, y: 295 },
  guatemala: { x: 205, y: 215 },
  costa_rica: { x: 235, y: 245 }
};

export default function CoffeeMap() {
  const { countries, coffees } = useCoffeeData();
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-bold text-coffee-dark">
          Pojas uzgoja kave
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#D4C4A8]" />
            <span className="text-coffee-roast">Nema kava</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3C2415]" />
            <span className="text-coffee-roast">Više kava</span>
          </div>
        </div>
      </div>
      
      {/* Map SVG */}
      <div className="relative aspect-[2/1] bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl overflow-hidden">
        {/* Coffee Belt Lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400">
          {/* Tropic of Cancer */}
          <line 
            x1="0" y1="160" x2="800" y2="160" 
            stroke="#C9A227" strokeWidth="1" strokeDasharray="5,5" opacity="0.5"
          />
          {/* Equator */}
          <line 
            x1="0" y1="200" x2="800" y2="200" 
            stroke="#C9A227" strokeWidth="2" opacity="0.3"
          />
          {/* Tropic of Capricorn */}
          <line 
            x1="0" y1="240" x2="800" y2="240" 
            stroke="#C9A227" strokeWidth="1" strokeDasharray="5,5" opacity="0.5"
          />
          
          {/* Coffee Belt Highlight */}
          <rect 
            x="0" y="160" width="800" height="80" 
            fill="#C9A227" opacity="0.1"
          />
          
          {/* Countries */}
          {Object.entries(countryPaths).map(([countryId, path]) => {
            const country = countries.find(c => c.id === countryId);
            const isHovered = hoveredCountry === countryId;
            const isSelected = selectedCountry === countryId;
            
            return (
              <g key={countryId}>
                <motion.path
                  d={path}
                  fill={getCountryColor(countryId)}
                  stroke={isHovered || isSelected ? '#C9A227' : '#8B6914'}
                  strokeWidth={isHovered || isSelected ? 3 : 1}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredCountry(countryId)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setSelectedCountry(countryId === selectedCountry ? null : countryId)}
                  whileHover={{ scale: 1.05 }}
                  animate={{ 
                    filter: isHovered || isSelected ? 'brightness(1.2)' : 'brightness(1)'
                  }}
                  style={{ transformOrigin: 'center' }}
                />
                
                {/* Country Label */}
                {countryLabelPositions[countryId] && (
                  <text
                    x={countryLabelPositions[countryId].x}
                    y={countryLabelPositions[countryId].y}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-white pointer-events-none select-none"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {country?.flag}
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
              className="absolute bottom-4 left-4 glass-card rounded-xl p-3 shadow-lg"
            >
              {(() => {
                const country = countries.find(c => c.id === hoveredCountry);
                const count = coffeesByCountry[hoveredCountry] || 0;
                return (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country?.flag}</span>
                    <div>
                      <p className="font-semibold text-coffee-dark">{country?.name}</p>
                      <p className="text-sm text-coffee-roast">{count} kava</p>
                    </div>
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

