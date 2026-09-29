// One-off maintainer helper: looks up lat/lng for an institution address via
// Nominatim (OpenStreetMap), so a human can paste verified coordinates into
// db/seed.sql. Not called at runtime by the app — Nominatim's usage policy
// forbids repeated/bulk lookups of the same static addresses on page load
// (max 1 req/s, no bulk geocoding), and a maintainer should always eyeball
// the returned point before trusting it for a government building.
//
// Usage: npm run geocode -- "Bulevardul Aviatorilor nr. 72, Sector 1, București"

const address = process.argv.slice(2).join(' ').trim();

if (!address) {
  console.error('Usage: npm run geocode -- "<adresă instituție>"');
  process.exit(1);
}

const url = new URL('https://nominatim.openstreetmap.org/search');
url.searchParams.set('q', `${address}, România`);
url.searchParams.set('format', 'jsonv2');
url.searchParams.set('limit', '3');

const response = await fetch(url, {
  headers: {
    // Required by Nominatim's usage policy: a descriptive User-Agent identifying the app.
    'User-Agent': 'unde-merg-orientare-civica/1.0 (maintainer geocoding helper)',
  },
});

if (!response.ok) {
  console.error(`Nominatim a răspuns cu status ${response.status}`);
  process.exit(1);
}

const results = await response.json();

if (results.length === 0) {
  console.error('Nicio potrivire găsită. Verifică adresa sau încearcă o formulare mai simplă.');
  process.exit(1);
}

console.log(`Rezultate pentru: "${address}"\n`);
for (const result of results) {
  console.log(`  lat: ${result.lat}, lon: ${result.lon}`);
  console.log(`  adresă găsită: ${result.display_name}`);
  console.log('');
}
console.log('Verifică manual pe hartă înainte să adaugi coordonatele în db/seed.sql.');
