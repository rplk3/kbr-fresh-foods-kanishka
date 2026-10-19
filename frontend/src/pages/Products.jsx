import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import HeroSlider from '../components/HeroSlider';
import { productApi, categoryApi } from '../api/services';
import ProductCard from '../components/ProductCard';
import { Search, Filter, SlidersHorizontal, ChevronDown, X, Leaf, PackageSearch } from 'lucide-react';

// Exact category photos — served from /public folder (local, always works)
const CATEGORY_PHOTOS = {
  Banana:    '/cat_banana.png',
  Fruit:     '/cat_fruit.png',
  Fruits:    '/cat_fruit.png',
  Vegetable: '/cat_vegetable.png',
  Vegetables:'/cat_vegetable.png',
  Beverage:  '/cat_beverage.png',
  Beverages:     '/cat_beverage.png',
  'Rice & Grains':'/cat_grain.png',
  Rice:          '/cat_grain.png',
  Grain:         '/cat_grain.png',
  Grains:        '/cat_grain.png',
  OTHERS:        '/cat_others.png',
  fruit:         '/cat_fruit.png',
  vegetable:     '/cat_vegetable.png',
  beverage:      '/cat_beverage.png',
  grain:         '/cat_grain.png',
  other:         '/cat_others.png',
};

// Hero slider images — fresh produce photography
const PRODUCT_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=85',
];

const SORT_OPTIONS = [
  { value: 'default', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A–Z' },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    setSearchParams(params);
  };

  const setSearch = (val) => updateParams({ search: val });
  const setCategory = (val) => updateParams({ category: val });
  const [sort, setSort] = useState('default');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    categoryApi.getAll().then((res) => setCategories(res.data.categories));
  }, []);

  useEffect(() => {
    setLoading(true);
    productApi
      .getAll({ search, category })
      .then((res) => setProducts(res.data.products))
      .finally(() => setLoading(false));
  }, [search, category]);

  const activeCategory = categories.find((c) => c._id === category);

  const sorted = [...products].sort((a, b) => {
    if (sort === 'price_asc') return a.retailPrice - b.retailPrice;
    if (sort === 'price_desc') return b.retailPrice - a.retailPrice;
    if (sort === 'name_asc') return a.name.localeCompare(b.name);
    return 0;
  });

  const getCategoryPhoto = (cat) => {
    if (!cat) return CATEGORY_PHOTOS.Fruit;
    return CATEGORY_PHOTOS[cat.name] || CATEGORY_PHOTOS[cat.type?.toLowerCase()] || CATEGORY_PHOTOS.Fruit;
  };

  return (
    <Layout>
      {/* Page Hero with sliding images */}
      <HeroSlider
        images={PRODUCT_HERO_IMAGES}
        badge={{ icon: <Leaf size={14} className="text-brand-300" />, text: activeCategory ? activeCategory.name : 'All Products' }}
        title={activeCategory ? `Fresh ${activeCategory.name}` : 'KBR Fresh Foods Products'}
        subtitle={
          <>
            Fresh produce sourced daily — bananas, fruits, vegetables &amp; more from Negombo, Sri Lanka.
            {products.length > 0 && ` Showing ${sorted.length} products.`}
          </>
        }
      />

      {/* Search + Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8 flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products (e.g. banana, mango, tomato)..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
          <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="pl-9 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer appearance-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 shrink-0 px-4 py-3 rounded-xl text-sm font-semibold border transition ${
            showFilters || category
              ? 'bg-brand-600 text-white border-brand-600'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-brand-400'
          }`}
        >
          <Filter size={14} />
          {category ? `1 Filter` : 'Filter'}
        </button>
      </div>

      {/* Category Filter Chips — always show 4 category cards */}
      {showFilters && (
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setCategory('')}
              className={`px-5 py-2 rounded-full text-sm font-semibold border transition ${
                !category
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setCategory(c._id === category ? '' : c._id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border transition ${
                  category === c._id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
                }`}
              >
                <img
                  src={getCategoryPhoto(c)}
                  alt={c.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                {c.name}
              </button>
            ))}
          </div>

          {/* Category visual cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setCategory(c._id === category ? '' : c._id)}
                className={`relative overflow-hidden rounded-2xl h-28 text-white text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  category === c._id ? 'ring-4 ring-brand-400 ring-offset-2' : ''
                }`}
              >
                <img
                  src={getCategoryPhoto(c)}
                  alt={c.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="font-bold text-sm leading-tight">{c.name}</p>
                  <p className="text-[10px] text-white/70">
                    {products.filter(p => p.category?._id === c._id || p.category === c._id).length} items
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active filter badge */}
      {(search || category) && (
        <div className="flex items-center gap-3 mb-6 text-sm">
          <span className="text-gray-500">
            {sorted.length} {sorted.length === 1 ? 'result' : 'results'}
            {search && ` for "${search}"`}
            {activeCategory && ` in ${activeCategory.name}`}
          </span>
          <button
            onClick={() => { setSearch(''); setCategory(''); }}
            className="flex items-center gap-1 text-brand-600 font-semibold hover:text-brand-700"
          >
            <X size={13} /> Clear all
          </button>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-gray-50 rounded-3xl p-16 text-center">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-brand-100">
            <PackageSearch size={32} />
          </div>
          <p className="text-gray-500 text-lg font-medium mb-2">No products found</p>
          <p className="text-gray-400 text-sm mb-6">Try adjusting your search or filters.</p>
          <button
            onClick={() => { setSearch(''); setCategory(''); }}
            className="bg-brand-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-700 transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 mb-16">
          {sorted.map((p, idx) => (
            <div key={p._id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.03}s` }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
