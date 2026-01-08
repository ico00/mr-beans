import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, CheckCircle2, TrendingDown, Star } from 'lucide-react';
import { useCoffeeData } from '../hooks/useCoffeeData';
import { formatPrice, calculateEspressoPrice, formatPricePerKg, calculatePricePerKg } from '../utils/formatters';
import CoffeeCard from '../components/CoffeeCard';

export default function CompareCoffee() {
  const { coffees } = useCoffeeData();
  const [leftCoffeeId, setLeftCoffeeId] = useState('');
  const [rightCoffeeId, setRightCoffeeId] = useState('');

  const leftCoffee = coffees.find(c => c.id === leftCoffeeId);
  const rightCoffee = coffees.find(c => c.id === rightCoffeeId);

  // Sortiraj kave po abecedi (brand - naziv)
  const sortedCoffees = [...coffees].sort((a, b) => {
    const aLabel = `${a.brand?.name || 'Nepoznato'} - ${a.name}`.toLowerCase();
    const bLabel = `${b.brand?.name || 'Nepoznato'} - ${b.name}`.toLowerCase();
    return aLabel.localeCompare(bLabel, 'hr');
  });

  // Funkcija za pronalazak najniže cijene iz priceHistory (ista logika kao u CoffeeCard)
  const getDisplayPrice = (coffee) => {
    if (!coffee.priceHistory || coffee.priceHistory.length === 0) {
      return coffee.priceEUR;
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

    return lowestEntry ? lowestEntry.price : coffee.priceEUR;
  };

  const leftDisplayPrice = leftCoffee ? getDisplayPrice(leftCoffee) : null;
  const rightDisplayPrice = rightCoffee ? getDisplayPrice(rightCoffee) : null;

  // Helper funkcije za određivanje boljih vrijednosti
  const getBetterPriceSide = (left, right) => {
    if (!left || !right) return null;
    if (left < right) return 'left';
    if (right < left) return 'right';
    return null; // Iste su
  };

  const getBetterRatingSide = (left, right) => {
    const leftRating = left || 0;
    const rightRating = right || 0;
    if (leftRating > rightRating) return 'left';
    if (rightRating > leftRating) return 'right';
    return null; // Iste su
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <ArrowRightLeft className="w-8 h-8 text-coffee-dark" />
            <h1 className="text-4xl md:text-5xl font-display font-bold text-coffee-dark">
              Usporedba kava
            </h1>
          </div>
          <p className="text-coffee-roast text-lg max-w-2xl mx-auto">
            Odaberite dvije kave iz padajućih izbornika i usporedite njihove karakteristike
          </p>
        </motion.div>

        {/* Dropdown selektori */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {/* Lijevi dropdown */}
          <div>
            <label className="block text-sm font-semibold text-coffee-dark mb-2">
              Prva kava
            </label>
            <select
              value={leftCoffeeId}
              onChange={(e) => setLeftCoffeeId(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-coffee-cream rounded-xl text-coffee-dark font-medium focus:outline-none focus:border-coffee-light transition-colors"
            >
              <option value="">-- Odaberite kavu --</option>
              {sortedCoffees.map((coffee) => (
                <option key={coffee.id} value={coffee.id}>
                  {coffee.brand?.name || 'Nepoznato'} - {coffee.name}
                </option>
              ))}
            </select>
          </div>

          {/* Desni dropdown */}
          <div>
            <label className="block text-sm font-semibold text-coffee-dark mb-2">
              Druga kava
            </label>
            <select
              value={rightCoffeeId}
              onChange={(e) => setRightCoffeeId(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-coffee-cream rounded-xl text-coffee-dark font-medium focus:outline-none focus:border-coffee-light transition-colors"
            >
              <option value="">-- Odaberite kavu --</option>
              {sortedCoffees.map((coffee) => (
                <option key={coffee.id} value={coffee.id}>
                  {coffee.brand?.name || 'Nepoznato'} - {coffee.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Cardovi s usporedbom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lijevi card */}
          {leftCoffee ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="[&_a]:pointer-events-none [&_a]:cursor-default">
                <CoffeeCard coffee={leftCoffee} index={0} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-8 flex items-center justify-center min-h-[500px] border-2 border-dashed border-coffee-cream"
            >
              <div className="text-center">
                <ArrowRightLeft className="w-16 h-16 text-coffee-cream mx-auto mb-4" />
                <p className="text-coffee-roast font-medium">Odaberite prvu kavu za usporedbu</p>
              </div>
            </motion.div>
          )}

          {/* Desni card */}
          {rightCoffee ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="[&_a]:pointer-events-none [&_a]:cursor-default">
                <CoffeeCard coffee={rightCoffee} index={1} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-8 flex items-center justify-center min-h-[500px] border-2 border-dashed border-coffee-cream"
            >
              <div className="text-center">
                <ArrowRightLeft className="w-16 h-16 text-coffee-cream mx-auto mb-4" />
                <p className="text-coffee-roast font-medium">Odaberite drugu kavu za usporedbu</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Detaljna usporedba ako su obje kave odabrane */}
        {leftCoffee && rightCoffee && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 glass-card rounded-2xl p-6 md:p-8"
          >
            <h3 className="text-xl font-display font-bold text-coffee-dark mb-6 text-center">
              Detaljna usporedba
            </h3>
            
            <div className="max-w-4xl mx-auto">
              {/* Tablica s usporedbom */}
              <div className="space-y-4">
                {/* Cijena */}
                <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-coffee-cream">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <p className={`font-semibold ${getBetterPriceSide(leftDisplayPrice, rightDisplayPrice) === 'left' ? 'text-green-600' : 'text-coffee-dark'}`}>
                        {formatPrice(leftDisplayPrice)}
                      </p>
                      {getBetterPriceSide(leftDisplayPrice, rightDisplayPrice) === 'left' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-coffee-roast">Cijena</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <p className={`font-semibold ${getBetterPriceSide(leftDisplayPrice, rightDisplayPrice) === 'right' ? 'text-green-600' : 'text-coffee-dark'}`}>
                        {formatPrice(rightDisplayPrice)}
                      </p>
                      {getBetterPriceSide(leftDisplayPrice, rightDisplayPrice) === 'right' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Cijena po kg */}
                {leftCoffee.weightG && rightCoffee.weightG && (() => {
                  const leftPricePerKg = calculatePricePerKg(leftDisplayPrice, leftCoffee.weightG);
                  const rightPricePerKg = calculatePricePerKg(rightDisplayPrice, rightCoffee.weightG);
                  const betterPricePerKg = getBetterPriceSide(leftPricePerKg, rightPricePerKg);
                  return (
                    <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-coffee-cream">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <p className={`font-semibold ${betterPricePerKg === 'left' ? 'text-green-600' : 'text-coffee-dark'}`}>
                            {formatPrice(leftPricePerKg)}/kg
                          </p>
                          {betterPricePerKg === 'left' && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-coffee-roast">Cijena po kg</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <p className={`font-semibold ${betterPricePerKg === 'right' ? 'text-green-600' : 'text-coffee-dark'}`}>
                            {formatPrice(rightPricePerKg)}/kg
                          </p>
                          {betterPricePerKg === 'right' && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Cijena po espressu */}
                {leftCoffee.weightG && rightCoffee.weightG && (() => {
                  const leftEspressoPrice = calculateEspressoPrice(leftDisplayPrice, leftCoffee.weightG, 10);
                  const rightEspressoPrice = calculateEspressoPrice(rightDisplayPrice, rightCoffee.weightG, 10);
                  const betterEspressoPrice = getBetterPriceSide(leftEspressoPrice, rightEspressoPrice);
                  return (
                    <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-coffee-cream">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <p className={`font-semibold ${betterEspressoPrice === 'left' ? 'text-green-600' : 'text-coffee-dark'}`}>
                            {leftEspressoPrice ? formatPrice(leftEspressoPrice) : '—'}
                          </p>
                          {betterEspressoPrice === 'left' && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        {leftEspressoPrice && (
                          <p className="text-xs text-coffee-roast">(10 g)</p>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-coffee-roast">Cijena po espressu</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <p className={`font-semibold ${betterEspressoPrice === 'right' ? 'text-green-600' : 'text-coffee-dark'}`}>
                            {rightEspressoPrice ? formatPrice(rightEspressoPrice) : '—'}
                          </p>
                          {betterEspressoPrice === 'right' && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        {rightEspressoPrice && (
                          <p className="text-xs text-coffee-roast">(10 g)</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Vrsta kave */}
                <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-coffee-cream">
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-coffee-light/30 text-coffee-dark rounded-full text-sm font-semibold">
                      {leftCoffee.type || '—'}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-coffee-roast">Vrsta kave</p>
                  </div>
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-coffee-light/30 text-coffee-dark rounded-full text-sm font-semibold">
                      {rightCoffee.type || '—'}
                    </span>
                  </div>
                </div>

                {/* Roast */}
                {leftCoffee.roast && rightCoffee.roast && (
                  <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-coffee-cream">
                    <div className="text-center">
                      <span 
                        className="inline-block px-3 py-1 text-white rounded-full text-sm font-semibold"
                        style={{ 
                          backgroundColor: leftCoffee.roast === 'Light' ? '#D4A574' :
                                          leftCoffee.roast === 'Medium' ? '#8B6914' : '#3C2415'
                        }}
                      >
                        {leftCoffee.roast}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-coffee-roast">Roast</p>
                    </div>
                    <div className="text-center">
                      <span 
                        className="inline-block px-3 py-1 text-white rounded-full text-sm font-semibold"
                        style={{ 
                          backgroundColor: rightCoffee.roast === 'Light' ? '#D4A574' :
                                          rightCoffee.roast === 'Medium' ? '#8B6914' : '#3C2415'
                        }}
                      >
                        {rightCoffee.roast}
                      </span>
                    </div>
                  </div>
                )}

                {/* Ocjena */}
                <div className="grid grid-cols-3 gap-4 items-center py-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <p className={`text-2xl font-bold ${getBetterRatingSide(leftCoffee.rating, rightCoffee.rating) === 'left' ? 'text-green-600' : 'text-coffee-dark'}`}>
                        {(leftCoffee.rating || 0).toFixed(1)}
                      </p>
                      {getBetterRatingSide(leftCoffee.rating, rightCoffee.rating) === 'left' && (
                        <Star className="w-6 h-6 text-green-600 fill-green-600" />
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-coffee-roast">Ocjena</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <p className={`text-2xl font-bold ${getBetterRatingSide(leftCoffee.rating, rightCoffee.rating) === 'right' ? 'text-green-600' : 'text-coffee-dark'}`}>
                        {(rightCoffee.rating || 0).toFixed(1)}
                      </p>
                      {getBetterRatingSide(leftCoffee.rating, rightCoffee.rating) === 'right' && (
                        <Star className="w-6 h-6 text-green-600 fill-green-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

