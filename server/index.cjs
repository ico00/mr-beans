// Učitaj environment varijable prije svega
require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { login, verifyToken, authMiddleware } = require('./auth.cjs');
const { generalLimiter, loginLimiter, writeLimiter, uploadLimiter } = require('./middleware/rateLimiter.cjs');
const { corsMiddleware, getAllowedOrigins } = require('./middleware/corsConfig.cjs');
const helmetConfig = require('./middleware/helmetConfig.cjs');
const { validateCoffee, validatePriceEntry } = require('./validators/coffeeValidator.cjs');
const { validateBrand } = require('./validators/brandValidator.cjs');
const { validateStore } = require('./validators/storeValidator.cjs');
const { validateCountry } = require('./validators/countryValidator.cjs');
const { ErrorHelpers, createSuccessResponse } = require('./utils/errorHandler.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers - Helmet (mora biti prije CORS-a)
app.use(helmetConfig);

// CORS konfiguracija s whitelistom
app.use(corsMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Primijeni opći rate limiter na sve API rute
app.use('/api', generalLimiter);

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

// ============ AUTH RUTE ============

// Admin login - strog rate limiter (5 pokušaja po 15 min)
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  const result = login(password);
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json(result);
  }
});

// Verify token
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ valid: false });
  }
  const token = authHeader.substring(7);
  const result = verifyToken(token);
  res.json({ valid: result.valid });
});

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

// Dodaj novu kavu - write limiter
app.post('/api/coffees', writeLimiter, authMiddleware, (req, res) => {
  // Validacija
  const { error, value: validatedData } = validateCoffee(req.body);
  if (error) {
    return res.status(400).json(error);
  }

  const data = readJsonFile('coffees.json');
  if (!data) {
    return res.status(500).json(ErrorHelpers.internalError('Greška pri čitanju podataka'));
  }

  const newCoffee = {
    ...validatedData,
    id: String(Date.now()),
    priceHistory: [{ 
      id: String(Date.now()),
      date: new Date().toISOString().split('T')[0], 
      price: validatedData.priceEUR,
      storeId: validatedData.storeId || null
    }],
    createdAt: new Date().toISOString().split('T')[0]
  };

  data.coffees.push(newCoffee);

  if (writeJsonFile('coffees.json', data)) {
    console.log(`☕ Nova kava dodana: ${newCoffee.name}`);
    res.json(newCoffee);
  } else {
    res.status(500).json(ErrorHelpers.internalError('Greška pri spremanju'));
  }
});

// Ažuriraj kavu - write limiter
app.put('/api/coffees/:id', writeLimiter, authMiddleware, (req, res) => {
  const coffeeId = req.params.id;
  
  // Validacija (dopušta djelomične update-e, ali validira sve poslane podatke)
  const { error, value: validatedUpdates } = validateCoffee(req.body, { partial: true });
  if (error) {
    return res.status(400).json(error);
  }

  const data = readJsonFile('coffees.json');
  if (!data) {
    return res.status(500).json(ErrorHelpers.internalError('Greška pri čitanju podataka'));
  }

  const coffeeIndex = data.coffees.findIndex(c => c.id === coffeeId);
  if (coffeeIndex === -1) {
    return res.status(404).json(ErrorHelpers.notFound('Kava'));
  }

  const existingCoffee = data.coffees[coffeeIndex];
  
  // Ako se cijena promijenila, dodaj u povijest
  if (validatedUpdates.priceEUR && validatedUpdates.priceEUR !== existingCoffee.priceEUR) {
    const newPriceEntry = {
      id: String(Date.now()),
      date: new Date().toISOString().split('T')[0],
      price: validatedUpdates.priceEUR,
      storeId: validatedUpdates.storeId || existingCoffee.storeId || null
    };
    validatedUpdates.priceHistory = [...(existingCoffee.priceHistory || []), newPriceEntry];
  }

  // Ažuriraj kavu
  data.coffees[coffeeIndex] = { ...existingCoffee, ...validatedUpdates };

  if (writeJsonFile('coffees.json', data)) {
    console.log(`☕ Kava ažurirana: ${data.coffees[coffeeIndex].name}`);
    res.json(data.coffees[coffeeIndex]);
  } else {
    res.status(500).json(ErrorHelpers.internalError('Greška pri spremanju'));
  }
});

