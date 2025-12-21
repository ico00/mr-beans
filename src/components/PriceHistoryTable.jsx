import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Store, Calendar, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useCoffeeData } from '../hooks/useCoffeeData';
import { formatPrice, formatDate } from '../utils/formatters';

export default function PriceHistoryTable({ coffeeId, priceHistory = [], compact = false }) {
  const { stores, deletePriceEntry, getStoreById } = useCoffeeData();
  const [expanded, setExpanded] = useState(!compact);
  const [deletingId, setDeletingId] = useState(null);

  // Sortiraj po datumu (najnoviji prvi)
  const sortedHistory = [...priceHistory].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const handleDelete = async (priceId) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj unos?')) return;
    
    setDeletingId(priceId);
    try {
      await deletePriceEntry(coffeeId, priceId);
    } catch (error) {
      console.error('Greška pri brisanju:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // Izračunaj promjenu cijene
  const getPriceChange = (currentIndex) => {
    if (currentIndex >= sortedHistory.length - 1) return null;
    const current = sortedHistory[currentIndex].price;
    const previous = sortedHistory[currentIndex + 1].price;
    const change = current - previous;
    const changePercent = ((change / previous) * 100).toFixed(1);
    return { change, changePercent, isUp: change > 0, isDown: change < 0 };
  };

  if (priceHistory.length === 0) {
    return (
      <div className="text-center py-8 text-coffee-roast">
        <p>Nema zabilježenih cijena</p>
      </div>
    );
  }

  const displayHistory = compact && !expanded ? sortedHistory.slice(0, 3) : sortedHistory;

  return (
    <div className="space-y-3">
      {/* Header */}
      {compact && sortedHistory.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm text-coffee-roast hover:text-coffee-dark transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Prikaži manje' : `Prikaži sve (${sortedHistory.length})`}
        </button>
      )}

      {/* Lista cijena */}
      <AnimatePresence mode="popLayout">
        {displayHistory.map((entry, index) => {
          const store = getStoreById(entry.storeId);
          const priceChange = getPriceChange(index);
          
          return (
            <motion.div
              key={entry.id || `${entry.date}-${entry.price}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                index === 0 
                  ? 'bg-gradient-to-r from-coffee-cream/50 to-white border-coffee-light' 
                  : 'bg-white border-neutral-200 hover:border-coffee-light/50'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Datum */}
                <div className="flex items-center gap-2 text-coffee-roast">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formatDate(entry.date)}
                  </span>
                </div>

                {/* Trgovina */}
                {store && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-coffee-cream/50 rounded-lg">
                    <Store className="w-4 h-4 text-coffee-dark" />
                    <span className="text-sm font-medium text-coffee-dark">
                      {store.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Promjena cijene */}
                {priceChange && (
                  <div className={`flex items-center gap-1 text-sm ${
                    priceChange.isUp ? 'text-red-600' : priceChange.isDown ? 'text-green-600' : 'text-neutral-500'
                  }`}>
                    {priceChange.isUp ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : priceChange.isDown ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                    <span className="font-medium">
                      {priceChange.isUp ? '+' : ''}{priceChange.changePercent}%
                    </span>
                  </div>
                )}

                {/* Cijena */}
                <div className={`text-lg font-bold ${index === 0 ? 'text-coffee-dark' : 'text-coffee-roast'}`}>
                  {formatPrice(entry.price)}
                </div>

                {/* Gumb za brisanje */}
                {entry.id && (
                  <div className="pl-2">
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Obriši unos"
                    >
                      {deletingId === entry.id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full"
                        />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Summary */}
      {sortedHistory.length > 1 && (
        <div className="pt-4 mt-4 border-t border-neutral-200">
          <div className="flex flex-wrap gap-4 text-sm text-coffee-roast">
            <div>
              <span className="font-medium">Najniža:</span>{' '}
              <span className="text-green-600 font-bold">
                {formatPrice(Math.min(...sortedHistory.map(e => e.price)))}
              </span>
            </div>
            <div>
              <span className="font-medium">Najviša:</span>{' '}
              <span className="text-red-600 font-bold">
                {formatPrice(Math.max(...sortedHistory.map(e => e.price)))}
              </span>
            </div>
            <div>
              <span className="font-medium">Prosjek:</span>{' '}
              <span className="text-coffee-dark font-bold">
                {formatPrice(sortedHistory.reduce((sum, e) => sum + e.price, 0) / sortedHistory.length)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

