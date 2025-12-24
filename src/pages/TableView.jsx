import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Download } from 'lucide-react';
import { useCoffeeData } from '../hooks/useCoffeeData';
import CoffeeTable from '../components/CoffeeTable';
import CoffeeFilters from '../components/CoffeeFilters';
import { filterCoffees } from '../utils/formatters';

export default function TableView() {
  const { coffees, loading } = useCoffeeData();
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    roast: '',
    brandId: '',
    storeId: '',
    countryId: '',
    minPrice: '',
    maxPrice: '',
    minRating: ''
  });

  const filteredCoffees = useMemo(() => {
    return filterCoffees(coffees, {
      ...filters,
      minPrice: filters.minPrice ? Number(filters.minPrice) : null,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : null,
      minRating: filters.minRating ? Number(filters.minRating) : null
    });
  }, [coffees, filters]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Naziv', 'Brend', 'Vrsta', 'Prženje', 'Arabica %', 'Robusta %', 'Države', 'Trgovina', 'Cijena (EUR)', 'Ocjena'];
    const rows = filteredCoffees.map(coffee => {
      const countryNames = coffee.countries?.length
        ? coffee.countries.map(c => c.name).join(' / ')
        : (coffee.country?.name || '');

      return [
      coffee.name,
      coffee.brand?.name || '',
      coffee.type,
      coffee.roast,
      coffee.arabicaPercentage,
      coffee.robustaPercentage,
        countryNames,
      coffee.store?.name || '',
      coffee.priceEUR,
      coffee.rating
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kave_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Coffee className="w-16 h-16 text-coffee-dark" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-2">
              Tablični prikaz
            </h1>
            <p className="text-coffee-roast">
              {filteredCoffees.length} od {coffees.length} kava
            </p>
          </div>
          
          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Izvezi CSV
          </button>
        </motion.div>

        {/* Filters */}
        <CoffeeFilters filters={filters} setFilters={setFilters} />

        {/* Table */}
        <CoffeeTable coffees={filteredCoffees} />
      </div>
    </div>
  );
}

