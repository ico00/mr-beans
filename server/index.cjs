const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

// Serviraj static frontend build (samo u production-u ako dist folder postoji)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Fallback na index.html za SPA routing (samo za non-API zahtjeve)
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const dataDir = path.join(__dirname, '..', 'src', 'data');

// Helper funkcija za čitanje JSON datoteke
const readJsonFile = (filename) => {
  const filePath = path.join(dataDir, filename);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Greška pri čitanju ${filename}:`, error);
    return null;
  }
};

// Helper funkcija za pisanje JSON datoteke
const writeJsonFile = (filename, data) => {
  const filePath = path.join(dataDir, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Greška pri pisanju ${filename}:`, error);
    return false;
  }
};

// ============ API RUTE ============

// Dohvati sve kave
app.get('/api/coffees', (req, res) => {
  const data = readJsonFile('coffees.json');
  res.json(data);
});

// Dohvati sve brendove
app.get('/api/brands', (req, res) => {
  const data = readJsonFile('brands.json');
  res.json(data);
});

// Dohvati sve trgovine
app.get('/api/stores', (req, res) => {
  const data = readJsonFile('stores.json');
  res.json(data);
});

// Dohvati sve države
app.get('/api/countries', (req, res) => {
  const data = readJsonFile('countries.json');
  res.json(data);
});

// ============ CRUD ZA KAVE ============

// Dodaj novu kavu
app.post('/api/coffees', (req, res) => {
  const coffeeData = req.body;
  const data = readJsonFile('coffees.json');
  
  if (!data) {
    return res.status(500).json({ error: 'Greška pri čitanju podataka' });
  }

  const newCoffee = {
    ...coffeeData,
    id: String(Date.now()),
    priceHistory: [{ 
      date: new Date().toISOString().split('T')[0], 
      price: coffeeData.priceEUR 
    }],
    createdAt: new Date().toISOString().split('T')[0]
  };

  data.coffees.push(newCoffee);

  if (writeJsonFile('coffees.json', data)) {
    console.log(`☕ Nova kava dodana: ${newCoffee.name}`);
    res.json(newCoffee);
  } else {
    res.status(500).json({ error: 'Greška pri spremanju' });
  }
});

// Ažuriraj kavu
app.put('/api/coffees/:id', (req, res) => {
  const coffeeId = req.params.id;
  const updates = req.body;
  const data = readJsonFile('coffees.json');

  if (!data) {
    return res.status(500).json({ error: 'Greška pri čitanju podataka' });
  }

  const coffeeIndex = data.coffees.findIndex(c => c.id === coffeeId);
  if (coffeeIndex === -1) {
    return res.status(404).json({ error: 'Kava nije pronađena' });
  }

  const existingCoffee = data.coffees[coffeeIndex];
  
  // Ako se cijena promijenila, dodaj u povijest
  if (updates.priceEUR && updates.priceEUR !== existingCoffee.priceEUR) {
    const newPriceEntry = {
      date: new Date().toISOString().split('T')[0],
      price: updates.priceEUR
    };
    updates.priceHistory = [...(existingCoffee.priceHistory || []), newPriceEntry];
  }

  // Ažuriraj kavu
  data.coffees[coffeeIndex] = { ...existingCoffee, ...updates };

  if (writeJsonFile('coffees.json', data)) {
    console.log(`☕ Kava ažurirana: ${data.coffees[coffeeIndex].name}`);
    res.json(data.coffees[coffeeIndex]);
  } else {
    res.status(500).json({ error: 'Greška pri spremanju' });
  }
});

// Obriši kavu
app.delete('/api/coffees/:id', (req, res) => {
  const coffeeId = req.params.id;
  const data = readJsonFile('coffees.json');

  if (!data) {
    return res.status(500).json({ error: 'Greška pri čitanju podataka' });
  }

  const coffeeIndex = data.coffees.findIndex(c => c.id === coffeeId);
  if (coffeeIndex === -1) {
    return res.status(404).json({ error: 'Kava nije pronađena' });
  }

  const deletedCoffee = data.coffees[coffeeIndex];
  data.coffees.splice(coffeeIndex, 1);

  if (writeJsonFile('coffees.json', data)) {
    console.log(`🗑️ Kava obrisana: ${deletedCoffee.name}`);
    res.json({ success: true, deleted: deletedCoffee });
  } else {
    res.status(500).json({ error: 'Greška pri spremanju' });
  }
});

