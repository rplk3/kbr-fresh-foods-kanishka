import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import HeroSlider from '../components/HeroSlider';
import { storeApi } from '../api/services';
import { MapPin, Phone, Clock, Store, ChevronRight, Package } from 'lucide-react';

// Real store photos — generated and saved in /public
const STORE_IMAGES_BY_TYPE = {
  'KBR Retail': 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&fit=crop&q=80',
  'Keells': '/keells_store.png',
  'Food City': '/foodcity_store.png',
};

// Per-store banner: interior shots for detail view
const STORE_BANNER_BY_TYPE = {
  'KBR Retail': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&fit=crop&q=80',
  'Keells': '/keells_interior.png',
  'Food City': '/foodcity_interior.png',
};

// Hero slider images — store & retail photography
const STORE_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1600&q=85',
];

// Helper: thumbnail for list card
const getStoreThumb = (store) => STORE_IMAGES_BY_TYPE[store.type] || STORE_IMAGES_BY_TYPE['KBR Retail'];
// Helper: banner for detail panel
const getStoreBanner = (store) => STORE_BANNER_BY_TYPE[store.type] || STORE_BANNER_BY_TYPE['KBR Retail'];

const TYPE_COLORS = {
  'KBR Retail': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', accent: '#16a34a' },
  'Keells': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', accent: '#2563eb' },
  'Food City': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', accent: '#ea580c' },
};

// Simple static map using OpenStreetMap (no API key needed)
function StaticMapIframe({ lat, lng, name }) {
  const zoom = 15;
  const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.008},${lng+0.01},${lat+0.008}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <iframe
      width="100%"
      height="300"
      frameBorder="0"
      scrolling="no"
      marginHeight="0"
      marginWidth="0"
      src={url}
      title={name}
      className="rounded-2xl w-full"
      loading="lazy"
    />
  );
}

export default function StoreLocator() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    storeApi.getAll()
      .then((res) => { setStores(res.data.stores || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filterTypes = ['All', 'KBR Retail', 'Keells', 'Food City'];

  const displayed = stores.filter((s) => {
    const matchType = filter === 'All' || s.type === filter;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <Layout>
      {/* Hero with sliding store images */}
      <HeroSlider
        images={STORE_HERO_IMAGES}
        badge={{ icon: <MapPin size={14} />, text: stores.length > 0 ? `${stores.length} Locations across Negombo` : '7 Locations across Negombo' }}
        title="Find a Store Near You"
        subtitle="KBR Fresh Foods supplies Keells Super, Food City, and operates our own retail stores across Negombo, Sri Lanka."
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by store name or area..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <div className="flex gap-2 flex-wrap">
          {filterTypes.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === t
                  ? 'bg-brand-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Store List */}
          <div className="lg:col-span-1 space-y-4">
            {displayed.length === 0 && (
              <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-400">
                <Store size={32} className="mx-auto mb-2" />
                <p>No stores found.</p>
              </div>
            )}
            {displayed.map((store) => {
              const colors = TYPE_COLORS[store.type] || TYPE_COLORS['KBR Retail'];
              const isSelected = selected?._id === store._id;
              return (
                <div
                  key={store._id}
                  onClick={() => setSelected(store)}
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition-all hover:shadow-lg ${
                    isSelected ? `${colors.border} shadow-lg bg-white` : 'border-gray-100 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={getStoreThumb(store)}
                      alt={store.type}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          {store.type}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mt-1 text-sm leading-tight">{store.name}</h3>
                      <p className="text-gray-400 text-xs mt-1 flex items-start gap-1">
                        <MapPin size={11} className="mt-0.5 flex-shrink-0" /> {store.address}
                      </p>
                      {store.phone && (
                        <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                          <Phone size={11} /> {store.phone}
                        </p>
                      )}
                      {store.openHours && (
                        <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                          <Clock size={11} /> {store.openHours}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className={`text-gray-300 flex-shrink-0 mt-1 transition-transform ${isSelected ? 'rotate-90 text-brand-500' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Store Detail / Map */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-soft sticky top-24">
                {/* Store banner */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getStoreBanner(selected)}
                    alt={selected.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm`}>
                      {selected.type}
                    </span>
                    <h2 className="text-xl font-bold mt-1">{selected.name}</h2>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-brand-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Address</div>
                        <div className="text-sm text-gray-700 font-medium">{selected.address}</div>
                      </div>
                    </div>
                    {selected.phone && (
                      <div className="flex items-start gap-2">
                        <Phone size={16} className="text-brand-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Phone</div>
                          <a href={`tel:${selected.phone}`} className="text-sm text-brand-700 font-medium hover:underline">{selected.phone}</a>
                        </div>
                      </div>
                    )}
                    {selected.openHours && (
                      <div className="flex items-start gap-2">
                        <Clock size={16} className="text-brand-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Open Hours</div>
                          <div className="text-sm text-gray-700 font-medium">{selected.openHours}</div>
                        </div>
                      </div>
                    )}
                    {selected.inventory?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Package size={16} className="text-brand-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">KBR Products</div>
                          <div className="text-sm text-gray-700 font-medium">{selected.inventory.length} items stocked</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {selected.description && (
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">{selected.description}</p>
                  )}

                  {/* Inventory preview */}
                  {selected.inventory?.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Package size={15} /> KBR Products Available at this Store
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selected.inventory.slice(0, 12).map((item) => (
                          item.product && (
                            <span key={item.product._id || item.product} className="bg-green-50 text-green-800 text-xs font-medium px-3 py-1 rounded-full border border-green-200">
                              {item.product.name || 'Product'} — {item.stock} {item.product.unit || 'units'}
                            </span>
                          )
                        ))}
                        {selected.inventory.length > 12 && (
                          <span className="bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1 rounded-full">
                            +{selected.inventory.length - 12} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Map */}
                  <div className="rounded-2xl overflow-hidden border border-gray-100">
                    <StaticMapIframe
                      lat={selected.location.lat}
                      lng={selected.location.lng}
                      name={selected.name}
                    />
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selected.name + ', ' + selected.address + ', Sri Lanka')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold py-3 rounded-2xl transition"
                  >
                    <MapPin size={16} /> Get Directions on Google Maps
                  </a>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-gradient-to-br from-brand-50 to-green-50 rounded-3xl flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-brand-200">
                <MapPin size={48} className="text-brand-400 mb-4" />
                <h3 className="text-xl font-bold text-brand-800 mb-2">Select a store</h3>
                <p className="text-brand-600 text-sm max-w-xs">
                  Click any store from the list to see its location, hours, phone number, and KBR product availability.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
