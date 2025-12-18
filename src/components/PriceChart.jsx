import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { formatPrice, formatDate } from '../utils/formatters';

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

