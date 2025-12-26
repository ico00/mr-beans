# 🚀 Fly.io Setup - Environment Varijable

## Postavljanje Environment Varijabli na Fly.io

Na Fly.io, environment varijable se postavljaju kroz `fly secrets` komandu, ne kroz `.env` fajl.

### 1. Postavi JWT Secret

```bash
fly secrets set JWT_SECRET="7DH3T2WCuNFRsxFX812Yd7/Jk7BZgZmTXfUu/Hsf4+0="
```

Ili ako želite generirati novi:
```bash
# Generiraj novi secret
openssl rand -base64 32

# Postavi ga
fly secrets set JWT_SECRET="<generirani-secret>"
```

### 2. Postavi Admin Lozinku

```bash
fly secrets set ADMIN_PASSWORD="VašaSigurnaLozinka123!"
```

**⚠️ VAŽNO:** Zamijenite `VašaSigurnaLozinka123!` s vašom stvarnom lozinkom!

### 3. Postavi NODE_ENV (produkcija)

```bash
fly secrets set NODE_ENV="production"
```

### 4. Postavi CORS Origins (ako imate frontend na drugoj domeni)

```bash
fly secrets set ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

### 5. Provjeri postavljene secrets

```bash
fly secrets list
```

### 6. Restart aplikacije nakon postavljanja secrets

```bash
fly apps restart mr-beans
```

## Kompletna komanda (sve odjednom)

```bash
fly secrets set \
  JWT_SECRET="7DH3T2WCuNFRsxFX812Yd7/Jk7BZgZmTXfUu/Hsf4+0=" \
  ADMIN_PASSWORD="VašaSigurnaLozinka123!" \
  NODE_ENV="production" \
  ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

## Brisanje secrets

Ako trebate obrisati secret:
```bash
fly secrets unset SECRET_NAME
```

## Napomene

- Secrets se postavljaju per aplikaciju
- Nakon postavljanja secrets, aplikacija se automatski restartira
- Secrets su enkriptirani i sigurno pohranjeni na Fly.io
- Ne postavljajte secrets u `fly.toml` fajlu - koristite `fly secrets` komandu

## Provjera da li secrets rade

Nakon postavljanja, provjerite logove:
```bash
fly logs
```

Trebalo bi vidjeti da aplikacija koristi postavljene environment varijable umjesto default vrijednosti.

