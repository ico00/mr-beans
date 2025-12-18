import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts';
import { formatPrice, formatDate } from '../utils/formatters';
import { useCoffeeData } from '../hooks/useCoffeeData';

export default function PriceChart({ coffee, height = 300 }) {
  const data = coffee.priceHistory?.map(item => ({
    date: formatDate(item.date),
    rawDate: item.date,
    cijena: item.price
  })) || [];

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-coffee-roast">
        <p>Nema dostupne povijesti cijena</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-lg font-display font-bold text-coffee-dark mb-4">
        Povijest cijena
      </h3>
      
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6F4E37" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6F4E37" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value) => [formatPrice(value), 'Cijena']}
          />
          <Area 
            type="monotone" 
            dataKey="cijena" 
            stroke="#6F4E37" 
            strokeWidth={3}
            fill="url(#colorPrice)"
            dot={{ fill: '#3C2415', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#C9A227' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// Komponenta za usporedbu cijena više kava
export function PriceComparisonChart({ coffees, height = 400 }) {
  const [selectedCoffees, setSelectedCoffees] = useState(
    coffees.slice(0, 3).map(c => c.id)
  );

  // Priprema podataka za graf
  const allDates = new Set();
  coffees.forEach(coffee => {
    coffee.priceHistory?.forEach(item => allDates.add(item.date));
  });
  
  const sortedDates = Array.from(allDates).sort();
  
  const data = sortedDates.map(date => {
    const point = { date: formatDate(date) };
    coffees.forEach(coffee => {
      if (selectedCoffees.includes(coffee.id)) {
        const priceEntry = coffee.priceHistory?.find(p => p.date === date);
        point[coffee.name] = priceEntry?.price || null;
      }
    });
    return point;
  });

  const colors = ['#3C2415', '#6F4E37', '#D4A574', '#C9A227', '#8A9A5B', '#B87333'];

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
      <div className="flex flex-wrap gap-2 mb-6">
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
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D4C4A8" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#5A4F3E', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: '#5A4F3E', fontSize: 12 }}
            tickFormatter={(value) => `${value}€`}
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
          <Legend />
          {coffees
            .filter(coffee => selectedCoffees.includes(coffee.id))
            .map((coffee, index) => (
              <Line
                key={coffee.id}
                type="monotone"
                dataKey={coffee.name}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            ))}
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
              position: 'right', 
              formatter: (value) => formatPrice(value),
              fill: '#5A4F3E',
              fontSize: 12
            }}
          >
            {barData.map((entry, index) => (
              <motion.rect
                key={entry.storeId}
                initial={{ width: 0 }}
                animate={{ width: 'auto' }}
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