// ============ POVIJEST CIJENA ============

// Dodaj novi unos cijene za kavu (s trgovinom i datumom) - write limiter
app.post('/api/coffees/:id/price', writeLimiter, authMiddleware, (req, res) => {
  const coffeeId = req.params.id;
  
  // Validacija
  const { error, value: validatedData } = validatePriceEntry(req.body);
  if (error) {
    return res.status(400).json(error);
  }

  const { date, price, storeId } = validatedData;
  const data = readJsonFile('coffees.json');

  if (!data) {
    return res.status(500).json(ErrorHelpers.internalError('Greška pri čitanju podataka'));
  }

  const coffeeIndex = data.coffees.findIndex(c => c.id === coffeeId);
  if (coffeeIndex === -1) {
    return res.status(404).json(ErrorHelpers.notFound('Kava'));
  }

  const coffee = data.coffees[coffeeIndex];
  
  // Kreiraj novi unos cijene
  const newPriceEntry = {
    id: String(Date.now()),
    date: date,
    price: Number(price),
    storeId: storeId
  };

  // Dodaj u povijest cijena
  if (!coffee.priceHistory) {
    coffee.priceHistory = [];
  }
  coffee.priceHistory.push(newPriceEntry);

  // Ažuriraj trenutnu cijenu ako je novi unos najnoviji
  const sortedHistory = [...coffee.priceHistory].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  if (sortedHistory[0].id === newPriceEntry.id) {
    coffee.priceEUR = newPriceEntry.price;
    coffee.storeId = newPriceEntry.storeId;
  }

  data.coffees[coffeeIndex] = coffee;

  if (writeJsonFile('coffees.json', data)) {
    console.log(`💰 Nova cijena dodana za: ${coffee.name} - ${price}€ @ ${storeId}`);
    res.json(coffee);
  } else {
    res.status(500).json(ErrorHelpers.internalError('Greška pri spremanju'));
  }
});

// Obriši unos iz povijesti cijena - write limiter
app.delete('/api/coffees/:id/price/:priceId', writeLimiter, authMiddleware, (req, res) => {
  const { id: coffeeId, priceId } = req.params;
  const data = readJsonFile('coffees.json');

  if (!data) {
    return res.status(500).json(ErrorHelpers.internalError('Greška pri čitanju podataka'));
  }

  const coffeeIndex = data.coffees.findIndex(c => c.id === coffeeId);
  if (coffeeIndex === -1) {
    return res.status(404).json(ErrorHelpers.notFound('Kava'));
  }

  const coffee = data.coffees[coffeeIndex];
  const priceIndex = coffee.priceHistory?.findIndex(p => p.id === priceId);
  
  if (priceIndex === -1 || priceIndex === undefined) {
    return res.status(404).json(ErrorHelpers.notFound('Unos cijene'));
  }

  coffee.priceHistory.splice(priceIndex, 1);
  data.coffees[coffeeIndex] = coffee;

  if (writeJsonFile('coffees.json', data)) {
    console.log(`🗑️ Cijena obrisana za: ${coffee.name}`);
    res.json(coffee);
  } else {
    res.status(500).json(ErrorHelpers.internalError('Greška pri spremanju'));
  }
});

// Obriši kavu - write limiter
app.delete('/api/coffees/:id', writeLimiter, authMiddleware, (req, res) => {
  const coffeeId = req.params.id;
  const data = readJsonFile('coffees.json');

  if (!data) {
    return res.status(500).json(ErrorHelpers.internalError('Greška pri čitanju podataka'));
  }

  const coffeeIndex = data.coffees.findIndex(c => c.id === coffeeId);
  if (coffeeIndex === -1) {
    return res.status(404).json(ErrorHelpers.notFound('Kava'));
  }

  const deletedCoffee = data.coffees[coffeeIndex];
  data.coffees.splice(coffeeIndex, 1);

  if (writeJsonFile('coffees.json', data)) {
    console.log(`🗑️ Kava obrisana: ${deletedCoffee.name}`);
    res.json({ success: true, deleted: deletedCoffee });
  } else {
    res.status(500).json(ErrorHelpers.internalError('Greška pri spremanju'));
  }
});

