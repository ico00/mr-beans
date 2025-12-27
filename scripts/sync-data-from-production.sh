#!/bin/bash

# Skripta za sinkronizaciju podataka iz produkcije u git
# Koristi se nakon što se dodaju kave online

echo "🔄 Sinkronizacija podataka iz produkcije..."

# Preuzmi podatke s Fly.io servera
fly ssh console -C "cat /app/src/data/coffees.json" > src/data/coffees.json
fly ssh console -C "cat /app/src/data/brands.json" > src/data/brands.json
fly ssh console -C "cat /app/src/data/stores.json" > src/data/stores.json
fly ssh console -C "cat /app/src/data/countries.json" > src/data/countries.json

echo "✅ Podaci sinkronizirani!"
echo "📝 Provjeri promjene s: git diff src/data/"
echo "💾 Commitaj promjene s: git add src/data/ && git commit -m 'Sync podataka iz produkcije'"

