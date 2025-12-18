// Konstante za foldere
export const IMAGES_FOLDER = '/images/coffees/';
export const LOGOS_FOLDER = '/images/brands/';

// Formatiranje cijena u EUR
export function formatPrice(price) {
  return new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(price);
}

// Formatiranje datuma
export function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

// Formatiranje postotka
export function formatPercentage(value) {
  return `${value}%`;
}

// Izračun promjene cijene
export function calculatePriceChange(priceHistory) {
  if (!priceHistory || priceHistory.length < 2) return null;
  
  const oldPrice = priceHistory[0].price;
  const newPrice = priceHistory[priceHistory.length - 1].price;
  const change = ((newPrice - oldPrice) / oldPrice) * 100;
  
  return {
    absolute: newPrice - oldPrice,
    percentage: change,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
  };
}

// Tipovi kave na hrvatski
export const coffeeTypes = {
  'Zrno': { label: 'Zrno', icon: '☕' },
  'Nespresso kapsula': { label: 'Nespresso kapsula', icon: '💊' },
  'Mljevena kava': { label: 'Mljevena kava', icon: '🫘' }
};

// Razine prženja na hrvatski
export const roastLevels = {
  'Blonde': { label: 'Blonde (svijetlo)', color: '#D4A574' },
  'Medium': { label: 'Medium (srednje)', color: '#8B6914' },
  'Dark': { label: 'Dark (tamno)', color: '#3C2415' }
};

// Sortiranje funkcije
export function sortCoffees(coffees, sortBy, sortOrder = 'asc') {
  return [...coffees].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case 'price':
        valueA = a.priceEUR;
        valueB = b.priceEUR;
        break;
      case 'rating':
        valueA = a.rating;
        valueB = b.rating;
        break;
      case 'brand':
        valueA = a.brand?.name?.toLowerCase() || '';
        valueB = b.brand?.name?.toLowerCase() || '';
        break;
      case 'date':
        valueA = new Date(a.createdAt);
        valueB = new Date(b.createdAt);
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
}

// Filtriranje funkcije
export function filterCoffees(coffees, filters) {
  return coffees.filter(coffee => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        coffee.name.toLowerCase().includes(searchLower) ||
        coffee.brand?.name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    if (filters.type && coffee.type !== filters.type) return false;
    if (filters.roast && coffee.roast !== filters.roast) return false;
    if (filters.brandId && coffee.brandId !== filters.brandId) return false;
    if (filters.storeId && coffee.storeId !== filters.storeId) return false;
    
    // Podrška za stari (countryId) i novi format (countryIds)
    if (filters.countryId) {
      const coffeeCountryIds = coffee.countryIds || (coffee.countryId ? [coffee.countryId] : []);
      if (!coffeeCountryIds.includes(filters.countryId)) return false;
    }
    
    if (filters.minPrice && coffee.priceEUR < filters.minPrice) return false;
    if (filters.maxPrice && coffee.priceEUR > filters.maxPrice) return false;
    
    if (filters.minRating && coffee.rating < filters.minRating) return false;
    
    return true;
  });
}

