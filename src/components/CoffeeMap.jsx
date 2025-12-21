import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoffeeData } from '../hooks/useCoffeeData';
import { X, Coffee, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import svgPanZoom from 'svg-pan-zoom';

// 1. IZOLIRANI STILOVI - Sprječavaju kvarenje ostatka stranice
const MAP_STYLES = `
  #coffee-map-container svg { 
    width: 100%; 
    height: 100%; 
    display: block; 
  }
  
  #coffee-map-container path, 
  #coffee-map-container circle, 
  #coffee-map-container polygon { 
    fill: #ebdbc9 !important; 
    stroke: #ffffff !important; 
    stroke-width: 0.5; 
    transition: fill 0.2s ease;
  }

  #coffee-map-container .coffee-node {
    fill: rgb(210, 200, 190) !important;
    cursor: pointer !important;
    pointer-events: all !important;
  }

  #coffee-map-container .coffee-node:hover {
    fill: #d4a373 !important;
  }

  #coffee-map-container .coffee-node.active {
    fill: #8B4513 !important;
  }

  .svg-pan-zoom-control { display: none !important; }
`;

export default function CoffeeMap() {
  const { countries, coffees } = useCoffeeData();
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  
  const containerRef = useRef(null);
  const panZoomRef = useRef(null);

  const countryDataMap = useMemo(() => {
    const map = {};
    countries.forEach(c => {
      map[c.id] = c;
      if (c.isoCode) map[c.isoCode.toUpperCase()] = c;
    });
    return map;
  }, [countries]);

  const currentHovered = hoveredId ? countryDataMap[hoveredId] : null;
  const currentSelected = selectedId ? countryDataMap[selectedId] : null;

  useEffect(() => {
    let isMounted = true;

    fetch('/images/world_map.svg')
      .then(res => res.text())
      .then(svgRaw => {
        if (!isMounted || !containerRef.current) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgRaw, 'image/svg+xml');
        const sourceSvg = doc.querySelector('svg');
        if (!sourceSvg) return;

        const style = doc.createElementNS("http://www.w3.org/2000/svg", "style");
        style.textContent = MAP_STYLES;
        sourceSvg.insertBefore(style, sourceSvg.firstChild);

        countries.forEach(country => {
          const code = (country.isoCode || country.id).toUpperCase();
          const el = sourceSvg.querySelector(`[id="${code}"], [id="${code.toLowerCase()}"], .${code}, [data-id="${code}"]`);

          if (el) {
            el.classList.add('coffee-node');
            el.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedId(prev => prev === country.id ? null : country.id);
            };
            el.onmouseenter = () => setHoveredId(country.id);
            el.onmouseleave = () => setHoveredId(null);
          }
        });

        containerRef.current.innerHTML = '';
        sourceSvg.setAttribute('width', '100%');
        sourceSvg.setAttribute('height', '100%');
        sourceSvg.id = 'main-world-svg';
        containerRef.current.appendChild(sourceSvg);

        setTimeout(() => {
          if (!isMounted) return;
          panZoomRef.current = svgPanZoom('#main-world-svg', {
            zoomEnabled: true,
            panEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 1,
            maxZoom: 15,
            zoomScaleSensitivity: 0.2,
            beforePan: function(oldPan, newPan) {
              const sizes = this.getSizes();
              
              // Dinamički izračun veličine karte u odnosu na trenutni zoom
              const currentMapWidth = sizes.viewBox.width * sizes.realZoom;
              const currentMapHeight = sizes.viewBox.height * sizes.realZoom;

              // --- Logika za Y os (Visina) ---
              let y = newPan.y;
              if (currentMapHeight <= sizes.height) {
                // Ako je karta manja od kontejnera, drži je točno u sredini
                y = (sizes.height - currentMapHeight) / 2;
              } else {
                // Ako je veća, ne dopuštaj prazninu na rubovima
                const topLimit = 0;
                const bottomLimit = sizes.height - currentMapHeight;
                y = Math.max(bottomLimit, Math.min(topLimit, newPan.y));
              }

              // --- Logika za X os (Širina) ---
              let x = newPan.x;
              if (currentMapWidth <= sizes.width) {
                // Centriraj vodoravno u početnom stanju
                x = (sizes.width - currentMapWidth) / 2;
              } else {
                const leftLimit = 0;
                const rightLimit = sizes.width - currentMapWidth;
                x = Math.max(rightLimit, Math.min(leftLimit, newPan.x));
              }

              return { x, y };
            }
          });
        }, 150);
      });

    return () => { 
      isMounted = false; 
      if(panZoomRef.current) panZoomRef.current.destroy(); 
    };
  }, [countries]);

  useEffect(() => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;
    svg.querySelectorAll('.coffee-node').forEach(el => el.classList.remove('active'));
    if (currentSelected) {
      const code = (currentSelected.isoCode || currentSelected.id).toUpperCase();
      const activeEl = svg.querySelector(`[id="${code}"], [id="${code.toLowerCase()}"], .${code}`);
      if (activeEl) activeEl.classList.add('active');
    }
  }, [currentSelected]);

  return (
    <div id="coffee-map-container" className="rounded-2xl p-6 shadow-xl bg-white/50 backdrop-blur-sm border border-neutral-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-coffee-dark tracking-tight">Interaktivna karta kave</h3>
        <div className="flex gap-2">
            <button onClick={() => panZoomRef.current?.zoomIn()} className="p-2 bg-white rounded-lg border border-neutral-200 shadow-sm hover:bg-neutral-50 text-neutral-600 transition-colors">
              <ZoomIn size={18}/>
            </button>
            <button onClick={() => panZoomRef.current?.zoomOut()} className="p-2 bg-white rounded-lg border border-neutral-200 shadow-sm hover:bg-neutral-50 text-neutral-600 transition-colors">
              <ZoomOut size={18}/>
            </button>
            <button onClick={() => { panZoomRef.current?.reset(); panZoomRef.current?.fit(); panZoomRef.current?.center(); }} className="p-2 bg-white rounded-lg border border-neutral-200 shadow-sm hover:bg-neutral-50 text-neutral-600 transition-colors">
              <RotateCcw size={18}/>
            </button>
        </div>
      </div>

      <div className="relative aspect-[16/9] bg-[#fdfdfd] rounded-2xl border border-neutral-200 overflow-hidden shadow-inner">
        <div ref={containerRef} className="w-full h-full" />

        <AnimatePresence>
          {currentHovered && !selectedId && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0 }} 
              className="absolute bottom-8 left-8 pointer-events-none z-50"
            >
              <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-coffee-light/20 flex items-center gap-4">
                <span className="text-4xl">{currentHovered.flag}</span>
                <div>
                  <div className="font-black text-coffee-dark text-lg leading-none">{currentHovered.name}</div>
                  <div className="text-[10px] text-coffee-medium font-bold uppercase tracking-widest mt-1">Klikni za detalje</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {currentSelected && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="mt-8 overflow-hidden"
          >
            <div className="p-8 bg-gradient-to-br from-orange-50 to-white rounded-3xl border border-orange-100 relative shadow-lg">
              <button 
                onClick={() => setSelectedId(null)} 
                className="absolute top-6 right-6 p-2 hover:bg-orange-100 rounded-full transition-colors"
              >
                <X size={24} className="text-orange-300"/>
              </button>
              
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                <div className="text-9xl filter drop-shadow-xl">{currentSelected.flag}</div>
                <div className="flex-1">
                  <h4 className="text-4xl font-black text-coffee-dark mb-2">{currentSelected.name}</h4>
                  <div className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                    {currentSelected.region}
                  </div>
                  <p className="text-lg text-neutral-600 leading-relaxed mb-6">
                    {currentSelected.coffeeProduction}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {coffees
                      .filter(c => (c.countryIds || [c.countryId]).includes(currentSelected.id))
                      .map(c => (
                        <div key={c.id} className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                          <Coffee size={20} className="text-coffee-primary" />
                          <span className="font-bold text-coffee-dark">{c.name}</span>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}