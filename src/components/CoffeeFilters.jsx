import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { useCoffeeData } from '../hooks/useCoffeeData';

export default function CoffeeFilters({ filters, setFilters }) {
  const { brands, stores, countries } = useCoffeeData();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const coffeeTypes = ['Zrno', 'Nespresso kapsula', 'Mljevena kava'];
  const roastTypes = ['Blonde', 'Medium', 'Dark'];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
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
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '' && v !== null).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 md:p-6 mb-6"
    >
      {/* Search and Quick Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-coffee-roast" />
          <input
            type="text"
            placeholder="Pretraži po nazivu ili brendu..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="form-input pl-12"
          />
        </div>
        
        {/* Quick Type Filter */}
        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="form-input md:w-48"
        >
          <option value="">Sve vrste</option>
          {coffeeTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        
        {/* Quick Roast Filter */}
        <select
          value={filters.roast}
          onChange={(e) => handleFilterChange('roast', e.target.value)}
          className="form-input md:w-40"
        >
          <option value="">Sva prženja</option>
          {roastTypes.map(roast => (
            <option key={roast} value={roast}>{roast}</option>
          ))}
        </select>
        
        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`btn-secondary flex items-center gap-2 ${showAdvanced ? 'bg-coffee-light/30' : ''}`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filtri</span>
          {activeFiltersCount > 0 && (
            <span className="bg-coffee-dark text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-6 border-t border-neutral-200 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Brand */}
                <div>
                  <label className="form-label">Brend</label>
                  <select
                    value={filters.brandId}
                    onChange={(e) => handleFilterChange('brandId', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Svi brendovi</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Store */}
                <div>
                  <label className="form-label">Trgovina</label>
                  <select
                    value={filters.storeId}
                    onChange={(e) => handleFilterChange('storeId', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Sve trgovine</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Country */}
                <div>
                  <label className="form-label">Država</label>
                  <select
                    value={filters.countryId}
                    onChange={(e) => handleFilterChange('countryId', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Sve države</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Min Rating */}
                <div>
                  <label className="form-label">Min. ocjena</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Sve ocjene</option>
                    {[5, 4, 3, 2, 1].map(rating => (
                      <option key={rating} value={rating}>{rating}+ ⭐</option>
                    ))}
                  </select>
                </div>
                
                {/* Price Range */}
                <div>
                  <label className="form-label">Min. cijena (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="form-label">Max. cijena (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="form-input"
                    placeholder="100.00"
                  />
                </div>
              </div>
              
              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 flex items-center gap-2 text-coffee-roast hover:text-coffee-dark transition-colors"
                >
                  <X className="w-4 h-4" />
                  Obriši sve filtre
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

