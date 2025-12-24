import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Eye, Edit, Trash2 } from 'lucide-react';
import { CoffeeBeanRatingSmall } from './CoffeeBeanRating';
import { formatPrice, formatDate, formatWeight, roastLevels } from '../utils/formatters';
import { useCoffeeData } from '../hooks/useCoffeeData';
import { useAuth } from '../context/AuthContext';

export default function CoffeeTable({ coffees }) {
  const { deleteCoffee } = useCoffeeData();
  const { isAdmin } = useAuth();
  const [sortBy, setSortBy] = useState('brand');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Helper funkcija za dobivanje najniže cijene iz priceHistory
  const getDisplayPrice = (coffee) => {
    if (coffee.priceHistory && coffee.priceHistory.length > 0) {
      const lowestPriceEntry = coffee.priceHistory.reduce((lowest, entry) => 
        entry.price < lowest.price ? entry : lowest
      );
      return lowestPriceEntry.price;
    }
    return coffee.priceEUR || 0;
  };

  const sortedCoffees = [...coffees].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case 'brand':
        valueA = a.brand?.name?.toLowerCase() || '';
        valueB = b.brand?.name?.toLowerCase() || '';
        break;
      case 'price':
        // Koristi najnižu cijenu iz priceHistory ako postoji, inače priceEUR
        valueA = getDisplayPrice(a);
        valueB = getDisplayPrice(b);
        break;
      case 'rating':
        valueA = a.rating || 0;
        valueB = b.rating || 0;
        break;
      case 'type':
        valueA = a.type;
        valueB = b.type;
        break;
      case 'weight':
        valueA = a.weightG || 0;
        valueB = b.weightG || 0;
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null;
    // Strelica uvijek prema gore kad je stupac sortiran (označava da je aktivan)
    return (
      <ChevronUp className={`w-4 h-4 flex-shrink-0 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
    );
  };

  const handleDelete = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Jeste li sigurni da želite obrisati ovu kavu?')) {
      deleteCoffee(id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-x-auto rounded-2xl shadow-lg"
    >
      <table className="coffee-table min-w-full">
        <thead>
          <tr>
            <th 
              className="cursor-pointer hover:bg-coffee-roast transition-colors whitespace-nowrap"
              onClick={() => handleSort('brand')}
            >
              <span className="inline-flex items-center gap-1">
                Brend <SortIcon column="brand" />
              </span>
            </th>
            <th 
              className="cursor-pointer hover:bg-coffee-roast transition-colors whitespace-nowrap"
              onClick={() => handleSort('name')}
            >
              <span className="inline-flex items-center gap-1">
                Naziv <SortIcon column="name" />
              </span>
            </th>
            <th 
              className="cursor-pointer hover:bg-coffee-roast transition-colors whitespace-nowrap"
              onClick={() => handleSort('type')}
            >
              <span className="inline-flex items-center gap-1">
                Vrsta <SortIcon column="type" />
              </span>
            </th>
            <th 
              className="cursor-pointer hover:bg-coffee-roast transition-colors whitespace-nowrap"
              onClick={() => handleSort('weight')}
            >
              <span className="inline-flex items-center gap-1">
                Težina <SortIcon column="weight" />
              </span>
            </th>
            <th className="whitespace-nowrap">Prženje</th>
            <th className="whitespace-nowrap">Arabica / Robusta</th>
            <th>Država</th>
            <th>Trgovina</th>
            <th 
              className="cursor-pointer hover:bg-coffee-roast transition-colors whitespace-nowrap"
              onClick={() => handleSort('price')}
            >
              <span className="inline-flex items-center gap-1">
                Cijena <SortIcon column="price" />
              </span>
            </th>
            <th 
              className="cursor-pointer hover:bg-coffee-roast transition-colors whitespace-nowrap"
              onClick={() => handleSort('rating')}
            >
              <span className="inline-flex items-center gap-1">
                Ocjena <SortIcon column="rating" />
              </span>
            </th>
            <th>Akcije</th>
          </tr>
        </thead>
        <tbody>
          {sortedCoffees.map((coffee, index) => (
            <motion.tr
              key={coffee.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-coffee-cream/50 transition-colors"
            >
              <td className="font-semibold text-coffee-dark">{coffee.brand?.name}</td>
              <td className="text-coffee-dark">{coffee.name}</td>
              <td>
                <span className="px-2 py-1 rounded-full text-xs bg-coffee-light/30 text-coffee-dark">
                  {coffee.type}
                </span>
              </td>
              <td className="text-coffee-dark">
                {coffee.weightG ? formatWeight(coffee.weightG) : '—'}
              </td>
              <td>
                <span 
                  className="px-2 py-1 rounded-full text-xs text-white"
                  style={{ backgroundColor: roastLevels[coffee.roast]?.color }}
                >
                  {coffee.roast}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-amber-600 font-medium w-8 text-right">
                    {coffee.arabicaPercentage}%
                  </span>
                  <div className="w-16 h-3 bg-neutral-200 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-amber-500"
                      style={{ width: `${coffee.arabicaPercentage}%` }}
                      title={`Arabica ${coffee.arabicaPercentage}%`}
                    />
                    <div 
                      className="h-full bg-amber-900"
                      style={{ width: `${coffee.robustaPercentage}%` }}
                      title={`Robusta ${coffee.robustaPercentage}%`}
                    />
                  </div>
                  <span className="text-xs text-amber-900 font-medium w-8">
                    {coffee.robustaPercentage}%
                  </span>
                </div>
              </td>
              <td>
                <div className="flex flex-col gap-0.5">
                  {coffee.countries?.length > 0 ? (
                    coffee.countries.map(country => (
                      <span key={country.id} className="whitespace-nowrap text-sm">
                        {country.flag} {country.name}
                      </span>
                    ))
                  ) : coffee.country ? (
                    <span>{coffee.country.flag} {coffee.country.name}</span>
                  ) : null}
                </div>
              </td>
              <td>{coffee.store?.name}</td>
              <td className="font-bold text-coffee-dark">{formatPrice(coffee.priceEUR)}</td>
              <td>
                <CoffeeBeanRatingSmall rating={coffee.rating} size={18} hideLabel />
              </td>
              <td>
                <div className="flex items-center gap-1">
                  <Link 
                    to={`/coffee/${coffee.id}`}
                    className="p-2 rounded-lg hover:bg-coffee-light/30 text-coffee-dark transition-colors"
                    title="Pogledaj"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  {isAdmin && (
                    <>
                      <Link 
                        to={`/edit/${coffee.id}`}
                        className="p-2 rounded-lg hover:bg-coffee-light/30 text-coffee-dark transition-colors"
                        title="Uredi"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={(e) => handleDelete(e, coffee.id)}
                        className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                        title="Obriši"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      
      {sortedCoffees.length === 0 && (
        <div className="text-center py-12 text-coffee-roast">
          <p className="text-lg">Nema kava za prikaz</p>
          <p className="text-sm mt-2">Dodajte novu kavu ili promijenite filtere</p>
        </div>
      )}
    </motion.div>
  );
}

