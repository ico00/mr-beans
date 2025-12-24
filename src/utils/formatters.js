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

// Formatiranje težine
export function formatWeight(weightG) {
  if (!weightG) return null;
  if (weightG >= 1000) {
    return `${(weightG / 1000).toFixed(weightG % 1000 === 0 ? 0 : 1)} kg`;
  }
  return `${weightG} g`;
}

// Izračun cijene po kilogramu
export function calculatePricePerKg(priceEUR, weightG) {
  if (!priceEUR || !weightG || weightG === 0) return null;
  return (priceEUR / weightG) * 1000;
}

// Izračun cijene po jednom gramu
export function calculatePricePerGram(priceEUR, weightG) {
  if (!priceEUR || !weightG || weightG === 0) return null;
  return priceEUR / weightG;
}

// Izračun cijene jednog espressa (default 10 g)
export function calculateEspressoPrice(priceEUR, weightG, gramsPerShot = 10) {
  const pricePerGram = calculatePricePerGram(priceEUR, weightG);
  if (pricePerGram === null || !gramsPerShot || gramsPerShot <= 0) return null;
  return pricePerGram * gramsPerShot;
}

// Formatiranje cijene po kg
export function formatPricePerKg(priceEUR, weightG) {
  const pricePerKg = calculatePricePerKg(priceEUR, weightG);
  if (pricePerKg === null) return null;
  return formatPrice(pricePerKg) + '/kg';
}

// Izračun promjene cijene (uspoređuje samo cijene iz ISTOG dućana)
export function calculatePriceChange(priceHistory, storeId = null) {
  if (!priceHistory || priceHistory.length < 2) return null;
  
  // Filtriraj samo unose iz istog dućana ako je storeId naveden
  let filteredHistory = priceHistory;
  if (storeId) {
    filteredHistory = priceHistory.filter(entry => entry.storeId === storeId);
  } else {
    // Ako nema storeId, grupiraj po dućanima i uzmi onaj s najviše unosa
    const storeGroups = {};
    priceHistory.forEach(entry => {
      const sid = entry.storeId || 'unknown';
      if (!storeGroups[sid]) storeGroups[sid] = [];
      storeGroups[sid].push(entry);
    });
    
    // Nađi dućan s najviše unosa
    let maxEntries = 0;
    let mainStoreId = null;
    Object.entries(storeGroups).forEach(([sid, entries]) => {
      if (entries.length > maxEntries) {
        maxEntries = entries.length;
        mainStoreId = sid;
      }
    });
    
    if (mainStoreId && storeGroups[mainStoreId]) {
      filteredHistory = storeGroups[mainStoreId];
    }
  }
  
  // Potrebna su barem 2 unosa za usporedbu
  if (filteredHistory.length < 2) return null;
  
  // Sortiraj po datumu
  const sorted = [...filteredHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const oldPrice = sorted[0].price;
  const newPrice = sorted[sorted.length - 1].price;
  const change = ((newPrice - oldPrice) / oldPrice) * 100;
  
  return {
    absolute: newPrice - oldPrice,
    percentage: change,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    oldDate: sorted[0].date,
    newDate: sorted[sorted.length - 1].date
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
  'Light': { label: 'Light (svijetlo)', color: '#D4A574' },
  'Medium': { label: 'Medium (srednje)', color: '#8B6914' },
  'Dark': { label: 'Dark (tamno)', color: '#3C2415' }
};

// Helper funkcija za dobivanje najniže cijene iz priceHistory
function getDisplayPrice(coffee) {
  if (coffee.priceHistory && coffee.priceHistory.length > 0) {
    const lowestPriceEntry = coffee.priceHistory.reduce((lowest, entry) => 
      entry.price < lowest.price ? entry : lowest
    );
    return lowestPriceEntry.price;
  }
  return coffee.priceEUR || 0;
}

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
        // Koristi najnižu cijenu iz priceHistory ako postoji, inače priceEUR
        valueA = getDisplayPrice(a);
        valueB = getDisplayPrice(b);
        break;
      case 'rating':
        valueA = a.rating || 0;
        valueB = b.rating || 0;
        break;
      case 'brand':
        valueA = a.brand?.name?.toLowerCase() || '';
        valueB = b.brand?.name?.toLowerCase() || '';
        break;
      case 'date':
        valueA = new Date(a.createdAt || 0);
        valueB = new Date(b.createdAt || 0);
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

