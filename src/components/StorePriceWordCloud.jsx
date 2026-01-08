import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCoffeeData } from '../hooks/useCoffeeData';
import { calculateEspressoPrice } from '../utils/formatters';
import { TrendingDown, Award } from 'lucide-react';

export default function StorePriceWordCloud() {
  const { coffees, stores, getStoreById } = useCoffeeData();

  // Izračunaj prosječnu cijenu po dućanu
  const storePrices = useMemo(() => {
    if (!coffees || coffees.length === 0 || !stores || stores.length === 0) {
      return [];
    }

    // Za svaki dućan, prikupi sve najnovije cijene
    const storePriceMap = {};

    coffees.forEach(coffee => {
      if (!coffee.priceHistory || coffee.priceHistory.length === 0) {
        return;
      }

      // Grupiraj unose po storeId
      const entriesByStore = {};
      coffee.priceHistory.forEach(entry => {
        const storeId = entry.storeId || 'no-store';
        if (!entriesByStore[storeId]) {
          entriesByStore[storeId] = [];
        }
        entriesByStore[storeId].push(entry);
      });

      // Za svaki dućan uzmi najnoviji unos i izračunaj cijenu po espressu
      Object.entries(entriesByStore).forEach(([storeId, entries]) => {
        const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestPrice = sorted[0]?.price;

        if (latestPrice && coffee.weightG) {
          // Izračunaj cijenu po espressu (10g)
          const espressoPrice = calculateEspressoPrice(latestPrice, coffee.weightG, 10);
          
          if (espressoPrice) {
            if (!storePriceMap[storeId]) {
              storePriceMap[storeId] = [];
            }
            storePriceMap[storeId].push(espressoPrice);
          }
        }
      });
    });

    // Izračunaj prosjek i broj kava po dućanu
    // Filtrirati dućane koji imaju najmanje 3 kave za reprezentativniji prosjek
    const MIN_COFFEES = 3;
    
    const storeStats = Object.entries(storePriceMap)
      .map(([storeId, prices]) => {
        const store = getStoreById(storeId);
        if (!store) return null;

        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        return {
          storeId,
          name: store.name,
          avgPrice,
          minPrice,
          maxPrice,
          coffeeCount: prices.length,
        };
      })
      .filter(Boolean)
      .filter(store => store.coffeeCount >= MIN_COFFEES) // Filtriraj dućane s najmanje 3 kave
      .sort((a, b) => a.avgPrice - b.avgPrice); // Sortiraj od najjeftinijeg do najskupljeg

    return storeStats;
  }, [coffees, stores, getStoreById]);

  if (storePrices.length === 0) {
    return null;
  }

  // Pronađi najpovoljniji dućan (najniža prosječna cijena)
  const cheapestStore = storePrices[0];
  const mostExpensiveStore = storePrices[storePrices.length - 1];
  
  // Izračunaj raspon cijena za normalizaciju veličine fonta
  const priceRange = mostExpensiveStore.avgPrice - cheapestStore.avgPrice;
  
  // Funkcija za izračun veličine fonta (veći = jeftiniji)
  const getFontSize = (avgPrice) => {
    if (priceRange === 0) return 24; // Ako su svi isti, srednja veličina
    
    // Normaliziraj: najjeftiniji = 100%, najskuplji = 40%
    const normalized = 1 - ((avgPrice - cheapestStore.avgPrice) / priceRange);
    const minSize = 16;
    const maxSize = 48;
    return minSize + (normalized * (maxSize - minSize));
  };

  // Funkcija za izračun težine fonta
  const getFontWeight = (avgPrice) => {
    if (priceRange === 0) return 600;
    const normalized = 1 - ((avgPrice - cheapestStore.avgPrice) / priceRange);
    // Najjeftiniji = bold (700), najskuplji = normal (400)
    return 400 + (normalized * 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card rounded-2xl p-8 md:p-12"
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Award className="w-8 h-8 text-amber-600" />
          <h3 className="text-2xl md:text-3xl font-display font-bold text-coffee-dark">
            Najpovoljniji dućani
          </h3>
        </div>
        <p className="text-coffee-roast max-w-2xl mx-auto">
          Pregled prosječnih cijena po espressu (10g) po dućanu. Prikazani su samo dućani s najmanje 3 kave za reprezentativniji prosjek. Veća veličina = povoljnije cijene.
        </p>
        {cheapestStore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-4 inline-block px-6 py-3 bg-green-100 border-2 border-green-500 rounded-xl"
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-700">
                Najpovoljniji: <span className="text-coffee-dark">{cheapestStore.name}</span> 
                {' '}({cheapestStore.avgPrice.toFixed(2)} € po espressu prosjek)
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Wordcloud */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 min-h-[200px] py-8">
        {storePrices.map((store, index) => {
          const isCheapest = store.storeId === cheapestStore.storeId;
          const fontSize = getFontSize(store.avgPrice);
          const fontWeight = getFontWeight(store.avgPrice);
          
          return (
            <motion.div
              key={store.storeId}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative cursor-pointer group ${
                isCheapest ? 'z-10' : ''
              }`}
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: fontWeight,
              }}
            >
              <span
                className={`transition-all duration-300 ${
                  isCheapest
                    ? 'text-green-600 drop-shadow-lg'
                    : store.avgPrice <= cheapestStore.avgPrice * 1.1
                    ? 'text-green-700'
                    : store.avgPrice <= cheapestStore.avgPrice * 1.3
                    ? 'text-coffee-dark'
                    : 'text-coffee-roast'
                }`}
              >
                {store.name}
              </span>
              
              {/* Tooltip s dodatnim informacijama */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                <div className="bg-coffee-dark text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                  <div className="font-semibold mb-1">{store.name}</div>
                  <div>Prosjek: {store.avgPrice.toFixed(2)} €/espresso</div>
                  <div>Min: {store.minPrice.toFixed(2)} €/espresso</div>
                  <div>Max: {store.maxPrice.toFixed(2)} €/espresso</div>
                  <div className="text-coffee-cream mt-1">{store.coffeeCount} kava</div>
                  {isCheapest && (
                    <div className="text-green-300 mt-1 font-semibold">⭐ Najpovoljniji</div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-8 pt-6 border-t border-coffee-cream">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-coffee-roast">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-600">A</span>
            <span>Najpovoljniji</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-normal text-coffee-roast">a</span>
            <span>Srednje cijene</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-normal text-coffee-roast">a</span>
            <span>Više cijene</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

