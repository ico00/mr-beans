# ☕ Mr. Beans - Praćenje cijena kave

Aplikacija za praćenje, usporedbu i analizu cijena omiljenih kava. Pratite kako se cijene mijenjaju kroz vrijeme, usporedite cijene između različitih trgovina i pronađite najbolje ponude.

## 🚀 Pokretanje aplikacije

### Brzi start (preporučeno)

**Na Mac/Linux:**
```bash
cd "Mr. Beans"
npm install
npm start
```

**Na Windows:**
```bash
cd "Mr. Beans"
npm install
npm start
```

Ovo će automatski pokrenuti:
- **Frontend** na `http://localhost:5173`
- **Backend API** na `http://localhost:3001`

### Ručno pokretanje

#### Instalacija
```bash
npm install
```

#### Pokretanje (frontend + backend)
```bash
npm start
```

Ovo će pokrenuti:
- **Frontend** na `http://localhost:5173`
- **Backend API** na `http://localhost:3001`

#### Samo frontend
```bash
npm run dev
```

#### Samo backend
```bash
npm run server
```

#### Production build
```bash
npm run build
npm run production
```

## 📁 Struktura podataka

Svi podaci se spremaju u JSON datoteke u mapi `/src/data`:

- `coffees.json` - Sve kave s detaljima i povijesti cijena
- `brands.json` - Brandovi kave
- `stores.json` - Trgovine gdje se kava kupuje
- `countries.json` - Države proizvođači kave

## ☕ Funkcionalnosti

### 📋 Pregled kava
- Pregled svih kava s filtriranjem i sortiranjem
- Prikaz slika, cijena, ocjena i detalja
- Grid i list view

### 💰 Praćenje cijena
- Povijest cijena po trgovinama
- Grafički prikaz promjena cijena
- Usporedba cijena između različitih kava
- Automatski izračun cijene po kilogramu

### 📊 Analiza
- Statistike (prosječna cijena, ocjena, broj kava)
- Interaktivni grafovi cijena
- Usporedba cijena kroz vrijeme
- Kalkulator cijene espressa

### 🗺️ Interaktivna karta
- Pojas uzgoja kave
- Informacije o državama proizvođačima
- Klik na zemlju za detalje

### 📈 Burzovne cijene
- Live cijene Arabice i Robuste
- Podaci s Yahoo Finance API-ja
- Prikaz promjena i trendova

### 🔐 Admin panel
- Dodavanje, uređivanje i brisanje kava
- Upravljanje brendovima, trgovinama i državama
- Upload slika kava i logotipa brendova
- Sigurna autentikacija s JWT tokenima

## 🛡️ Sigurnost

Aplikacija uključuje napredne sigurnosne značajke:

- **Environment varijable** za secrets (JWT, admin lozinka)
- **Rate limiting** za zaštitu od brute force napada
- **CORS konfiguracija** s whitelistom dozvoljenih domena
- **Helmet.js** security headers
- **Server-side validacija** svih inputa s Joi
- **Error handling** s standardiziranim formatom

## 🎨 Dizajn

- Moderna coffee tema s toplim bojama
- Smooth animacije s Framer Motion
- Responzivan dizajn za sve uređaje
- Glass morphism efekti
- Intuitivno korisničko sučelje

## 📝 Napomene

- Podaci se trajno spremaju u JSON datoteke
- Admin pristup zahtijeva autentikaciju
- U development modu, admin ovlasti su automatski omogućene
- Burzovne cijene se cache-aju 5 minuta

## 🔧 Konfiguracija

### Environment varijable

Kreirajte `.env` fajl u root direktoriju (koristite `.env.example` kao template):

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Security - OBAVEZNO promijeniti u produkciji!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_PASSWORD=your-secure-admin-password-change-this

# CORS (produkcija)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API URLs (opcionalno)
VITE_API_URL=http://localhost:3001/api
```

**⚠️ VAŽNO:** U produkciji, obavezno promijenite `JWT_SECRET` i `ADMIN_PASSWORD`!

## 🌐 Deployment

Aplikacija je spremna za deployment. Backend i frontend se mogu deployati odvojeno ili zajedno.

### Backend (Node.js/Express)
- Render.com
- Railway
- Fly.io (konfiguracija u `fly.toml`)
- Heroku

### Frontend (Vite/React)
- Vercel
- Netlify
- GitHub Pages
- Render.com

Za deployment, postavite environment varijable na hosting servisu i build-ajte frontend s `npm run build`.

## 📚 Tehnologije

### Frontend
- React 19
- Vite
- React Router
- Framer Motion
- Tailwind CSS
- Recharts
- React Hot Toast

### Backend
- Node.js
- Express
- JWT autentikacija
- Joi validacija
- Helmet.js
- Express Rate Limit

## 📊 Statistike

Aplikacija prikazuje:
- Ukupan broj kava
- Prosječnu cijenu
- Prosječnu ocjenu
- Broj različitih vrsta kave

## 🎯 Kalkulator espressa

Izračunajte cijenu jednog espressa na temelju cijene pakiranja i težine. Prilagodite količinu kave po šalici.

## 📖 Dokumentacija

- `ANALIZA_I_POBOLJSANJA.md` - Detaljna analiza aplikacije i predlozi poboljšanja
- `POBOLJSANJA_PRIMJERI.md` - Konkretni primjeri implementacije poboljšanja

---

**Napravite svoju kavu još boljom! ☕✨**
