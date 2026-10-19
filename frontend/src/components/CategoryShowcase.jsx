import { ArrowRight } from 'lucide-react';

// Category images — served from /public folder (local, always works)
// Fallback gradient shown if image is slow or missing
const CAT_CONFIG = {
  Banana: {
    img: '/cat_banana.png',
    gradient: 'from-yellow-400 to-amber-500',
  },
  Fruit: {
    img: '/cat_fruit.png',
    gradient: 'from-orange-400 to-pink-500',
  },
  Fruits: {
    img: '/cat_fruit.png',
    gradient: 'from-orange-400 to-pink-500',
  },
  Vegetable: {
    img: '/cat_vegetable.png',
    gradient: 'from-green-500 to-emerald-700',
  },
  Vegetables: {
    img: '/cat_vegetable.png',
    gradient: 'from-green-500 to-emerald-700',
  },
  Beverage: {
    img: '/cat_beverage.png',
    gradient: 'from-rose-500 to-pink-600',
  },
  Beverages: {
    img: '/cat_beverage.png',
    gradient: 'from-rose-500 to-pink-600',
  },
  'Rice & Grains': {
    img: '/cat_grain.png',
    gradient: 'from-amber-600 to-stone-700',
  },
  Rice: {
    img: '/cat_grain.png',
    gradient: 'from-amber-600 to-stone-700',
  },
  Grain: {
    img: '/cat_grain.png',
    gradient: 'from-amber-600 to-stone-700',
  },
  Grains: {
    img: '/cat_grain.png',
    gradient: 'from-amber-600 to-stone-700',
  },
  OTHERS: {
    img: '/cat_others.png',
    gradient: 'from-slate-500 to-gray-700',
  },
};

const TYPE_FALLBACK = {
  fruit: CAT_CONFIG.Fruit,
  vegetable: CAT_CONFIG.Vegetable,
  beverage: CAT_CONFIG.Beverage,
  grain: CAT_CONFIG['Rice & Grains'],
  other: CAT_CONFIG.OTHERS,
};

function getCatConfig(cat) {
  if (!cat) return CAT_CONFIG.OTHERS;
  return CAT_CONFIG[cat.name] || TYPE_FALLBACK[cat.type?.toLowerCase()] || CAT_CONFIG.OTHERS;
}

function CategoryCard({ cat, isActive, onClick, delay }) {
  const config = getCatConfig(cat);

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl aspect-[4/3] text-white transition-all hover:-translate-y-1 hover:shadow-xl animate-fade-in-up group ${
        isActive ? 'ring-4 ring-brand-500 ring-offset-2 shadow-xl' : 'shadow-md'
      }`}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Gradient fallback background — always visible beneath image */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />

      {/* Category image — object-cover fills the 4:3 card edge-to-edge */}
      <img
        src={config.img}
        alt={cat.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        onError={(e) => { e.target.style.opacity = '0'; }}
      />

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />

      {isActive && <div className="absolute inset-0 bg-brand-700/25" />}

      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none text-left">
        <p className="font-bold text-base leading-tight drop-shadow">{cat.name}</p>
        {cat.description && (
          <p className="text-[11px] text-white/80 mt-0.5 leading-tight line-clamp-1 drop-shadow">{cat.description}</p>
        )}
      </div>

      {isActive && (
        <div className="absolute top-3 right-3 bg-brand-500 rounded-full p-1">
          <ArrowRight size={12} />
        </div>
      )}
    </button>
  );
}

export default function CategoryShowcase({ categories, activeCategory, onSelect }) {
  if (!categories?.length) return null;

  return (
    <div className="mb-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Shop by Category</h2>
        <p className="text-gray-500 text-sm">Choose from {categories.length} fresh product categories</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 px-2">
        {categories.map((c, idx) => (
          <CategoryCard
            key={c._id}
            cat={c}
            isActive={activeCategory === c._id}
            onClick={() => onSelect(activeCategory === c._id ? '' : c._id)}
            delay={idx * 0.06}
          />
        ))}
      </div>
    </div>
  );
}
