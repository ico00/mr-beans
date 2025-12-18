import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Grid3X3, List, Coffee } from 'lucide-react';
import { useCoffeeData } from '../hooks/useCoffeeData';
import CoffeeCard from '../components/CoffeeCard';
import CoffeeFilters from '../components/CoffeeFilters';
import { filterCoffees } from '../utils/formatters';

export default function CoffeeList() {
  const { coffees, loading } = useCoffeeData();
  const [viewMode, setViewMode] = useState('grid');
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
              Kave
            </h1>
            <p className="text-coffee-roast">
              {filteredCoffees.length} od {coffees.length} kava
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2 glass-card rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-coffee-dark text-white' 
                  : 'text-coffee-roast hover:bg-coffee-cream/50'
              }`}
              title="Kartični prikaz"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'list' 
                  ? 'bg-coffee-dark text-white' 
                  : 'text-coffee-roast hover:bg-coffee-cream/50'
              }`}
              title="Popis"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <CoffeeFilters filters={filters} setFilters={setFilters} />

        {/* Coffee Grid/List */}
        {filteredCoffees.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Coffee className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-coffee-dark mb-2">
              Nema rezultata
            </h2>
            <p className="text-coffee-roast">
              Pokušajte promijeniti filtere ili dodajte novu kavu
            </p>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredCoffees.map((coffee, index) => (
              <CoffeeCard key={coffee.id} coffee={coffee} index={index} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {filteredCoffees.map((coffee, index) => (
              <CoffeeListItem key={coffee.id} coffee={coffee} index={index} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// List item component for list view
import { Link } from 'react-router-dom';
import { formatPrice, roastLevels, IMAGES_FOLDER } from '../utils/formatters';
import CoffeeBeanRating from '../components/CoffeeBeanRating';

function CoffeeListItem({ coffee, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/coffee/${coffee.id}`}>
        <div className="coffee-card glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
          {/* Image/Icon */}
          <div className="w-full sm:w-24 h-24 bg-gradient-to-br from-coffee-light/30 to-coffee-cream rounded-xl flex items-center justify-center flex-shrink-0">
            {coffee.image ? (
              <img 
                src={coffee.image.startsWith('http') ? coffee.image : `${IMAGES_FOLDER}${coffee.image}`}
                alt={coffee.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Coffee className="w-10 h-10 text-coffee-dark" />
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-coffee-roast">{coffee.brand?.name}</p>
                <h3 className="text-lg font-display font-bold text-coffee-dark truncate">
                  {coffee.name}
                </h3>
              </div>
              <span className="text-xl font-bold text-coffee-dark whitespace-nowrap">
                {formatPrice(coffee.priceEUR)}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="px-2 py-0.5 rounded-full text-xs bg-coffee-light/30 text-coffee-dark">
                {coffee.type}
              </span>
              <span 
                className="px-2 py-0.5 rounded-full text-xs text-white"
                style={{ backgroundColor: roastLevels[coffee.roast]?.color }}
              >
                {coffee.roast}
              </span>
              <span className="text-sm text-coffee-roast">
                {coffee.countries?.length > 0 
                  ? coffee.countries.map(c => `${c.flag} ${c.name}`).join(', ')
                  : coffee.country 
                    ? `${coffee.country.flag} ${coffee.country.name}` 
                    : ''}
              </span>
              <span className="text-sm text-coffee-roast">
                @ {coffee.store?.name}
              </span>
            </div>
            
            <div className="mt-2">
              <CoffeeBeanRating rating={coffee.rating} readonly size={16} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