// ============ CRUD ZA BRENDOVE ============

// Dodaj novi brend - write limiter
app.post('/api/brands', writeLimiter, authMiddleware, (req, res) => {
  // Validacija
  const { error, value: validatedData } = validateBrand(req.body);
  if (error) {
    return res.status(400).json(error);
  }

  const data = readJsonFile('brands.json');
  if (!data) {
    return res.status(500).json(ErrorHelpers.internalError('Greška pri čitanju podataka'));
  }

  const newBrand = {
    id: String(Date.now()),
    ...validatedData
  };

  data.brands.push(newBrand);

  if (writeJsonFile('brands.json', data)) {
    console.log(`🏷️ Novi brend dodan: ${newBrand.name}`);
    res.json(newBrand);
  } else {
    res.status(500).json(ErrorHelpers.internalError('Greška pri spremanju'));
  }
});

// Ažuriraj brend - write limiter
app.put('/api/brands/:id', writeLimiter, authMiddleware, (req, res) => {
  const brandId = req.params.id;
  
  // Validacija (dopušta djelomične update-e)
  const { error, value: validatedUpdates } = validateBrand(req.body);
  if (error) {
    return res.status(400).json(error);
  }

  const data = readJsonFile('brands.json');
  if (!data) {
    return res.status(500).json(ErrorHelpers.internalError('Greška pri čitanju podataka'));
  }

  const brandIndex = data.brands.findIndex(b => b.id === brandId);
  if (brandIndex === -1) {
    return res.status(404).json(ErrorHelpers.notFound('Brend'));
  }

  data.brands[brandIndex] = { ...data.brands[brandIndex], ...validatedUpdates };

  if (writeJsonFile('brands.json', data)) {
    res.json(data.brands[brandIndex]);
  } else {
    res.status(500).json(ErrorHelpers.internalError('Greška pri spremanju'));
  }
});

// ============ CRUD ZA TRGOVINE ============

// Dodaj novu trgovinu - write limiter
app.post('/api/stores', writeLimiter, authMiddleware, (req, res) => {
  // Validacija
  const { error, value: validatedData } = validateStore(req.body);
  if (error) {
    return res.status(400).json(error);
  }

  const data = readJsonFile('stores.json');
  if (!data) {
    return res.status(500).json(ErrorHelpers.internalError('Greška pri čitanju podataka'));
  }

  const newStore = {
    id: String(Date.now()),
    ...validatedData
  };

  data.stores.push(newStore);

  if (writeJsonFile('stores.json', data)) {
    console.log(`🏪 Nova trgovina dodana: ${newStore.name}`);
    res.json(newStore);
  } else {
    res.status(500).json(ErrorHelpers.internalError('Greška pri spremanju'));
  }
});

// ============ CRUD ZA DRŽAVE ============

// Dodaj novu državu - write limiter
app.post('/api/countries', writeLimiter, authMiddleware, (req, res) => {
  // Validacija
  const { error, value: validatedData } = validateCountry(req.body);
  if (error) {
    return res.status(400).json(error);
  }

  const data = readJsonFile('countries.json');
  if (!data) {
    return res.status(500).json(ErrorHelpers.internalError('Greška pri čitanju podataka'));
  }

  const newCountry = {
    id: validatedData.name.toLowerCase().replace(/\s/g, '_'),
    ...validatedData
  };

  data.countries.push(newCountry);

  if (writeJsonFile('countries.json', data)) {
    console.log(`🌍 Nova država dodana: ${newCountry.name}`);
    res.json(newCountry);
  } else {
    res.status(500).json(ErrorHelpers.internalError('Greška pri spremanju'));
  }
});

