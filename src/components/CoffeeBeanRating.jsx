import { motion } from 'framer-motion';

// SVG ikona zrna kave
const CoffeeBeanIcon = ({ filled, onClick, onHover, size = 24 }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    onClick={onClick}
    onMouseEnter={onHover}
    whileHover={{ scale: 1.2 }}
    whileTap={{ scale: 0.9 }}
    className={`cursor-pointer transition-colors duration-200 ${
      filled ? 'text-coffee-dark' : 'text-neutral-300'
    }`}
    fill="currentColor"
  >
    <path d="M12 2C8.5 2 4 6 4 12s4.5 10 8 10 8-4 8-10S15.5 2 12 2zm0 18c-2.5 0-6-3.5-6-8s3.5-8 6-8 6 3.5 6 8-3.5 8-6 8z"/>
    <path d="M12 6c-2 0-4 2.5-4 6s2 6 4 6c.5 0 1-.5 1-1v-10c0-.5-.5-1-1-1z" opacity="0.5"/>
    <path d="M12 4c-.5 0-1 .5-1 1v14c0 .5.5 1 1 1s1-.5 1-1V5c0-.5-.5-1-1-1z"/>
  </motion.svg>
);

// Komponenta za prikaz i odabir ratinga
export default function CoffeeBeanRating({ 
  rating, 
  onChange, 
  readonly = false, 
  size = 24,
  showLabel = false,
  hideLabel = false
}) {
  const handleClick = (value) => {
    if (!readonly && onChange) {
      onChange(value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!hideLabel && (
        <span className="text-xs text-coffee-roast font-medium">Ocjena:</span>
      )}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <CoffeeBeanIcon
            key={value}
            filled={value <= rating}
            onClick={() => handleClick(value)}
            size={size}
          />
        ))}
      </div>
      {showLabel && (
        <span className="ml-1 text-sm text-coffee-roast font-medium">
          {rating}/5
        </span>
      )}
    </div>
  );
}

// Mala verzija za kartice i tablice - sa zrnima kave
export function CoffeeBeanRatingSmall({ rating, size = 16, hideLabel = false }) {
  return (
    <div className="flex items-center gap-1.5">
      {!hideLabel && (
        <span className="text-xs text-coffee-roast font-medium">Ocjena:</span>
      )}
      <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <svg
          key={value}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className={`${value <= rating ? 'text-coffee-dark' : 'text-neutral-300'}`}
          fill="currentColor"
        >
          <path d="M12 2C8.5 2 4 6 4 12s4.5 10 8 10 8-4 8-10S15.5 2 12 2zm0 18c-2.5 0-6-3.5-6-8s3.5-8 6-8 6 3.5 6 8-3.5 8-6 8z"/>
          <path d="M12 6c-2 0-4 2.5-4 6s2 6 4 6c.5 0 1-.5 1-1v-10c0-.5-.5-1-1-1z" opacity="0.5"/>
          <path d="M12 4c-.5 0-1 .5-1 1v14c0 .5.5 1 1 1s1-.5 1-1V5c0-.5-.5-1-1-1z"/>
        </svg>
      ))}
      </div>
    </div>
  );
}

