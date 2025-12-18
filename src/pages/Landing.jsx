import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, TrendingUp, MapPin, Plus, ArrowRight, BarChart3, Star } from 'lucide-react';
import { useCoffeeData } from '../hooks/useCoffeeData';
import CoffeeMap from '../components/CoffeeMap';
import CoffeeMarketPrices from '../components/CoffeeMarketPrices';
import { PriceComparisonChart } from '../components/PriceChart';
import { formatPrice, IMAGES_FOLDER } from '../utils/formatters';

export default function Landing() {
  const { coffees, stats, loading } = useCoffeeData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Coffee className="w-16 h-16 text-coffee-dark" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -right-20 w-96 h-96 bg-coffee-light/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-40 -left-20 w-80 h-80 bg-accent-gold/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold mb-6">
                <span className="text-gradient">Pratite cijene kave</span>
                <br />
                <span className="text-coffee-roast">kao profesionalac</span>
              </h1>
              
              <p className="text-lg md:text-xl text-coffee-roast mb-8 max-w-2xl mx-auto">
                Unesite, uspoređujte i analizirajte cijene vaših omiljenih kava. 
                Vizualizirajte trendove i nikad više ne propustite dobru ponudu.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/coffees" className="btn-primary flex items-center justify-center gap-2 text-lg px-8 py-4">
                  <Coffee className="w-5 h-5" />
                  Pregledaj kave
                </Link>
                <Link to="/add" className="btn-secondary flex items-center justify-center gap-2 text-lg px-8 py-4">
                  <Plus className="w-5 h-5" />
                  Dodaj novu
                </Link>
              </div>
            </motion.div>
          </div>
          
          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <StatCard 
              icon={Coffee}
              value={stats.totalCoffees}
              label="Ukupno kava"
              delay={0}
            />
            <StatCard 
              icon={TrendingUp}
              value={`${formatPrice(stats.averagePrice)}`}
              label="Prosječna cijena"
              delay={0.1}
            />
            <StatCard 
              icon={Star}
              value={stats.averageRating}
              label="Prosječna ocjena"
              delay={0.2}
            />
            <StatCard 
              icon={MapPin}
              value={Object.keys(stats.byType).length}
              label="Vrste kave"
              delay={0.3}
            />
          </motion.div>
        </div>
      </section>

      {/* Live Market Prices Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-transparent to-coffee-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-4">
              Live tržišne cijene
            </h2>
            <p className="text-coffee-roast max-w-2xl mx-auto">
              Pratite aktualne burzovne cijene arabice i robuste u realnom vremenu.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <CoffeeMarketPrices />
          </motion.div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-4">
              Pojas uzgoja kave
            </h2>
            <p className="text-coffee-roast max-w-2xl mx-auto">
              Istražite zemlje iz kojih dolazi vaša kava. Kliknite na zemlju za više informacija.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <CoffeeMap />
          </motion.div>
        </div>
      </section>

      {/* Price Chart Section */}
      {coffees.length > 1 && (
        <section className="py-12 md:py-20 bg-coffee-cream/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-4">
                Usporedba cijena
              </h2>
              <p className="text-coffee-roast max-w-2xl mx-auto">
                Usporedite kako su se cijene vaših omiljenih kava mijenjale kroz vrijeme.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <PriceComparisonChart coffees={coffees} />
            </motion.div>
          </div>
        </section>
      )}

      {/* Recent Coffees Preview */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-2">
                Nedavno dodane kave
              </h2>
              <p className="text-coffee-roast">
                Najnovije kave u vašoj kolekciji
              </p>
            </div>
            <Link 
              to="/coffees"
              className="hidden sm:flex items-center gap-2 text-coffee-dark font-semibold hover:text-coffee-roast transition-colors"
            >
              Pogledaj sve
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coffees.slice(0, 3).map((coffee, index) => (
              <motion.div
                key={coffee.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/coffee/${coffee.id}`}>
                  <div className="coffee-card glass-card rounded-2xl p-6 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-coffee-light/30 to-coffee-cream rounded-xl flex items-center justify-center">
                        <Coffee className="w-8 h-8 text-coffee-dark" />
                      </div>
                      <span className="px-3 py-1 bg-coffee-light/30 rounded-full text-xs font-semibold text-coffee-dark">
                        {coffee.type}
                      </span>
                    </div>
                    
                    <p className="text-sm text-coffee-roast mb-1">{coffee.brand?.name}</p>
                    <h3 className="text-xl font-display font-bold text-coffee-dark mb-3">
                      {coffee.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">{coffee.country?.flag}</span>
                      <span className="text-sm text-coffee-roast">{coffee.country?.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                      <span className="text-2xl font-bold text-coffee-dark">
                        {formatPrice(coffee.priceEUR)}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <div 
                            key={star}
                            className={`w-2 h-2 rounded-full ${
                              star <= coffee.rating ? 'bg-coffee-dark' : 'bg-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
            <Link 
              to="/coffees"
              className="btn-secondary inline-flex items-center gap-2"
            >
              Pogledaj sve kave
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="coffee-gradient rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              {/* Coffee bean pattern */}
              {[...Array(20)].map((_, i) => (
                <Coffee 
                  key={i}
                  className="absolute w-8 h-8"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    transform: `rotate(${Math.random() * 360}deg)`
                  }}
                />
              ))}
            </div>
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Spremni za praćenje cijena?
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Dodajte svoju prvu kavu i počnite pratiti cijene. Jednostavno, brzo i pregledno.
              </p>
              <Link 
                to="/add"
                className="inline-flex items-center gap-2 bg-white text-coffee-dark px-8 py-4 rounded-xl font-semibold hover:bg-coffee-cream transition-colors"
              >
                <Plus className="w-5 h-5" />
                Dodaj prvu kavu
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coffee className="w-5 h-5 text-coffee-dark" />
            <span className="font-display font-bold text-coffee-dark">Mr. Beans</span>
          </div>
          <p className="text-sm text-coffee-roast">
            Praćenje cijena kave © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + delay }}
      className="glass-card rounded-2xl p-6 text-center"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 bg-coffee-light/30 rounded-xl mb-3">
        <Icon className="w-6 h-6 text-coffee-dark" />
      </div>
      <p className="text-2xl md:text-3xl font-bold text-coffee-dark mb-1">{value}</p>
      <p className="text-sm text-coffee-roast">{label}</p>
    </motion.div>
  );
}

