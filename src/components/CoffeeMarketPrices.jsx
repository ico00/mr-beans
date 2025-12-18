import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink, Coffee, AlertCircle } from 'lucide-react';

// Commodity codes for coffee futures
const COFFEE_COMMODITIES = [
  { 
    id: 'arabica',
    name: 'Arabica',
    symbol: 'KC',
    description: 'Coffee C Futures (ICE)',
    unit: 'USD/lb',
    flag: '🇧🇷'
  },
  {
    id: 'robusta',
    name: 'Robusta', 
    symbol: 'RC',
    description: 'Robusta Coffee Futures (ICE)',
    unit: 'USD/tonne',
    flag: '🇻🇳'
  }
];

export default function CoffeeMarketPrices({ compact = false }) {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/market-prices');
      
      if (!response.ok) {
        throw new Error('Nije moguće dohvatiti cijene');
      }
      
      const data = await response.json();
      setPrices(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Greška pri dohvaćanju cijena:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    
    // Osvježi svakih 5 minuta
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price, decimals = 2) => {
    if (!price) return '—';
    return new Intl.NumberFormat('hr-HR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(price);
  };

  const formatChange = (change) => {
    if (!change && change !== 0) return null;
    const isPositive = change > 0;
    const isZero = change === 0;
    
    return {
      value: `${isPositive ? '+' : ''}${formatPrice(change)}%`,
      color: isZero ? 'text-neutral-500' : isPositive ? 'text-green-600' : 'text-red-600',
      bgColor: isZero ? 'bg-neutral-100' : isPositive ? 'bg-green-100' : 'bg-red-100',
      Icon: isZero ? Minus : isPositive ? TrendingUp : TrendingDown
    };
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display font-bold text-coffee-dark text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tržište kave
          </h4>
          <button
            onClick={fetchPrices}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-coffee-cream/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-coffee-roast ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : (
          <div className="space-y-2">
            {COFFEE_COMMODITIES.map(commodity => {
              const priceData = prices?.[commodity.id];
              const change = formatChange(priceData?.changePercent);
              
              return (
                <div key={commodity.id} className="flex items-center justify-between">
                  <span className="text-sm text-coffee-roast">{commodity.flag} {commodity.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-coffee-dark">
                      {loading ? '...' : `$${formatPrice(priceData?.price)}`}
                    </span>
                    {change && (
                      <span className={`text-xs font-medium ${change.color}`}>
                        {change.value}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-display font-bold text-coffee-dark flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Burzovne cijene kave
          </h3>
          <p className="text-sm text-coffee-roast mt-1">
            Live cijene s ICE Futures Exchange
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-coffee-roast">
              Ažurirano: {lastUpdate.toLocaleTimeString('hr-HR')}
            </span>
          )}
          <button
            onClick={fetchPrices}
            disabled={loading}
            className="p-2 rounded-xl bg-coffee-cream/50 hover:bg-coffee-cream transition-colors disabled:opacity-50"
            title="Osvježi cijene"
          >
            <RefreshCw className={`w-5 h-5 text-coffee-dark ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Greška pri dohvaćanju cijena</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COFFEE_COMMODITIES.map(commodity => {
            const priceData = prices?.[commodity.id];
            const change = formatChange(priceData?.changePercent);
            
            return (
              <motion.div
                key={commodity.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-white to-coffee-cream/30 rounded-xl p-5 border border-neutral-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{commodity.flag}</span>
                      <h4 className="font-display font-bold text-coffee-dark text-lg">
                        {commodity.name}
                      </h4>
                    </div>
                    <p className="text-xs text-coffee-roast">{commodity.description}</p>
                  </div>
                  
                  {change && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${change.bgColor}`}>
                      <change.Icon className={`w-3 h-3 ${change.color}`} />
                      <span className={`text-sm font-semibold ${change.color}`}>
                        {change.value}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-coffee-dark font-mono">
                      {loading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        `$${formatPrice(priceData?.price)}`
                      )}
                    </p>
                    <p className="text-xs text-coffee-roast mt-1">
                      {commodity.unit}
                    </p>
                  </div>
                  
                  {priceData?.high && priceData?.low && (
                    <div className="text-right text-xs">
                      <p className="text-coffee-roast">
                        <span className="text-green-600">▲</span> {formatPrice(priceData.high)}
                      </p>
                      <p className="text-coffee-roast">
                        <span className="text-red-600">▼</span> {formatPrice(priceData.low)}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Mini price bar */}
                {priceData?.high && priceData?.low && priceData?.price && (
                  <div className="mt-4">
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden relative">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-coffee-light to-coffee-dark rounded-full"
                        style={{
                          width: `${((priceData.price - priceData.low) / (priceData.high - priceData.low)) * 100}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-coffee-roast mt-1">
                      <span>Dnevni min</span>
                      <span>Dnevni max</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Market info */}
      <div className="mt-6 pt-4 border-t border-neutral-200">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-coffee-roast">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Coffee className="w-3 h-3" />
              Izvor: ICE Futures
            </span>
            <span>•</span>
            <span>Cijene su indikativne</span>
          </div>
          <a 
            href="https://www.ice.com/products/15/Coffee-C-Futures" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-coffee-dark hover:underline"
          >
            Više informacija
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

