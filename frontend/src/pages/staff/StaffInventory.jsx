import { useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { productApi, categoryApi } from '../../api/services';
import { getCategoryTheme } from '../../utils/categoryTheme';
import { 
  AlertTriangle, Clock, Plus, X, Download, 
  Search, Package, Trash2, Edit2
} from 'lucide-react';
import { downloadInventoryPDF } from '../../utils/pdfInvoice';
import { confirmAction } from '../../utils/confirmAction';
import { notify, notifyApiError } from '../../utils/notifications';
import { createSubmissionGate } from '../../utils/submissionGate';

const emptyForm = {
  name: '', category: '', unit: 'kg', stockQuantity: 0, lowStockThreshold: 10,
  retailPrice: '', wholesalePrice: '', minWholesaleQty: 20, supplierName: '', expiryDate: '', isPerishable: true,
  images: [],
};

const CATEGORY_TYPES = ['fruit', 'vegetable', 'dairy', 'grain', 'spice', 'bakery', 'beverage', 'seafood', 'other'];

export default function StaffInventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'other', description: '' });
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [showDeleteCategory, setShowDeleteCategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const deleteDialog = useRef(null);
  const [runCategoryDelete] = useState(() => createSubmissionGate());

  useEffect(() => {
    if (showDeleteCategory) deleteDialog.current.showModal();
    else deleteDialog.current.close();
  }, [showDeleteCategory]);

  const load = async () => {
    setLoadError(null);
    try {
      const [prodRes, lowRes, expRes] = await Promise.all([
        productApi.getAll({ limit: 500 }),
        productApi.lowStock(),
        productApi.expiring(),
      ]);
      setProducts(prodRes.data.products || []);
      setLowStock(lowRes.data.products || []);
      setExpiring(expRes.data.products || []);
    } catch (err) {
      console.error('StaffInventory load error:', err);
      setLoadError(err?.response?.data?.message || 'Failed to load inventory data. Please refresh.');
    }
  };

  useEffect(() => {
    categoryApi.getAll().then((res) => setCategories(res.data.categories));
    load();
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, category: p.category?._id, unit: p.unit, stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold, retailPrice: p.retailPrice, wholesalePrice: p.wholesalePrice,
      minWholesaleQty: p.minWholesaleQty, supplierName: p.supplierName || '',
      expiryDate: p.expiryDate ? p.expiryDate.slice(0, 10) : '', isPerishable: p.isPerishable,
      images: p.images || [],
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, stockQuantity: Number(form.stockQuantity), retailPrice: Number(form.retailPrice), wholesalePrice: Number(form.wholesalePrice), minWholesaleQty: Number(form.minWholesaleQty), lowStockThreshold: Number(form.lowStockThreshold) };
    if (editingId) await productApi.update(editingId, payload);
    else await productApi.create(payload);
    setShowForm(false);
    load();
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const res = await categoryApi.create(categoryForm);
    setCategories([...categories, res.data.category]);
    setCategoryForm({ name: '', type: 'other', description: '' });
    setShowCategoryForm(false);
  };

  const handleDeleteCategory = category => runCategoryDelete(async () => {
    if (user?.role !== 'admin') return;
    setDeletingCategory(category._id);
    try {
      if (!await confirmAction({ title: `Delete ${category.name}?`, text: 'This permanently removes the category. Products using it must first be moved to another category.', confirmButtonText: 'Delete category' })) return;
      await categoryApi.remove(category._id);
      setCategories(previous => previous.filter(item => item._id !== category._id));
      setForm(previous => previous.category === category._id ? { ...previous, category: '' } : previous);
      notify.success('Category deleted successfully.');
    } catch (error) {
      notifyApiError(error, 'Unable to delete category. Please try again.');
    } finally {
      setDeletingCategory(null);
    }
  });

  const submitDeleteCategory = event => {
    event.preventDefault();
    const category = categories.find(item => item._id === selectedCategoryId);
    if (!category) return;
    deleteDialog.current.close();
    setShowDeleteCategory(false);
    setSelectedCategoryId('');
    void handleDeleteCategory(category);
  };

  const filteredProducts = products.filter(p => 
    !search || (p.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
    (p.category?.name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const LayoutWrapper = user?.role === 'admin' ? AdminLayout : Layout;

  return (
    <LayoutWrapper>
      {/* Error Banner */}
      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0 text-red-500" />
          <span className="text-sm font-medium">{loadError}</span>
          <button onClick={load} className="ml-auto text-xs font-bold underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package size={20} className="text-brand-600" />
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Inventory</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track stock levels, retail & wholesale pricing</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => downloadInventoryPDF(products)} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <Download size={16} /> Export PDF
          </button>
          <button onClick={() => setShowCategoryForm(true)} className="flex items-center gap-2 bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <Plus size={16} /> Category
          </button>
          {user?.role === 'admin' && <button onClick={() => setShowDeleteCategory(true)} disabled={!categories.length || !!deletingCategory} className="ui-btn ui-btn-outline text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800 hover:border-red-300">
            <Trash2 size={16} /> Delete Category
          </button>}
          <button onClick={openNew} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {(lowStock.length > 0 || expiring.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {lowStock.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm flex gap-4">
              <div className="bg-amber-100 p-2 rounded-full shrink-0 h-fit">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-amber-900 font-bold mb-1">Low Stock Alerts ({lowStock.length})</h3>
                <div className="space-y-1">
                  {lowStock.slice(0, 3).map((p) => (
                    <p key={p._id} className="text-sm text-amber-700"><span className="font-semibold">{p.name}:</span> {p.stockQuantity}{p.unit} remaining</p>
                  ))}
                  {lowStock.length > 3 && <p className="text-xs text-amber-600 font-bold mt-1">+{lowStock.length - 3} more</p>}
                </div>
              </div>
            </div>
          )}
          {expiring.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm flex gap-4">
              <div className="bg-red-100 p-2 rounded-full shrink-0 h-fit">
                <Clock size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-red-900 font-bold mb-1">Expiring Soon ({expiring.length})</h3>
                <div className="space-y-1">
                  {expiring.slice(0, 3).map((p) => (
                    <p key={p._id} className="text-sm text-red-700">
                      <span className="font-semibold">{p.name}:</span> expires {new Date(p.expiryDate).toLocaleDateString()}
                    </p>
                  ))}
                  {expiring.length > 3 && <p className="text-xs text-red-600 font-bold mt-1">+{expiring.length - 3} more</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 flex-1 max-w-2xl">
            {categories.map((c) => {
              const theme = getCategoryTheme(c.type);
              const Icon = theme.icon;
              return (
                <span key={c._id} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${theme.chip} cursor-pointer hover:shadow-sm transition-all inline-flex items-center gap-1.5`}>
                  {Icon && <Icon size={14} className="shrink-0" />} {c.name}
                </span>
              );
            })}
          </div>
          
          {/* Search */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs border-b border-gray-100">Product Details</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs border-b border-gray-100">Stock Level</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs border-b border-gray-100">Costs & Prices</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs border-b border-gray-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={20}/></div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-brand-700 transition-colors">{p.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{p.itemCode || 'No Code'} • {p.category?.name || 'Uncategorized'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${p.stockQuantity <= p.lowStockThreshold ? 'text-amber-600' : 'text-gray-900'}`}>
                        {p.stockQuantity}
                      </span>
                      <span className="text-gray-500 text-xs">{p.unit}</span>
                      {p.stockQuantity <= p.lowStockThreshold && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Low</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">Buy: <span className="font-semibold text-gray-900">Rs. {p.purchasePrice || 0}</span></span>
                      <span className="text-xs text-gray-500">Retail: <span className="font-semibold text-gray-900">Rs. {p.retailPrice}</span></span>
                      <span className="text-xs text-gray-500">Wholesale: <span className="font-semibold text-gray-900">Rs. {p.wholesalePrice}</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => openEdit(p)} 
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:text-brand-600 hover:bg-brand-50 border border-gray-100 transition-colors"
                      title="Edit Product"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                    <Package size={40} className="mx-auto text-gray-200 mb-3" />
                    <p>No products found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {user?.role === 'admin' && <dialog ref={deleteDialog} className="ui-modal" data-theme="kbr" aria-labelledby="delete-category-title" onCancel={() => setShowDeleteCategory(false)}>
        <div className="ui-modal-box bg-white text-gray-900">
          <div className="flex items-center justify-between mb-5">
            <h2 id="delete-category-title" className="text-xl font-bold">Delete Category</h2>
            <button type="button" onClick={() => setShowDeleteCategory(false)} aria-label="Close category dialog" className="ui-btn ui-btn-sm ui-btn-circle ui-btn-ghost"><X size={18} /></button>
          </div>
          <form onSubmit={submitDeleteCategory} className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">Category to delete
              <select required value={selectedCategoryId} onChange={event => setSelectedCategoryId(event.target.value)} className="ui-select ui-select-bordered w-full mt-1 bg-white">
                <option value="">Select a category…</option>
                {categories.map(category => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </label>
            <p className="text-sm text-gray-600">Products using the category must be moved to another category before it can be deleted.</p>
            <div className="ui-modal-action">
              <button type="button" onClick={() => setShowDeleteCategory(false)} className="ui-btn ui-btn-ghost">Cancel</button>
              <button type="submit" disabled={!selectedCategoryId} className="ui-btn bg-red-600 text-white hover:bg-red-700 border-red-600">Delete Category</button>
            </div>
          </form>
        </div>
      </dialog>}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display font-bold text-xl text-gray-900">New Category</h2>
              <button onClick={() => setShowCategoryForm(false)} className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category Name</label>
                <input required placeholder="e.g. Exotic Fruits" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category Type</label>
                <select value={categoryForm.type} onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all appearance-none cursor-pointer">
                  {CATEGORY_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                <input placeholder="Optional description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
              </div>
              <div className="pt-2">
                <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up custom-scrollbar">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-2 border-b border-gray-50">
              <h2 className="font-display font-bold text-xl text-gray-900">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-colors"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
                  <input required placeholder="e.g. Organic Carrots" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all appearance-none cursor-pointer bg-white">
                    <option value="">Select category...</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all appearance-none cursor-pointer bg-white">
                    {['kg', 'g', 'unit', 'bunch', 'crate', 'l', 'ml', 'pack', 'dozen'].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Stock</label>
                  <input type="number" min="0" required value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Low Stock Alert At</label>
                  <input type="number" min="0" required value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 mt-5">
                <h3 className="font-bold text-gray-800 mb-4">Pricing</h3>
                <div className="grid md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Retail Price (Rs.)</label>
                    <input type="number" min="0" required value={form.retailPrice} onChange={(e) => setForm({ ...form, retailPrice: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Wholesale Price (Rs.)</label>
                    <input type="number" min="0" required value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Wholesale Qty</label>
                    <input type="number" min="1" required value={form.minWholesaleQty} onChange={(e) => setForm({ ...form, minWholesaleQty: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 mt-5">
                <h3 className="font-bold text-gray-800 mb-4">Additional Details</h3>
                <div className="grid md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Supplier Name (Optional)</label>
                    <input placeholder="e.g. Green Farms" value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">
                      Expiry Date
                      <label className="flex items-center gap-1.5 text-[10px] normal-case cursor-pointer">
                        <input type="checkbox" checked={form.isPerishable} onChange={(e) => setForm({ ...form, isPerishable: e.target.checked, expiryDate: e.target.checked ? form.expiryDate : '' })} className="rounded text-brand-600 focus:ring-brand-500" />
                        Perishable?
                      </label>
                    </label>
                    <input type="date" disabled={!form.isPerishable} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Image URL</label>
                  <input 
                    placeholder="https://images.unsplash.com/..." 
                    value={form.images[0] || ''} 
                    onChange={(e) => setForm({ ...form, images: [e.target.value] })} 
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all mb-3" 
                  />
                  {form.images[0] && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm relative group">
                      <img src={form.images[0]} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setForm({...form, images: []})} className="text-white bg-red-500/90 p-2 rounded-full hover:bg-red-600 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-gray-50">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-sm">
                  {editingId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}
