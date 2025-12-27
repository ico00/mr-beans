import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import toast from 'react-hot-toast';

const CoffeeContext = createContext(null);

// API base URL
const API_BASE = '/api';

// Helper funkcija za dohvaćanje auth headers-a
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

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
        headers: getAuthHeaders(),
        body: JSON.stringify(coffee)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Greška pri dodavanju kave';
        throw new Error(errorMessage);
      }

      const newCoffee = await response.json();
      setCoffees(prev => [...prev, newCoffee]);
      toast.success(`Kava "${newCoffee.name}" uspješno dodana!`);
      return newCoffee;
    } catch (err) {
      console.error('Greška pri dodavanju kave:', err);
      toast.error(err.message || 'Greška pri dodavanju kave');
      throw err;
    }
  };

  // Ažuriraj kavu
  const updateCoffee = async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE}/coffees/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Greška pri ažuriranju kave';
        throw new Error(errorMessage);
      }

      const updatedCoffee = await response.json();
      setCoffees(prev => prev.map(coffee => 
        coffee.id === id ? updatedCoffee : coffee
      ));
      toast.success(`Kava "${updatedCoffee.name}" uspješno ažurirana!`);
      return updatedCoffee;
    } catch (err) {
      console.error('Greška pri ažuriranju kave:', err);
      toast.error(err.message || 'Greška pri ažuriranju kave');
      throw err;
    }
  };

  // Obriši kavu
  const deleteCoffee = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/coffees/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Greška pri brisanju kave';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const deletedCoffee = result.deleted || result;
      setCoffees(prev => prev.filter(coffee => coffee.id !== id));
      toast.success(`Kava "${deletedCoffee.name || 'kava'}" uspješno obrisana!`);
    } catch (err) {
      console.error('Greška pri brisanju kave:', err);
      toast.error(err.message || 'Greška pri brisanju kave');
      throw err;
    }
  };

  // Dodaj novu cijenu za kavu
  const addPriceEntry = async (coffeeId, priceData) => {
    try {
      const response = await fetch(`${API_BASE}/coffees/${coffeeId}/price`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(priceData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Greška pri dodavanju cijene';
        throw new Error(errorMessage);
      }

      const updatedCoffee = await response.json();
      setCoffees(prev => prev.map(coffee => 
        coffee.id === coffeeId ? updatedCoffee : coffee
      ));
      toast.success('Nova cijena uspješno dodana!');
      return updatedCoffee;
    } catch (err) {
      console.error('Greška pri dodavanju cijene:', err);
      toast.error(err.message || 'Greška pri dodavanju cijene');
      throw err;
    }
  };

  // Obriši unos iz povijesti cijena
  const deletePriceEntry = async (coffeeId, priceId) => {
    try {
      const response = await fetch(`${API_BASE}/coffees/${coffeeId}/price/${priceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Greška pri brisanju cijene';
        throw new Error(errorMessage);
      }

      const updatedCoffee = await response.json();
      setCoffees(prev => prev.map(coffee => 
        coffee.id === coffeeId ? updatedCoffee : coffee
      ));
      toast.success('Cijena uspješno obrisana!');
      return updatedCoffee;
    } catch (err) {
      console.error('Greška pri brisanju cijene:', err);
      toast.error(err.message || 'Greška pri brisanju cijene');
      throw err;
    }
  };

  // Dodaj novi brend
  const addBrand = async (brandName, logo = '') => {
    try {
      const response = await fetch(`${API_BASE}/brands`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: brandName, logo })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Greška pri dodavanju brenda';
        throw new Error(errorMessage);
      }

      const newBrand = await response.json();
      setBrands(prev => [...prev, newBrand]);
      toast.success(`Brend "${newBrand.name}" uspješno dodan!`);
      return newBrand;
    } catch (err) {
      console.error('Greška pri dodavanju brenda:', err);
      toast.error(err.message || 'Greška pri dodavanju brenda');
      throw err;
    }
  };

  // Ažuriraj brend (npr. za dodavanje loga)
  const updateBrand = async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE}/brands/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Greška pri ažuriranju brenda';
        throw new Error(errorMessage);
      }

      const updatedBrand = await response.json();
      setBrands(prev => prev.map(brand => 
        brand.id === id ? updatedBrand : brand
      ));
      toast.success(`Brend "${updatedBrand.name}" uspješno ažuriran!`);
      return updatedBrand;
    } catch (err) {
      console.error('Greška pri ažuriranju brenda:', err);
      toast.error(err.message || 'Greška pri ažuriranju brenda');
      throw err;
    }
  };

  // Dodaj novu trgovinu
  const addStore = async (storeName) => {
    try {
      const response = await fetch(`${API_BASE}/stores`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: storeName })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Greška pri dodavanju trgovine';
        throw new Error(errorMessage);
      }

      const newStore = await response.json();
      setStores(prev => [...prev, newStore]);
      toast.success(`Trgovina "${newStore.name}" uspješno dodana!`);
      return newStore;
    } catch (err) {
      console.error('Greška pri dodavanju trgovine:', err);
      toast.error(err.message || 'Greška pri dodavanju trgovine');
      throw err;
    }
  };

  // Dodaj novu državu
  const addCountry = async (countryName) => {
    try {
      const response = await fetch(`${API_BASE}/countries`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: countryName })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Greška pri dodavanju države';
        throw new Error(errorMessage);
      }

      const newCountry = await response.json();
      setCountries(prev => [...prev, newCountry]);
      toast.success(`Država "${newCountry.name}" uspješno dodana!`);
      return newCountry;
    } catch (err) {
      console.error('Greška pri dodavanju države:', err);
      toast.error(err.message || 'Greška pri dodavanju države');
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
  const getEnrichedCoffee = (coffee) => {
    // Filtriraj null vrijednosti iz countryIds
    const validCountryIds = (coffee.countryIds || (coffee.countryId ? [coffee.countryId] : []))
      .filter(id => id !== null && id !== undefined);
    
    return {
      ...coffee,
      brand: getBrandById(coffee.brandId),
      store: getStoreById(coffee.storeId),
      // Podrška za stari format (countryId) i novi (countryIds)
      countries: getCountriesByIds(validCountryIds),
      // Zadržavamo i country za kompatibilnost (prva valjana država)
      country: validCountryIds.length > 0 
        ? getCountryById(validCountryIds[0]) 
        : getCountryById(coffee.countryId)
    };
  };

  const enrichedCoffees = coffees.map(getEnrichedCoffee);

  // Statistike
  // Filtriraj samo kave u zrnu za prosječnu cijenu
  const beanCoffees = coffees.filter(c => c.type === 'Zrno');
  
  const stats = {
    totalCoffees: coffees.length,
    averagePrice: beanCoffees.length > 0 
      ? (beanCoffees.reduce((sum, c) => sum + c.priceEUR, 0) / beanCoffees.length).toFixed(2)
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
    addPriceEntry,
    deletePriceEntry,
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
