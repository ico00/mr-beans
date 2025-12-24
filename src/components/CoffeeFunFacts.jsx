import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee } from 'lucide-react';

const funFacts = [
  {
    id: 1,
    text: "Zrno kave je zapravo koštica crvene bobice (trešnje kave). Tehnički, kava je voćni napitak!"
  },
  {
    id: 2,
    text: "Finci konzumiraju najviše kave po glavi stanovnika na svijetu – prosječni Finac potroši oko 12 kg kave godišnje."
  },
  {
    id: 3,
    text: "Instant kava može poslužiti kao razvijač crno bijelih filmova u kafenol postupku."
  },
  {
    id: 4,
    text: "Prva web kamera napravljena je 1991. na Cambridgeu i snimala je aparat za kavu jer se znanstvenicima nije dalo šetati i provjeravati da li je kava gotova, odnosno koliko je još ostalo."
  },
  {
    id: 5,
    text: "Legenda kaže: Kava je otkrivena u Etiopiji kada je pastir primijetio da koze postaju energičnije nakon jedenja bobica."
  },
  {
    id: 6,
    text: "Najveći proizvođač kave na svijetu je Brazil, koji proizvodi preko trećine svjetske kave."
  }
];

export default function CoffeeFunFacts() {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-transparent to-coffee-cream/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-4">
            Zanimljivosti o kavi
          </h2>
          <p className="text-coffee-roast max-w-2xl mx-auto">
            Okrenite kartice i saznajte zanimljive činjenice o našem omiljenom napitku
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {funFacts.map((fact, index) => (
            <FlipCard key={fact.id} fact={fact} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FlipCard({ fact, index }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="h-64"
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className="relative w-full h-full transition-transform duration-700 cursor-pointer"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front side - Icon */}
        <div
          className="absolute inset-0 w-full h-full glass-card rounded-2xl flex flex-col items-center justify-center bg-gradient-to-br from-coffee-light/90 to-coffee-cream hover:from-coffee-light/40 hover:to-coffee-cream/90 transition-all"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <Coffee className="w-20 h-20 text-coffee-dark mb-2" />
          <span className="text-xs text-coffee-roast font-medium mt-2">Klikni za okretanje</span>
        </div>

        {/* Back side - Text */}
        <div
          className="absolute inset-0 w-full h-full glass-card rounded-2xl flex items-center justify-center p-6 bg-gradient-to-br from-coffee-cream to-coffee-light"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <p className="text-coffee-dark text-center font-medium text-lg leading-relaxed">
            {fact.text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

