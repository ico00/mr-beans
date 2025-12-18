import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const CoffeeContext = createContext(null);

// API base URL
const API_BASE = '/api';

export function CoffeeProvider({ children }) {
  const [coffees, setCoffees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [stores, setStores] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Učitaj sve podatke s API-ja
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [coffeesRes, brandsRes, storesRes, countriesRes] = await Promise.all([
        fetch(`${API_BASE}/coffees`),
        fetch(`${API_BASE}/brands`),
        fetch(`${API_BASE}/stores`),
        fetch(`${API_BASE}/countries`)
      ]);

      if (!coffeesRes.ok || !brandsRes.ok || !storesRes.ok || !countriesRes.ok) {
        throw new Error('Greška pri dohvaćanju podataka');
      }

      const [coffeesData, brandsData, storesData, countriesData] = await Promise.all([
        coffeesRes.json(),
        brandsRes.json(),
        storesRes.json(),
        countriesRes.json()
      ]);

      setCoffees(coffeesData.coffees || []);
      setBrands(brandsData.brands || []);
      setStores(storesData.stores || []);
      setCountries(countriesData.countries || []);
    } catch (err) {
      console.error('Greška pri učitavanju podataka:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dodaj novu kavu
  const addCoffee = async (coffee) => {
    try {
      const response = await fetch(`${API_BASE}/coffees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coffee)
      });

      if (!response.ok) {
        throw new Error('Greška pri dodavanju kave');
      }

      const newCoffee = await response.json();
      setCoffees(prev => [...prev, newCoffee]);
      return newCoffee;
    } catch (err) {
      console.error('Greška pri dodavanju kave:', err);
      throw err;
    }
  };

  // Ažuriraj kavu
  const updateCoffee = async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE}/coffees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Greška pri ažuriranju kave');
      }

      const updatedCoffee = await response.json();
      setCoffees(prev => prev.map(coffee => 
        coffee.id === id ? updatedCoffee : coffee
      ));
      return updatedCoffee;
    } catch (err) {
      console.error('Greška pri ažuriranju kave:', err);
      throw err;
    }
  };

  // Obriši kavu
  const deleteCoffee = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/coffees/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Greška pri brisanju kave');
      }

      setCoffees(prev => prev.filter(coffee => coffee.id !== id));
    } catch (err) {
      console.error('Greška pri brisanju kave:', err);
      throw err;
    }
  };

  // Dodaj novi brend
  const addBrand = async (brandName, logo = '') => {
    try {
      const response = await fetch(`${API_BASE}/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: brandName, logo })
      });

      if (!response.ok) {
        throw new Error('Greška pri dodavanju brenda');
      }

      const newBrand = await response.json();
      setBrands(prev => [...prev, newBrand]);
      return newBrand;
    } catch (err) {
      console.error('Greška pri dodavanju brenda:', err);
      throw err;
    }
  };

  // Ažuriraj brend (npr. za dodavanje loga)
  const updateBrand = async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE}/brands/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Greška pri ažuriranju brenda');
      }

      const updatedBrand = await response.json();
      setBrands(prev => prev.map(brand => 
        brand.id === id ? updatedBrand : brand
      ));
      return updatedBrand;
    } catch (err) {
      console.error('Greška pri ažuriranju brenda:', err);
      throw err;
    }
  };

  // Dodaj novu trgovinu
  const addStore = async (storeName) => {
    try {
      const response = await fetch(`${API_BASE}/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: storeName })
      });

      if (!response.ok) {
        throw new Error('Greška pri dodavanju trgovine');
      }

      const newStore = await response.json();
      setStores(prev => [...prev, newStore]);
      return newStore;
    } catch (err) {
      console.error('Greška pri dodavanju trgovine:', err);
      throw err;
    }
  };

  // Dodaj novu državu
  const addCountry = async (countryName) => {
    try {
      const response = await fetch(`${API_BASE}/countries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: countryName })
      });

      if (!response.ok) {
        throw new Error('Greška pri dodavanju države');
      }

      const newCountry = await response.json();
      setCountries(prev => [...prev, newCountry]);
      return newCountry;
    } catch (err) {
      console.error('Greška pri dodavanju države:', err);
      throw err;
    }
  };

  // Pomoćne funkcije za dohvat povezanih podataka
  const getBrandById = (id) => brands.find(b => b.id === id);
  const getStoreById = (id) => stores.find(s => s.id === id);
  const getCountryById = (id) => countries.find(c => c.id === id);
  const getCountriesByIds = (ids) => {
    if (!ids || !Array.isArray(ids)) return [];
    return ids.map(id => countries.find(c => c.id === id)).filter(Boolean);
  };

  // Obogati kavu s povezanim podacima
  const getEnrichedCoffee = (coffee) => ({
    ...coffee,
    brand: getBrandById(coffee.brandId),
    store: getStoreById(coffee.storeId),
    // Podrška za stari format (countryId) i novi (countryIds)
    countries: getCountriesByIds(coffee.countryIds || (coffee.countryId ? [coffee.countryId] : [])),
    // Zadržavamo i country za kompatibilnost (prva država)
    country: coffee.countryIds?.length > 0 
      ? getCountryById(coffee.countryIds[0]) 
      : getCountryById(coffee.countryId)
  });

  const enrichedCoffees = coffees.map(getEnrichedCoffee);

  // Statistike
  const stats = {
    totalCoffees: coffees.length,
    averagePrice: coffees.length > 0 
      ? (coffees.reduce((sum, c) => sum + c.priceEUR, 0) / coffees.length).toFixed(2)
      : 0,
    averageRating: coffees.length > 0
      ? (coffees.reduce((sum, c) => sum + c.rating, 0) / coffees.length).toFixed(1)
      : 0,
    byType: coffees.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {}),
    byRoast: coffees.reduce((acc, c) => {
      acc[c.roast] = (acc[c.roast] || 0) + 1;
      return acc;
    }, {})
  };

  const value = {
    coffees: enrichedCoffees,
    brands,
    stores,
    countries,
    loading,
    error,
    stats,
    addCoffee,
    updateCoffee,
    deleteCoffee,
    addBrand,
    updateBrand,
    addStore,
    addCountry,
    getBrandById,
    getStoreById,
    getCountryById,
    getCountriesByIds,
    refreshData: loadData
  };

  return (
    <CoffeeContext.Provider value={value}>
      {children}
    </CoffeeContext.Provider>
  );
}

export function useCoffeeData() {
  const context = useContext(CoffeeContext);
  if (!context) {
    throw new Error('useCoffeeData must be used within a CoffeeProvider');
  }
  return context;
}