// ============ MARKET PRICES API ============

// Cache za burzovne cijene (osvježava se svakih 5 min)
let marketPricesCache = null;
let lastMarketFetch = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuta

// Fallback bazne cijene (koristi se ako API ne radi)
const BASE_PRICES = {
  arabica: { base: 3.45, volatility: 0.05 },  // USD/lb
  robusta: { base: 3895, volatility: 5 }     // USD/tonne
};

// Dohvati Robustu s alternativnog API-ja (Alpha Vantage ili Commodities-API)
async function fetchRobustaFromInvesting() {
  try {
    // Pokušaj s Commodities-API (besplatan tier)
    // Alternativno, možemo koristiti Alpha Vantage ako imamo API key
    // Za sada koristimo Trading Economics ili Investing.com preko njihovog API-ja
    
    // Pokušaj dohvatiti s Investing.com preko njihovog widget API-ja
    // Investing.com koristi interni API koji možemo pokušati pristupiti
    const investingUrl = 'https://api.investing.com/api/financialdata/commodities/robusta-coffee';
    
    // Alternativno, možemo koristiti neki drugi besplatni API
    // Za sada vraćamo null i koristimo fallback dok ne pronađemo pouzdan izvor
    // Možemo koristiti Alpha Vantage ako korisnik ima API key
    return null;
  } catch (error) {
    console.log('⚠️ Alternativni API za Robustu nije dostupan:', error.message);
    return null;
  }
}

