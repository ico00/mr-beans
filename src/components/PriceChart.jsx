import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { formatPrice, formatDate } from '../utils/formatters';
import { useCoffeeData } from '../hooks/useCoffeeData';

// Boje za različite trgovine
const STORE_COLORS = [
  '#3C2415', // Tamno smeđa
  '#C9A227', // Zlatna
  '#8A9A5B', // Maslinasto zelena
  '#E57373', // Crvenkasta
  '#64B5F6', // Plava
  '#BA68C8', // Ljubičasta
  '#4DB6AC', // Tirkizna
  '#FF8A65', // Narančasta
];

export default function PriceChart({ coffee, height = 300 }) {
  const { stores, getStoreById } = useCoffeeData();
  
  // Grupiraj cijene po trgovinama i datumima
  const { data, storeNames, storeIdMap } = useMemo(() => {
    if (!coffee.priceHistory || coffee.priceHistory.length === 0) {
      return { data: [], storeNames: [], storeIdMap: {} };
    }

    // Grupiraj unose po trgovinama
    const pricesByStore = {};
    const dateSet = new Set();
    
    coffee.priceHistory.forEach(entry => {
      if (entry.storeId) {
        if (!pricesByStore[entry.storeId]) {
          pricesByStore[entry.storeId] = [];
        }
        pricesByStore[entry.storeId].push(entry);
        dateSet.add(entry.date);
      }
    });

    const uniqueStores = Object.keys(pricesByStore);
    const sortedDates = Array.from(dateSet).sort();
    
    // Kreiraj mapu trgovina s imenima
    const storeNameMap = {};
    uniqueStores.forEach(storeId => {
      const store = getStoreById(storeId);
      storeNameMap[storeId] = store?.name || 'Nepoznato';
    });

    // Pripremi podatke - svaki datum ima cijene za svaku trgovinu
    const chartData = sortedDates.map(date => {
      const point = { 
        date: formatDate(date),
        rawDate: date
      };
      
      // Za svaku trgovinu, pronađi cijenu za taj datum
      uniqueStores.forEach(storeId => {
        const entry = coffee.priceHistory.find(
          e => e.date === date && e.storeId === storeId
        );
        point[storeNameMap[storeId]] = entry?.price || null;
      });
      
      return point;
    });

    return {
      data: chartData,
      storeNames: Object.values(storeNameMap),
      storeIdMap: storeNameMap
    };
  }, [coffee.priceHistory, getStoreById]);

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-coffee-roast">
        <p>Nema dostupne povijesti cijena</p>
      </div>
    );
  }

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-neutral-100">
          <p className="font-semibold text-coffee-dark mb-2">{label}</p>
          {payload.map((entry, index) => (
            entry.value && (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-coffee-roast">{entry.name}:</span>
                <span className="font-semibold text-coffee-dark">
                  {formatPrice(entry.value)}
                </span>
              </div>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-lg font-display font-bold text-coffee-dark mb-2">
        Povijest cijena
      </h3>
      <p className="text-sm text-coffee-roast mb-4">
        Prati promjene cijena u različitim trgovinama kroz vrijeme
      </p>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D4C4A8" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#5A4F3E', fontSize: 12 }}
            tickLine={{ stroke: '#D4C4A8' }}
          />
          <YAxis 
            tick={{ fill: '#5A4F3E', fontSize: 12 }}
            tickLine={{ stroke: '#D4C4A8' }}
            tickFormatter={(value) => `${value}€`}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          {storeNames.map((storeName, index) => (
            <Line
              key={storeName}
              type="monotone"
              dataKey={storeName}
              name={storeName}
              stroke={STORE_COLORS[index % STORE_COLORS.length]}
              strokeWidth={2.5}
              dot={{ 
                fill: STORE_COLORS[index % STORE_COLORS.length], 
                strokeWidth: 2, 
                r: 5,
                stroke: '#fff'
              }}
              activeDot={{ 
                r: 7, 
                fill: STORE_COLORS[index % STORE_COLORS.length],
                stroke: '#fff',
                strokeWidth: 2
              }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legenda s dodatnim info */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <p className="text-xs text-coffee-roast">
          💡 Svaka linija predstavlja cijene u jednoj trgovini. Praznine znače da nema podataka za taj datum.
        </p>
      </div>
    </motion.div>
  );
}

// Komponenta za usporedbu cijena više kava
export function PriceComparisonChart({ coffees, height = 400 }) {
  const { stores, getStoreById } = useCoffeeData();
  const [selectedCoffees, setSelectedCoffees] = useState(
    coffees.slice(0, 3).map(c => c.id)
  );
  
  // Pronađi sve trgovine koje se koriste u odabranim kavama
  const availableStores = useMemo(() => {
    const storeSet = new Set();
    coffees
      .filter(c => selectedCoffees.includes(c.id))
      .forEach(coffee => {
        coffee.priceHistory?.forEach(entry => {
          if (entry.storeId) {
            storeSet.add(entry.storeId);
          }
        });
      });
    return Array.from(storeSet).map(storeId => ({
      id: storeId,
      name: getStoreById(storeId)?.name || 'Nepoznato'
    }));
  }, [coffees, selectedCoffees, getStoreById]);

  const [selectedStores, setSelectedStores] = useState(() => 
    availableStores.map(s => s.id)
  );

  // Ažuriraj odabrane trgovine kada se promijene dostupne trgovine
  useEffect(() => {
    if (availableStores.length > 0) {
      setSelectedStores(prev => {
        const newStores = availableStores.map(s => s.id);
        // Zadrži postojeće odabrane ako su još uvijek dostupne
        return prev.filter(id => newStores.includes(id)).length > 0
          ? prev.filter(id => newStores.includes(id))
          : newStores;
      });
    }
  }, [availableStores]);

  // Priprema podataka za graf - po trgovinama za svaku kavu
  const { data, lineKeys } = useMemo(() => {
    const allDates = new Set();
    coffees.forEach(coffee => {
      coffee.priceHistory?.forEach(item => {
        if (selectedStores.includes(item.storeId)) {
          allDates.add(item.date);
        }
      });
    });
    
    const sortedDates = Array.from(allDates).sort();
    const keys = [];
    
    const chartData = sortedDates.map(date => {
      const point = { date: formatDate(date), rawDate: date };
      
      coffees.forEach(coffee => {
        if (selectedCoffees.includes(coffee.id)) {
          selectedStores.forEach(storeId => {
            const entry = coffee.priceHistory?.find(
              p => p.date === date && p.storeId === storeId
            );
            const storeName = getStoreById(storeId)?.name || 'Nepoznato';
            const key = `${coffee.name} @ ${storeName}`;
            point[key] = entry?.price || null;
            
            // Dodaj key samo jednom
            if (!keys.includes(key)) {
              keys.push(key);
            }
          });
        }
      });
      
      return point;
    });

    return { data: chartData, lineKeys: keys };
  }, [coffees, selectedCoffees, selectedStores, getStoreById]);

  const colors = STORE_COLORS;

  const toggleCoffee = (id) => {
    setSelectedCoffees(prev => {
      if (prev.includes(id)) {
        return prev.filter(cId => cId !== id);
      }
      if (prev.length < 6) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const toggleStore = (storeId) => {
    setSelectedStores(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(sId => sId !== storeId);
      }
      return [...prev, storeId];
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-lg font-display font-bold text-coffee-dark mb-4">
        Usporedba cijena
      </h3>
      
      {/* Coffee Selection */}
      <div className="mb-4">
        <p className="text-sm text-coffee-roast mb-2 font-medium">Odaberi kave:</p>
        <div className="flex flex-wrap gap-2">
          {coffees.map((coffee, index) => (
            <button
              key={coffee.id}
              onClick={() => toggleCoffee(coffee.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCoffees.includes(coffee.id)
                  ? 'text-white'
                  : 'bg-neutral-200 text-coffee-roast hover:bg-neutral-300'
              }`}
              style={{
                backgroundColor: selectedCoffees.includes(coffee.id) 
                  ? colors[selectedCoffees.indexOf(coffee.id) % colors.length]
                  : undefined
              }}
            >
              {coffee.brand?.name} - {coffee.name}
            </button>
          ))}
        </div>
      </div>

      {/* Store Selection */}
      {availableStores.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-coffee-roast mb-2 font-medium">Odaberi trgovine:</p>
          <div className="flex flex-wrap gap-2">
            {availableStores.map((store, index) => (
              <button
                key={store.id}
                onClick={() => toggleStore(store.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedStores.includes(store.id)
                    ? 'text-white'
                    : 'bg-neutral-200 text-coffee-roast hover:bg-neutral-300'
                }`}
                style={{
                  backgroundColor: selectedStores.includes(store.id) 
                    ? STORE_COLORS[index % STORE_COLORS.length]
                    : undefined
                }}
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: selectedStores.includes(store.id) 
                      ? '#fff' 
                      : STORE_COLORS[index % STORE_COLORS.length]
                  }}
                />
                {store.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D4C4A8" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#5A4F3E', fontSize: 12 }}
            tickLine={{ stroke: '#D4C4A8' }}
          />
          <YAxis 
            tick={{ fill: '#5A4F3E', fontSize: 12 }}
            tickLine={{ stroke: '#D4C4A8' }}
            tickFormatter={(value) => `${value}€`}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value) => value ? formatPrice(value) : 'N/A'}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          {lineKeys.map((key, index) => {
            const [coffeeName, storeName] = key.split(' @ ');
            // Pronađi index trgovine u availableStores za boju
            const storeIndex = availableStores.findIndex(s => s.name === storeName);
            const colorIndex = storeIndex >= 0 ? storeIndex : index;
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={STORE_COLORS[colorIndex % STORE_COLORS.length]}
                strokeWidth={2.5}
                dot={{ 
                  fill: STORE_COLORS[colorIndex % STORE_COLORS.length], 
                  strokeWidth: 2, 
                  r: 5,
                  stroke: '#fff'
                }}
                activeDot={{ 
                  r: 7, 
                  fill: STORE_COLORS[colorIndex % STORE_COLORS.length],
                  stroke: '#fff',
                  strokeWidth: 2
                }}
                connectNulls={true}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// Graf usporedbe cijena po trgovinama za jednu kavu
export function PriceByStoreChart({ coffee, height = 300 }) {
  const { stores, getStoreById } = useCoffeeData();
  
  if (!coffee?.priceHistory || coffee.priceHistory.length === 0) {
    return null;
  }

  // Grupiraj cijene po trgovinama
  const pricesByStore = {};
  coffee.priceHistory.forEach(entry => {
    if (entry.storeId) {
      if (!pricesByStore[entry.storeId]) {
        pricesByStore[entry.storeId] = [];
      }
      pricesByStore[entry.storeId].push(entry);
    }
  });

  // Ako nema trgovina, ne prikazuj graf
  if (Object.keys(pricesByStore).length === 0) {
    return null;
  }

  // Pripremi podatke za bar chart - najnovija cijena po trgovini
  const barData = Object.entries(pricesByStore).map(([storeId, entries]) => {
    const store = getStoreById(storeId);
    const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestPrice = sortedEntries[0]?.price || 0;
    const avgPrice = entries.reduce((sum, e) => sum + e.price, 0) / entries.length;
    const minPrice = Math.min(...entries.map(e => e.price));
    const maxPrice = Math.max(...entries.map(e => e.price));
    
    return {
      store: store?.name || 'Nepoznato',
      storeId,
      cijena: latestPrice,
      prosjek: Number(avgPrice.toFixed(2)),
      min: minPrice,
      max: maxPrice,
      count: entries.length
    };
  }).sort((a, b) => a.cijena - b.cijena);

  const colors = {
    lowest: '#22c55e',
    middle: '#6F4E37',
    highest: '#ef4444'
  };

  // Označi najnižu i najvišu cijenu
  const lowestPrice = Math.min(...barData.map(d => d.cijena));
  const highestPrice = Math.max(...barData.map(d => d.cijena));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-lg font-display font-bold text-coffee-dark mb-2">
        Usporedba cijena po trgovinama
      </h3>
      <p className="text-sm text-coffee-roast mb-4">
        Trenutne cijene iste kave u različitim trgovinama
      </p>
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={barData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#D4C4A8" />
          <XAxis 
            type="number"
            tick={{ fill: '#5A4F3E', fontSize: 12 }}
            tickFormatter={(value) => `${value}€`}
          />
          <YAxis 
            type="category"
            dataKey="store"
            tick={{ fill: '#5A4F3E', fontSize: 12 }}
            width={100}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name, props) => {
              const item = props.payload;
              return [
                <div key="tooltip" className="space-y-1">
                  <div className="font-bold">{formatPrice(value)}</div>
                  {item.count > 1 && (
                    <>
                      <div className="text-xs text-neutral-500">
                        Prosjek: {formatPrice(item.prosjek)}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Min: {formatPrice(item.min)} / Max: {formatPrice(item.max)}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {item.count} unosa
                      </div>
                    </>
                  )}
                </div>,
                ''
              ];
            }}
            labelFormatter={(label) => `${label}`}
          />
          <Bar 
            dataKey="cijena" 
            radius={[0, 8, 8, 0]}
            label={{ 
              position: 'insideRight', 
              formatter: (value) => formatPrice(value),
              fill: '#FFFFFF',
              fontSize: 13,
              fontWeight: 'bold'
            }}
          >
            {barData.map((entry, index) => (
              <Cell 
                key={entry.storeId}
                fill={
                  entry.cijena === lowestPrice ? colors.lowest :
                  entry.cijena === highestPrice ? colors.highest :
                  colors.middle
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-coffee-roast">Najniža cijena</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-coffee-roast">Najviša cijena</span>
        </div>
      </div>
    </motion.div>
  );
}