// ============ CRUD ZA BRENDOVE ============

// Dodaj novi brend
app.post('/api/brands', (req, res) => {
  const brandData = req.body;
  const data = readJsonFile('brands.json');

  if (!data) {
    return res.status(500).json({ error: 'Greška pri čitanju podataka' });
  }

  const newBrand = {
    id: String(Date.now()),
    name: brandData.name,
    country: brandData.country || 'Nepoznato',
    founded: brandData.founded || new Date().getFullYear(),
    logo: brandData.logo || ''
  };

  data.brands.push(newBrand);

  if (writeJsonFile('brands.json', data)) {
    console.log(`🏷️ Novi brend dodan: ${newBrand.name}`);
    res.json(newBrand);
  } else {
    res.status(500).json({ error: 'Greška pri spremanju' });
  }
});

// Ažuriraj brend
app.put('/api/brands/:id', (req, res) => {
  const brandId = req.params.id;
  const updates = req.body;
  const data = readJsonFile('brands.json');

  if (!data) {
    return res.status(500).json({ error: 'Greška pri čitanju podataka' });
  }

  const brandIndex = data.brands.findIndex(b => b.id === brandId);
  if (brandIndex === -1) {
    return res.status(404).json({ error: 'Brend nije pronađen' });
  }

  data.brands[brandIndex] = { ...data.brands[brandIndex], ...updates };

  if (writeJsonFile('brands.json', data)) {
    res.json(data.brands[brandIndex]);
  } else {
    res.status(500).json({ error: 'Greška pri spremanju' });
  }
});

// ============ CRUD ZA TRGOVINE ============

// Dodaj novu trgovinu
app.post('/api/stores', (req, res) => {
  const storeData = req.body;
  const data = readJsonFile('stores.json');

  if (!data) {
    return res.status(500).json({ error: 'Greška pri čitanju podataka' });
  }

  const newStore = {
    id: String(Date.now()),
    name: storeData.name,
    type: storeData.type || 'Trgovina',
    website: storeData.website || ''
  };

  data.stores.push(newStore);

  if (writeJsonFile('stores.json', data)) {
    console.log(`🏪 Nova trgovina dodana: ${newStore.name}`);
    res.json(newStore);
  } else {
    res.status(500).json({ error: 'Greška pri spremanju' });
  }
});

// ============ CRUD ZA DRŽAVE ============

// Dodaj novu državu
app.post('/api/countries', (req, res) => {
  const countryData = req.body;
  const data = readJsonFile('countries.json');

  if (!data) {
    return res.status(500).json({ error: 'Greška pri čitanju podataka' });
  }

  const newCountry = {
    id: countryData.name.toLowerCase().replace(/\s/g, '_'),
    name: countryData.name,
    flag: countryData.flag || '🌍',
    region: countryData.region || 'Nepoznato',
    coordinates: countryData.coordinates || { lat: 0, lng: 0 },
    coffeeProduction: countryData.coffeeProduction || '',
    varieties: countryData.varieties || []
  };

  data.countries.push(newCountry);

  if (writeJsonFile('countries.json', data)) {
    console.log(`🌍 Nova država dodana: ${newCountry.name}`);
    res.json(newCountry);
  } else {
    res.status(500).json({ error: 'Greška pri spremanju' });
  }
});

// ============ MARKET PRICES API ============

// Cache za burzovne cijene (osvježava se svakih 5 min)
let marketPricesCache = null;
let lastMarketFetch = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuta

// Simulirane bazne cijene (približne realne vrijednosti)
const BASE_PRICES = {
  arabica: { base: 2.45, volatility: 0.08 },  // USD/lb
  robusta: { base: 4200, volatility: 150 }     // USD/tonne
};