// Helper funkcija za HTTP request (koristi https modul)
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      // Provjeri status kod
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Dohvati stvarne cijene s Yahoo Finance API-ja
async function fetchRealMarketPrices() {
  try {
    // Yahoo Finance ticker simboli:
    // KC=F - Coffee C Futures (Arabica)
    // RC=F - Robusta Coffee Futures
    
    console.log('🔍 Pokušavam dohvatiti stvarne cijene s Yahoo Finance...');
    
    // Pokušaj dohvatiti Arabica (KC=F) i Robusta (RC=F ili alternativni ticker)
    // Robusta može biti dostupna pod različitim tickerima ovisno o burzi
    const arabicaPromise = httpsGet('https://query1.finance.yahoo.com/v8/finance/chart/KC=F?interval=1d&range=1d').catch((err) => {
      console.error('❌ Greška pri dohvaćanju Arabica:', err.message);
      return null;
    });
    
    // Pokušaj s različitim tickerima za Robustu na Yahoo Finance
    const robustaYahooPromises = [
      'RC=F',  // ICE Robusta
      'LRC=F', // London Robusta
      'RCF=F'  // Alternativni format
    ].map(ticker => 
      httpsGet(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`).catch(() => null)
    );
    
    // Alternativni API za Robustu - Investing.com
    const robustaInvestingPromise = fetchRobustaFromInvesting().catch(() => null);
    
    const allPromises = [
      arabicaPromise,
      ...robustaYahooPromises,
      robustaInvestingPromise
    ];
    
    const results = await Promise.all(allPromises);
    const arabicaData = results[0];
    const robustaYahooResults = results.slice(1, 1 + robustaYahooPromises.length);
    const robustaInvestingData = results[results.length - 1];
    
    // Pronađi prvi uspješan rezultat za Robustu (prvo Yahoo, pa Investing)
    const robustaData = robustaYahooResults.find(result => result !== null) || robustaInvestingData || null;
    
    console.log('📊 Arabica data:', arabicaData ? 'OK' : 'NULL');
    console.log('📊 Robusta data:', robustaData ? 'OK' : 'NULL');

    const prices = {};
    const now = new Date();
    const hourOfDay = now.getHours();
    const dayOfWeek = now.getDay();
    const isMarketOpen = dayOfWeek > 0 && dayOfWeek < 6 && hourOfDay >= 9 && hourOfDay < 18;

    // Arabica (KC=F) - cijena je u centima po funti, treba podijeliti sa 100
    if (arabicaData && arabicaData.chart && arabicaData.chart.result && arabicaData.chart.result[0]) {
      const result = arabicaData.chart.result[0];
      if (result.meta && result.meta.regularMarketPrice) {
        const regularMarketPrice = result.meta.regularMarketPrice;
        const previousClose = result.meta.previousClose || regularMarketPrice;
        const changePercent = previousClose ? ((regularMarketPrice - previousClose) / previousClose) * 100 : 0;
        const high = result.meta.regularMarketDayHigh || regularMarketPrice;
        const low = result.meta.regularMarketDayLow || regularMarketPrice;
        
        prices.arabica = {
          price: Number((regularMarketPrice / 100).toFixed(4)), // Konvertiraj iz centi u dolare
          high: Number((high / 100).toFixed(4)),
          low: Number((low / 100).toFixed(4)),
          changePercent: Number(changePercent.toFixed(2)),
          timestamp: now.toISOString(),
          marketOpen: isMarketOpen
        };
        console.log('✅ Arabica cijena dohvaćena:', prices.arabica.price);
      } else {
        console.log('⚠️ Arabica: Nedostaju meta podaci');
      }
    } else {
      console.log('⚠️ Arabica: Neispravan format podataka');
    }

    // Robusta - pokušaj s Yahoo Finance formatom ili alternativnim API-jem
    if (robustaData && robustaData.chart && robustaData.chart.result && robustaData.chart.result[0]) {
      // Yahoo Finance format
      const result = robustaData.chart.result[0];
      if (result.meta && result.meta.regularMarketPrice) {
        const regularMarketPrice = result.meta.regularMarketPrice;
        const previousClose = result.meta.previousClose || regularMarketPrice;
        const changePercent = previousClose ? ((regularMarketPrice - previousClose) / previousClose) * 100 : 0;
        const high = result.meta.regularMarketDayHigh || regularMarketPrice;
        const low = result.meta.regularMarketDayLow || regularMarketPrice;
        
        prices.robusta = {
          price: Number(regularMarketPrice.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          timestamp: now.toISOString(),
          marketOpen: isMarketOpen
        };
        console.log('✅ Robusta cijena dohvaćena s Yahoo Finance:', prices.robusta.price);
      } else {
        console.log('⚠️ Robusta: Nedostaju meta podaci');
      }
    } else if (robustaData && robustaData.price) {
      // Alternativni format (npr. Investing.com ili drugi API)
      prices.robusta = {
        price: Number(robustaData.price.toFixed(2)),
        high: Number((robustaData.high || robustaData.price).toFixed(2)),
        low: Number((robustaData.low || robustaData.price).toFixed(2)),
        changePercent: Number((robustaData.changePercent || 0).toFixed(2)),
        timestamp: now.toISOString(),
        marketOpen: isMarketOpen
      };
      console.log('✅ Robusta cijena dohvaćena s alternativnog API-ja:', prices.robusta.price);
    } else {
      console.log('⚠️ Robusta: Neispravan format podataka ili nije dostupna');
    }

    // Ako imamo barem Arabicu, koristimo je, a za Robustu koristimo fallback ako nije dostupna
    if (!prices.arabica) {
      console.log('❌ Arabica nije dohvaćena, koristim fallback');
      return null;
    }

    // Provjeri da li je Robusta stvarno dohvaćena s API-ja
    const robustaIsLive = !!prices.robusta;
    
    // Ako nemamo Robustu, generiraj fallback samo za Robustu
    if (!prices.robusta) {
      console.log('⚠️ Robusta nije dostupna na Yahoo Finance, koristim fallback za Robustu');
      const robustaFallback = generateFallbackPrices().robusta;
      prices.robusta = robustaFallback;
    }

    // Označi da su ovo stvarni podaci (barem za Arabicu)
    const isFullyLive = prices.arabica && robustaIsLive;
    console.log(`✅ Cijene dohvaćene! Arabica: LIVE, Robusta: ${robustaIsLive ? 'LIVE' : 'FALLBACK'}`);
    
    return {
      ...prices,
      isLive: isFullyLive,
      source: isFullyLive ? 'Yahoo Finance API' : 'Yahoo Finance API (Arabica) + Fallback (Robusta)'
    };
  } catch (error) {
    console.error('❌ Greška pri dohvaćanju stvarnih cijena:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

// Generiraj fallback cijene s malim varijacijama (ako API ne radi)
function generateFallbackPrices() {
  const now = new Date();
  const hourOfDay = now.getHours();
  const dayOfWeek = now.getDay();
  const isMarketOpen = dayOfWeek > 0 && dayOfWeek < 6 && hourOfDay >= 9 && hourOfDay < 18;
  
  const prices = {};
  
  Object.entries(BASE_PRICES).forEach(([commodity, { base, volatility }]) => {
    const randomFactor = (Math.random() - 0.5) * 2;
    const price = base + (randomFactor * volatility);
    const dayVariation = volatility * 0.5;
    const high = price + (Math.random() * dayVariation);
    const low = price - (Math.random() * dayVariation);
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
  
  // Označi da su ovo simulirani podaci
  return {
    ...prices,
    isLive: false,
    source: 'Fallback (simulirano)'
  };
}

// API endpoint za burzovne cijene
app.get('/api/market-prices', async (req, res) => {
  const now = Date.now();
  
  // Koristi cache ako je svjež
  if (marketPricesCache && lastMarketFetch && (now - lastMarketFetch < CACHE_DURATION)) {
    return res.json(marketPricesCache);
  }
  
  // Pokušaj dohvatiti stvarne cijene
  const realPrices = await fetchRealMarketPrices();
  
  if (realPrices) {
    marketPricesCache = realPrices;
    console.log('📈 Stvarne burzovne cijene osvježene s Yahoo Finance');
  } else {
    // Fallback na simulirane cijene ako API ne radi
    marketPricesCache = generateFallbackPrices();
    console.log('⚠️ Koristi se fallback cijene (API nedostupan)');
  }
  
  lastMarketFetch = now;
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

// Upload slike kave - upload limiter
app.post('/api/upload/coffee', uploadLimiter, authMiddleware, (req, res) => {
  try {
    const { filename, data, mimeType } = req.body;
    
    if (!filename || !data) {
      return res.status(400).json(ErrorHelpers.validationError([{ field: 'upload', message: 'Nedostaju podaci za upload' }]));
    }
    
    // Validiraj tip datoteke
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (mimeType && !allowedTypes.includes(mimeType)) {
      return res.status(400).json(ErrorHelpers.validationError([{ field: 'mimeType', message: 'Nepodržani format slike' }]));
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
    res.status(500).json(ErrorHelpers.internalError('Greška pri spremanju slike'));
  }
});

// Upload loga brenda - upload limiter
app.post('/api/upload/brand', uploadLimiter, authMiddleware, (req, res) => {
  try {
    const { filename, data, mimeType } = req.body;
    
    if (!filename || !data) {
      return res.status(400).json(ErrorHelpers.validationError([{ field: 'upload', message: 'Nedostaju podaci za upload' }]));
    }
    
    // Validiraj tip datoteke
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (mimeType && !allowedTypes.includes(mimeType)) {
      return res.status(400).json(ErrorHelpers.validationError([{ field: 'mimeType', message: 'Nepodržani format slike' }]));
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
    res.status(500).json(ErrorHelpers.internalError('Greška pri spremanju slike'));
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
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const allowedOrigins = getAllowedOrigins();
  
  console.log(`☕ Mr. Beans Server pokrenut na http://localhost:${PORT}`);
  console.log(`📁 Data folder: ${dataDir}`);
  console.log(`📷 Images folder: ${imagesDir}`);
  console.log(`🌐 CORS: ${NODE_ENV === 'development' ? 'Development mode' : 'Production mode'}`);
  if (allowedOrigins.length > 0) {
    console.log(`   Dozvoljeni origin-i: ${allowedOrigins.join(', ')}`);
  } else if (NODE_ENV === 'production') {
    console.warn(`   ⚠️  Nema dozvoljenih origin-a! Postavite ALLOWED_ORIGINS u .env`);
  }
});

