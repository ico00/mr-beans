import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoffeeData } from '../hooks/useCoffeeData';
import { MapPin, X, Coffee, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import svgPanZoom from 'svg-pan-zoom';


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
  const debugModeRef = useRef(false); // Ref za pristup debugMode u callback-ovima
  const [clickedPosition, setClickedPosition] = useState(null);
  const [svgContent, setSvgContent] = useState(null);
  const svgRef = useRef(null);
  const panZoomRef = useRef(null);
  const markersContainerRef = useRef(null);
  const isInitializedRef = useRef(false);
  
  // Ažuriraj ref kada se debugMode promijeni
  useEffect(() => {
    debugModeRef.current = debugMode;
  }, [debugMode]);
  

  // Učitaj SVG datoteku i inicijaliziraj svg-pan-zoom
  useEffect(() => {
    if (!svgRef.current) return;

    let mounted = true;

    // Učitaj SVG datoteku
    fetch('/images/world_map.svg')
      .then(response => response.text())
      .then(svg => {
        if (!mounted || !svgRef.current) return;

        // Parsiraj SVG i izvuci sadržaj
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const sourceSvgElement = doc.querySelector('svg');
        
        if (sourceSvgElement && svgRef.current) {
          // Pronađi ili kreiraj background group
          let bgGroup = svgRef.current.querySelector('#world-map-background');
          if (!bgGroup) {
            bgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            bgGroup.id = 'world-map-background';
            bgGroup.setAttribute('style', 'opacity: 0.9');
            // Ubaci na početak SVG-a
            svgRef.current.insertBefore(bgGroup, svgRef.current.firstChild);
          }
          
          // Dodaj SVG sadržaj u background group
          bgGroup.innerHTML = sourceSvgElement.innerHTML;
          setSvgContent(true); // Signal da je SVG učitan

          // Pronađi ili kreiraj markers container
          let markersContainer = svgRef.current.querySelector('#markers-container');
          if (!markersContainer) {
            markersContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            markersContainer.id = 'markers-container';
            svgRef.current.appendChild(markersContainer);
          }
          markersContainerRef.current = markersContainer;

          // Inicijaliziraj svg-pan-zoom nakon kratkog delay-a (samo jednom)
          if (!isInitializedRef.current) {
            setTimeout(() => {
              if (!mounted || !svgRef.current || panZoomRef.current) return;
              
              try {
                panZoomRef.current = svgPanZoom(svgRef.current, {
                  zoomEnabled: true,
                  controlIconsEnabled: false,
                  fit: true,
                  center: true,
                  minZoom: 1.0,
                  maxZoom: 5,
                  panEnabled: true, // Omogućen, ali kontroliramo kroz beforePan
                  dblClickZoomEnabled: true,
                  mouseWheelZoomEnabled: true,
                  preventMouseEventsDefault: false,
                  zoomScaleSensitivity: 0.2,
                  beforePan: function(oldPoint, newPoint) {
                    const instance = panZoomRef.current;
                    if (!instance || !svgRef.current) return newPoint;
                    
                    try {
                      // Ne dozvoli pan u debug modu
                      if (debugModeRef.current) {
                        return oldPoint; // Ne dozvoli pan u debug modu
                      }
                      
                      const zoom = instance.getZoom();
                      
                      // Ne dozvoli pan kada je zoom <= 1.0
                      if (zoom <= 1.0) {
                        return oldPoint; // Vrati staru poziciju - ne dozvoli pan
                      }
                      
                      // Ručno ograniči pan unutar granica
                      let sizes;
                      try {
                        sizes = instance.getSizes();
                      } catch (e) {
                        sizes = null;
                      }
                      
                      if (sizes) {
                        // Prema dokumentaciji svg-pan-zoom
                        const leftLimit = -((sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom - sizes.width);
                        const rightLimit = 0;
                        const topLimit = -((sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom - sizes.height);
                        const bottomLimit = 0;
                        
                        // Ograniči newPoint unutar granica
                        return {
                          x: Math.max(leftLimit, Math.min(rightLimit, newPoint.x)),
                          y: Math.max(topLimit, Math.min(bottomLimit, newPoint.y))
                        };
                      }
                      
                      return newPoint;
                    } catch (e) {
                      console.warn('Error in beforePan:', e);
                      return newPoint;
                    }
                  }
                });
                
                // Postavi event listenere na markere nakon što je svg-pan-zoom inicijaliziran
                setTimeout(() => {
                  if (!mounted || !svgRef.current) return;
                  
                  // Pronađi sve marker elemente i dodaj event listenere
                  const markers = svgRef.current.querySelectorAll('[data-country-marker]');
                  markers.forEach(marker => {
                    const countryId = marker.getAttribute('data-country-marker');
                    
                    marker.addEventListener('mouseenter', (e) => {
                      e.stopPropagation();
                      setHoveredCountry(countryId);
                    });
                    
                    marker.addEventListener('mouseleave', (e) => {
                      e.stopPropagation();
                      setHoveredCountry(null);
                    });
                    
                    marker.addEventListener('click', (e) => {
                      e.stopPropagation();
                      setSelectedCountry(prev => prev === countryId ? null : countryId);
                    });
                  });
                }, 300);
                
                isInitializedRef.current = true;
              } catch (error) {
                console.error('Error initializing svg-pan-zoom:', error);
              }
            }, 200);
          }
        }
      })
      .catch(err => console.error('Error loading SVG:', err));

    // Cleanup - samo kada se komponenta unmount-a
    return () => {
      mounted = false;
      isInitializedRef.current = false;
      if (panZoomRef.current) {
        try {
          panZoomRef.current.destroy();
          panZoomRef.current = null;
        } catch (error) {
          console.error('Error destroying svg-pan-zoom:', error);
        }
      }
    };
  }, []); // Prazan dependency array - samo jednom se izvršava

  // Ažuriraj panEnabled ovisno o debug mode-u
  useEffect(() => {
    if (!panZoomRef.current) return;
    
    try {
      // Onemogući pan i zoom u debug modu
      if (typeof panZoomRef.current.setEnablePan === 'function') {
        panZoomRef.current.setEnablePan(!debugMode);
      }
      if (typeof panZoomRef.current.setZoomEnabled === 'function') {
        panZoomRef.current.setZoomEnabled(!debugMode);
      }
      if (panZoomRef.current.config) {
        panZoomRef.current.config.panEnabled = !debugMode;
        panZoomRef.current.config.zoomEnabled = !debugMode;
      }
    } catch (e) {
      console.warn('Error updating pan/zoom enabled:', e);
    }
  }, [debugMode]);

  // Postavi event listenere na markere nakon render-a i inicijalizacije pan-zoom-a
  useEffect(() => {
    if (!svgRef.current || !isInitializedRef.current) return;
    
    // Kratak delay da se osiguram da su elementi render-ani
    const timer = setTimeout(() => {
      const markers = svgRef.current?.querySelectorAll('[data-country-marker]');
      if (!markers) return;
      
      const handleMouseEnter = (e) => {
        e.stopPropagation();
        const countryId = e.currentTarget.getAttribute('data-country-marker');
        if (countryId) {
          setHoveredCountry(countryId);
        }
      };
      
      const handleMouseLeave = (e) => {
        e.stopPropagation();
        setHoveredCountry(null);
      };
      
      const handleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const countryId = e.currentTarget.getAttribute('data-country-marker');
        if (countryId) {
          setSelectedCountry(prev => prev === countryId ? null : countryId);
        }
      };
      
      markers.forEach(marker => {
        marker.addEventListener('mouseenter', handleMouseEnter, true); // useCapture = true
        marker.addEventListener('mouseleave', handleMouseLeave, true);
        marker.addEventListener('click', handleClick, true);
      });
      
      return () => {
        markers.forEach(marker => {
          marker.removeEventListener('mouseenter', handleMouseEnter, true);
          marker.removeEventListener('mouseleave', handleMouseLeave, true);
          marker.removeEventListener('click', handleClick, true);
        });
      };
    }, 400);
    
    return () => clearTimeout(timer);
  }, [countries.length, svgContent]); // Re-run kada se države promijene ili SVG učita

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
          
        </div>
      )}
      
      {/* Map Container */}
      <div className="relative aspect-[3/2] bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl overflow-hidden">
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={() => {
              if (panZoomRef.current) {
                panZoomRef.current.zoomIn();
              }
            }}
            className="glass-card p-2 rounded-lg hover:bg-white/80 transition-colors shadow-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-coffee-dark" />
          </button>
          <button
            onClick={() => {
              if (panZoomRef.current) {
                panZoomRef.current.zoomOut();
              }
            }}
            className="glass-card p-2 rounded-lg hover:bg-white/80 transition-colors shadow-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-coffee-dark" />
          </button>
          <button
            onClick={() => {
              if (panZoomRef.current) {
                panZoomRef.current.resetZoom();
                panZoomRef.current.center();
                panZoomRef.current.fit();
              }
            }}
            className="glass-card p-2 rounded-lg hover:bg-white/80 transition-colors shadow-lg"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5 text-coffee-dark" />
          </button>
        </div>
        {/* Interactive SVG Map - key ensures React never replaces this element */}
        <svg 
          key="world-map-svg"
          ref={svgRef}
          id="world-map"
          className="w-full h-full" 
          viewBox="0 0 750 500"
          preserveAspectRatio="xMidYMid meet"
          onClick={(e) => {
            if (!debugMode) return;
            // Ignoriraj ako je klik na marker
            if (e.target.closest('[data-country-marker]')) {
              e.stopPropagation();
              return;
            }
            
            e.stopPropagation();
            e.preventDefault();
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
          onMouseDown={(e) => {
            // Za debug mode, spriječi pan
            if (debugMode) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          onMouseMove={(e) => {
            // Za debug mode, spriječi pan
            if (debugMode) {
              e.stopPropagation();
            }
          }}
        >
          {/* World Map Background - loaded via useEffect */}
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
          <g id="markers-container">
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
              
              const scale = isHovered ? 1.2 : isSelected ? 1.1 : 1.0;
              
              return (
                <g 
                  key={countryId} 
                  data-country-marker={countryId}
                  transform={`translate(${position.x}, ${position.y})`}
                  style={{ 
                    pointerEvents: 'all', 
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setHoveredCountry(countryId);
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    setHoveredCountry(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCountry(countryId === selectedCountry ? null : countryId);
                  }}
                >
                  {/* Country Flag - animacija kroz fontSize promjenu */}
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fontSize={isHovered ? "24" : isSelected ? "22" : "20"}
                    className="cursor-pointer select-none flag-text"
                    style={{ 
                      pointerEvents: 'none',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      filter: isHovered || isSelected 
                        ? 'drop-shadow(0 0 6px rgba(201, 162, 39, 0.9)) brightness(1.3)' 
                        : 'drop-shadow(0 0 2px rgba(255,255,255,0.5))',
                      opacity: isHovered || isSelected ? 1 : 0.9,
                      transition: 'font-size 0.15s ease-out, filter 0.15s ease-out, opacity 0.15s ease-out'
                    }}
                  >
                    {country.flag}
                  </text>
                  
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
          </g>
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

