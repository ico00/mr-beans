import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, SlidersHorizontal, Calendar, TrendingUp, Leaf, ChevronDown } from 'lucide-react';
import { useCoffeeData } from '../hooks/useCoffeeData';
import { formatPrice, formatWeight, calculateEspressoPrice } from '../utils/formatters';

export default function EspressoCalculator() {
  const { coffees } = useCoffeeData();
  const espressoCoffees = useMemo(
    () => coffees.filter((c) => c.type !== 'Nespresso kapsula' && c.weightG),
    [coffees]
  );
  const [gramsPerShot, setGramsPerShot] = useState(10);
  const [selectedId, setSelectedId] = useState(() => espressoCoffees[0]?.id ?? '');
  const [cupsPerDay, setCupsPerDay] = useState(1);
  const [isGroundsSuggestionsOpen, setIsGroundsSuggestionsOpen] = useState(false);

  const selectedCoffee = useMemo(
    () => espressoCoffees.find((c) => c.id === selectedId) || espressoCoffees[0] || null,
    [espressoCoffees, selectedId]
  );

  const hasData = selectedCoffee && selectedCoffee.priceEUR && selectedCoffee.weightG;

  const espressoPrice =
    hasData && gramsPerShot > 0
      ? calculateEspressoPrice(selectedCoffee.priceEUR, selectedCoffee.weightG, gramsPerShot)
      : null;

  const shotsPerPack =
    hasData && gramsPerShot > 0
      ? Math.floor(selectedCoffee.weightG / gramsPerShot)
      : null;

  // Godišnji izračuni
  const cupsPerYear = cupsPerDay > 0 ? cupsPerDay * 365 : 0;
  const yearlyCost = espressoPrice && cupsPerYear > 0 
    ? espressoPrice * cupsPerYear 
    : null;

  // Godišnja količina kave u kg
  const yearlyCoffeeKg = cupsPerYear > 0 && gramsPerShot > 0
    ? (gramsPerShot * cupsPerYear) / 1000
    : 0;

  // Godišnji talog u kg (isti kao yearlyCoffeeKg jer je to količina kave koja se potroši)
  const yearlyGroundsKg = yearlyCoffeeKg;

  // Prijedlozi za iskorištavanje taloga
  const groundsSuggestions = [
    {
      title: 'Gnojivo za biljke',
      description: 'Talog kave je odličan izvor dušika i drugih hraniva za biljke. Miješajte ga s tlom ili koristite kao gnojivo oko biljaka.'
    },
    
    {
      title: 'Apsorbira neugodne mirise',
      description: 'Suhi talog kave može apsorbirati neugodne mirise u hladnjaku, ormaru ili automobilu. Stavite ga u mrežicu ili otvorenu posudu.'
    },
    
    {
      title: 'Repelent za insekte',
      description: 'Raspršite talog kave oko biljaka ili u vrtu - može pomoći u odbijanju mrava i drugih insekata.'
    },
    {
      title: 'Kompost',
      description: 'Dodajte talog kave u kompost - ubrzava proces kompostiranja i dodaje hranjive tvari u kompost.'
    }
  ];

  if (!espressoCoffees.length) return null;

  return (
    <section className="py-12 md:py-20 bg-coffee-cream/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-3">
            Kalkulator cijene espressa (nije za one slabijeg srca)
          </h2>
          <p className="text-coffee-roast max-w-2xl mx-auto">
            Odaberite kavu i količinu grama po espressu kako biste vidjeli približnu cijenu jedne šalice.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-coffee-light/30 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-coffee-dark" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-coffee-dark">
                Postavke
              </h3>
              <p className="text-sm text-coffee-roast">
                Brzo izračunajte koliko košta jedna kava iz pakiranja.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Odabir kave */}
            <div>
              <label className="form-label">Kava</label>
              <select
                value={selectedCoffee?.id ?? ''}
                onChange={(e) => setSelectedId(e.target.value)}
                className="form-input"
              >
                {[...espressoCoffees].sort((a, b) => {
                  const nameA = a.brand?.name ? `${a.brand.name} – ${a.name}` : a.name;
                  const nameB = b.brand?.name ? `${b.brand.name} – ${b.name}` : b.name;
                  return nameA.localeCompare(nameB, 'hr');
                }).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.brand?.name ? `${c.brand.name} – ${c.name}` : c.name}
                    {c.weightG ? ` (${formatWeight(c.weightG)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Grami po espressu */}
            <div>
              <label className="form-label">Gramaža po espressu (g)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={6}
                  max={20}
                  step={1}
                  value={gramsPerShot}
                  onChange={(e) => setGramsPerShot(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={1}
                  value={gramsPerShot}
                  onChange={(e) =>
                    setGramsPerShot(
                      Math.min(30, Math.max(1, Number(e.target.value) || 0))
                    )
                  }
                  className="w-20 form-input text-center"
                />
              </div>
              <p className="text-xs text-coffee-roast mt-1">
                Tipično se koristi između 7 g i 10 g kave po espressu.
              </p>
            </div>

            {/* Broj kava dnevno */}
            <div>
              <label className="form-label">Broj kava dnevno</label>
              <input
                type="number"
                min={0}
                max={20}
                step={1}
                value={cupsPerDay}
                onChange={(e) =>
                  setCupsPerDay(
                    Math.min(20, Math.max(0, Number(e.target.value) || 0))
                  )
                }
                className="form-input text-center"
                placeholder="1"
              />
              <p className="text-xs text-coffee-roast mt-1">
                Unesite koliko kava dnevno popijete.
              </p>
            </div>
          </div>

          {selectedCoffee && hasData ? (
            <>
              {/* Osnovni podaci */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="glass-card rounded-xl p-4 flex items-center gap-3">
                  <Coffee className="w-6 h-6 text-coffee-dark" />
                  <div>
                    <p className="text-xs text-coffee-roast">Odabrana kava</p>
                    <p className="text-sm font-semibold text-coffee-dark">
                      {selectedCoffee.brand?.name && (
                        <span className="mr-1">{selectedCoffee.brand.name} –</span>
                      )}
                      {selectedCoffee.name}
                    </p>
                    {selectedCoffee.weightG && (
                      <p className="text-xs text-coffee-roast">
                        Pakiranje: {formatWeight(selectedCoffee.weightG)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="glass-card rounded-xl p-4">
                  <p className="text-xs text-coffee-roast mb-1">
                    Cijena espressa ({gramsPerShot} g)
                  </p>
                  <p className="text-4xl font-bold text-coffee-dark">
                    {espressoPrice ? formatPrice(espressoPrice) : '—'}
                  </p>
                </div>

                <div className="glass-card rounded-xl p-4">
                  <p className="text-xs text-coffee-roast mb-1">
                    Broj espressa iz pakiranja
                  </p>
                  <p className="text-2xl font-bold text-coffee-dark">
                    {shotsPerPack ?? '—'}
                  </p>
                </div>
              </div>

              {/* Godišnji izračuni */}
              {cupsPerDay > 0 && espressoPrice && (
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-coffee-light/30 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-coffee-dark" />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-coffee-dark">
                        Godišnji izračun
                      </h3>
                      <p className="text-sm text-coffee-roast">
                        Koliko košta vaša kava kroz godinu?
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-coffee-light/20 to-coffee-cream/30">
                      <div className="flex items-center gap-3 mb-2">
                        <Coffee className="w-5 h-5 text-coffee-dark" />
                        <p className="text-xs text-coffee-roast">Broj kava godišnje</p>
                      </div>
                      <p className="text-3xl font-bold text-coffee-dark">
                        {cupsPerYear.toLocaleString('hr-HR')}
                      </p>
               
                    </div>

                    <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-coffee-cream/30 to-coffee-light/30">
                      <div className="flex items-center gap-3 mb-2">
                        <Coffee className="w-5 h-5 text-coffee-dark" />
                        <p className="text-xs text-coffee-roast">Kg kave godišnje</p>
                      </div>
                      <p className="text-3xl font-bold text-coffee-dark">
                        {yearlyCoffeeKg > 0 ? yearlyCoffeeKg.toFixed(2).replace('.', ',') + ' kg' : '—'}
                      </p>
                    </div>

                    <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-coffee-dark/10 to-coffee-roast/10">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-coffee-dark" />
                        <p className="text-xs text-coffee-roast">Ukupna godišnja cijena</p>
                      </div>
                      <p className="text-3xl font-bold text-coffee-dark">
                        {yearlyCost ? formatPrice(yearlyCost) : '—'}
                      </p>
       
                    </div>
                  </div>
                </div>
              )}

              {/* Tvornica taloga */}
              {cupsPerDay > 0 && gramsPerShot > 0 && (
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-coffee-dark">
                        Tvornica taloga
                      </h3>
                      <p className="text-sm text-coffee-roast">
                        Koliko godišnje proizvedeš taloga kave?
                      </p>
                    </div>
                  </div>

                  <div className="glass-card rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Leaf className="w-6 h-6 text-green-700" />
                      <p className="text-sm text-coffee-roast font-medium">Godišnji talog</p>
                    </div>
                    <p className="text-2xl font-bold text-green-700 mb-2">
                      {yearlyGroundsKg.toFixed(2).replace('.', ',')} kg
                    </p>
        
                  </div>

                  <div>
                    <button
                      onClick={() => setIsGroundsSuggestionsOpen(!isGroundsSuggestionsOpen)}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-white/30 hover:bg-white/50 transition-colors mb-2"
                    >
                      <h4 className="text-md font-display font-semibold text-coffee-dark">
                        Kako iskoristiti talog kave?
                      </h4>
                      <motion.div
                        animate={{ rotate: isGroundsSuggestionsOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 text-coffee-dark" />
                      </motion.div>
                    </button>
                    
                    <AnimatePresence>
                      {isGroundsSuggestionsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {groundsSuggestions.map((suggestion, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card rounded-xl p-4 bg-white/50 hover:bg-white/70 transition-colors"
                              >
                                <h5 className="text-sm font-semibold text-coffee-dark mb-2">
                                  {suggestion.title}
                                </h5>
                                <p className="text-xs text-coffee-roast leading-relaxed">
                                  {suggestion.description}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-coffee-roast mt-4">
              Za odabranu kavu nedostaju podaci o cijeni ili težini pakiranja.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}


