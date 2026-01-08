import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Store, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import CoffeeBeanRating from './CoffeeBeanRating';
import { 
  formatPrice, 
  formatWeight, 
  formatPricePerKg, 
  formatDate, 
  calculatePriceChange, 
  roastLevels, 
  coffeeTypes, 
  IMAGES_FOLDER,
  calculateEspressoPrice
} from '../utils/formatters';
import { useCoffeeData } from '../hooks/useCoffeeData';

export default function CoffeeCard({ coffee, index = 0 }) {
  const { getStoreById } = useCoffeeData();
  
  // Pronađi najnižu cijenu iz priceHistory
  // VAŽNO: Za svaki store uzmi najnoviju cijenu, zatim od tih najnovijih cijena uzmi najnižu
  const getLowestPriceEntry = () => {
    if (!coffee.priceHistory || coffee.priceHistory.length === 0) {
      return null;
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

    // Za svaki dućan uzmi najnoviji unos (sortiraj po datumu, najnoviji prvi)
    const latestEntriesByStore = Object.entries(entriesByStore).map(([storeId, entries]) => {
      const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
      return sorted[0]; // Najnoviji unos za taj dućan
    });

    // Pronađi najnižu cijenu među najnovijim unosima za svaki dućan
    const lowestEntry = latestEntriesByStore.reduce((lowest, entry) => 
      entry.price < lowest.price ? entry : lowest
    );

    return lowestEntry;
  };
  
  const lowestPriceEntry = getLowestPriceEntry();
  const lowestPriceStore = lowestPriceEntry ? getStoreById(lowestPriceEntry.storeId) : null;
  const displayPrice = lowestPriceEntry ? lowestPriceEntry.price : coffee.priceEUR;
  
  // Cijena espressa (10 g) na temelju trenutne cijene pakiranja
  const espressoPrice10g = coffee.weightG 
    ? calculateEspressoPrice(displayPrice, coffee.weightG, 10)
    : null;
  
  // Uspoređuj cijene samo iz glavnog dućana kave
  const priceChange = calculatePriceChange(coffee.priceHistory, coffee.storeId);
  const roastStyle = roastLevels[coffee.roast];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Link to={`/coffee/${coffee.id}`}>
        <div className="coffee-card glass-card rounded-2xl overflow-hidden group">
          {/* Image */}
          <div className="relative h-48 bg-gradient-to-br from-coffee-light/30 to-coffee-cream overflow-hidden flex items-center justify-center">
            {coffee.image ? (
              <img 
                src={coffee.image.startsWith('http') ? coffee.image : `${IMAGES_FOLDER}${coffee.image}`} 
                alt={coffee.name}
                className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">{coffeeTypes[coffee.type]?.icon || '☕'}</span>
              </div>
            )}
            
            {/* Type Badge */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-coffee-dark backdrop-blur-sm">
              {coffee.type}
            </div>
            
            {/* Roast Badge */}
            <div 
              className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm"
              style={{ backgroundColor: roastStyle?.color }}
            >
              {coffee.roast}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Brand */}
            <p className="text-sm text-coffee-roast font-medium mb-1">
              {coffee.brand?.name}
            </p>
            
            {/* Name */}
            <h3 className="text-lg font-display font-bold text-coffee-dark mb-3 line-clamp-1">
              {coffee.name}
            </h3>
            
            {/* Rating */}
            <div className="mb-4">
              <CoffeeBeanRating rating={coffee.rating} readonly size={20} />
            </div>
            
            {/* Meta Info - Countries */}
            <div className="flex items-center gap-2 text-sm text-coffee-roast mb-4 flex-wrap">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {coffee.countries?.length > 0 ? (
                coffee.countries.map((country, idx) => (
                  <span key={country.id} className="flex items-center gap-1">
                    {country.flag} {country.name}
                    {idx < coffee.countries.length - 1 && <span className="text-neutral-300">/</span>}
                  </span>
                ))
              ) : coffee.country ? (
                <span>{coffee.country.flag} {coffee.country.name}</span>
              ) : null}
            </div>
            
            <div className="flex items-center gap-1 text-sm text-coffee-roast mb-4">
              <Store className="w-4 h-4" />
              {lowestPriceStore && lowestPriceEntry ? (
                <span>{lowestPriceStore.name} ({formatDate(lowestPriceEntry.date)})</span>
              ) : (
                <span>{coffee.store?.name || 'Nepoznat dućan'}</span>
              )}
            </div>
            
            {/* Arabica/Robusta */}
            {(coffee.arabicaPercentage !== undefined || coffee.robustaPercentage !== undefined) && (() => {
              const arabica = coffee.arabicaPercentage ?? 0;
              const robusta = coffee.robustaPercentage ?? (coffee.arabicaPercentage !== undefined ? 100 - coffee.arabicaPercentage : 0);
              return (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-600">Arabica {arabica}%</span>
                    <span className="text-amber-900">Robusta {robusta}%</span>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${arabica}%` }}
                    />
                    {robusta > 0 && (
                      <div 
                        className="h-full bg-amber-900 transition-all duration-500"
                        style={{ width: `${robusta}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })()}
            
            {/* Price & Weight */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-coffee-dark">
                  {formatPrice(displayPrice)}
                </span>
                {coffee.weightG && (
                  <>
                  <div className="text-xs text-coffee-roast">
                    {formatWeight(coffee.weightG)} • {formatPricePerKg(displayPrice, coffee.weightG)}
                  </div>
                    {espressoPrice10g !== null && (
                      <div className="text-xs text-coffee-roast mt-1">
                        ≈ {formatPrice(espressoPrice10g)} po espressu (10 g)
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {priceChange && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  priceChange.direction === 'up' ? 'text-error' :
                  priceChange.direction === 'down' ? 'text-success' : 'text-neutral-500'
                }`}>
                  {priceChange.direction === 'up' && <TrendingUp className="w-4 h-4" />}
                  {priceChange.direction === 'down' && <TrendingDown className="w-4 h-4" />}
                  {priceChange.direction === 'stable' && <Minus className="w-4 h-4" />}
                  <span>{priceChange.percentage > 0 ? '+' : ''}{priceChange.percentage.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