// Generiraj realistične cijene s malim varijacijama
function generateMarketPrices() {
  const now = new Date();
  const hourOfDay = now.getHours();
  const dayOfWeek = now.getDay();
  
  // Tržište zatvoreno vikendom
  const isMarketOpen = dayOfWeek > 0 && dayOfWeek < 6 && hourOfDay >= 9 && hourOfDay < 18;
  
  const prices = {};
  
  Object.entries(BASE_PRICES).forEach(([commodity, { base, volatility }]) => {
    // Dodaj malu nasumičnu varijaciju
    const randomFactor = (Math.random() - 0.5) * 2;
    const price = base + (randomFactor * volatility);
    
    // Dnevni raspon
    const dayVariation = volatility * 0.5;
    const high = price + (Math.random() * dayVariation);
    const low = price - (Math.random() * dayVariation);
    
    // Promjena u postotcima
    const changePercent = ((Math.random() - 0.5) * 4).toFixed(2);
    
    prices[commodity] = {
      price: Number(price.toFixed(commodity === 'arabica' ? 4 : 2)),
      high: Number(high.toFixed(commodity === 'arabica' ? 4 : 2)),
      low: Number(low.toFixed(commodity === 'arabica' ? 4 : 2)),
      changePercent: Number(changePercent),
      timestamp: now.toISOString(),
      marketOpen: isMarketOpen
    };
  });
  
  return prices;
}

// API endpoint za burzovne cijene
app.get('/api/market-prices', (req, res) => {
  const now = Date.now();
  
  // Koristi cache ako je svjež
  if (marketPricesCache && lastMarketFetch && (now - lastMarketFetch < CACHE_DURATION)) {
    return res.json(marketPricesCache);
  }
  
  // Generiraj nove cijene
  marketPricesCache = generateMarketPrices();
  lastMarketFetch = now;
  
  console.log('📈 Burzovne cijene osvježene');
  res.json(marketPricesCache);
});

// ============ IMAGE UPLOAD API ============

const imagesDir = path.join(__dirname, '..', 'public', 'images');
const coffeesImagesDir = path.join(imagesDir, 'coffees');
const brandsImagesDir = path.join(imagesDir, 'brands');

// Osiguraj da direktoriji postoje
[coffeesImagesDir, brandsImagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Upload slike kave
app.post('/api/upload/coffee', (req, res) => {
  try {
    const { filename, data, mimeType } = req.body;
    
    if (!filename || !data) {
      return res.status(400).json({ error: 'Nedostaju podaci za upload' });
    }
    
    // Validiraj tip datoteke
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (mimeType && !allowedTypes.includes(mimeType)) {
      return res.status(400).json({ error: 'Nepodržani format slike' });
    }
    
    // Sanitiziraj filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${Date.now()}-${sanitizedFilename}`;
    const filePath = path.join(coffeesImagesDir, uniqueFilename);
    
    // Dekodiraj base64 i spremi
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    fs.writeFileSync(filePath, buffer);
    
    console.log(`📷 Slika kave uploadana: ${uniqueFilename}`);
    
    res.json({ 
      success: true, 
      filename: uniqueFilename,
      path: `/images/coffees/${uniqueFilename}`
    });
  } catch (error) {
    console.error('Greška pri uploadu slike kave:', error);
    res.status(500).json({ error: 'Greška pri spremanju slike' });
  }
});

// Upload loga brenda
app.post('/api/upload/brand', (req, res) => {
  try {
    const { filename, data, mimeType } = req.body;
    
    if (!filename || !data) {
      return res.status(400).json({ error: 'Nedostaju podaci za upload' });
    }
    
    // Validiraj tip datoteke
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (mimeType && !allowedTypes.includes(mimeType)) {
      return res.status(400).json({ error: 'Nepodržani format slike' });
    }
    
    // Sanitiziraj filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${Date.now()}-${sanitizedFilename}`;
    const filePath = path.join(brandsImagesDir, uniqueFilename);
    
    // Dekodiraj base64 i spremi
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    fs.writeFileSync(filePath, buffer);
    
    console.log(`🏷️ Logo brenda uploadan: ${uniqueFilename}`);
    
    res.json({ 
      success: true, 
      filename: uniqueFilename,
      path: `/images/brands/${uniqueFilename}`
    });
  } catch (error) {
    console.error('Greška pri uploadu loga brenda:', error);
    res.status(500).json({ error: 'Greška pri spremanju slike' });
  }
});

// Dohvati listu uploadanih slika
app.get('/api/images/:type', (req, res) => {
  const { type } = req.params;
  const dir = type === 'brands' ? brandsImagesDir : coffeesImagesDir;
  
  try {
    const files = fs.readdirSync(dir).filter(f => 
      ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some(ext => f.toLowerCase().endsWith(ext))
    );
    res.json({ images: files });
  } catch (error) {
    res.json({ images: [] });
  }
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`☕ Mr. Beans Server pokrenut na http://localhost:${PORT}`);
  console.log(`📁 Data folder: ${dataDir}`);
  console.log(`📷 Images folder: ${imagesDir}`);
});

