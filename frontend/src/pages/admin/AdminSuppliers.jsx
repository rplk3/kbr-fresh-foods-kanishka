import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supplierApi } from '../../api/services';
import { 
  Building2,
  CheckCircle2, XCircle, Search, 
  Download, Plus, Trash2, X
} from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';
import { notify, apiErrorMessage } from '../../utils/notifications';
import { createSubmissionGate } from '../../utils/submissionGate';

const emptySupplier = { supplierId: '', name: '', mobile: '', email: '', address: '', status: 'Active' };

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(emptySupplier);
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [runMutation] = useState(() => createSubmissionGate());
  const dialog = useRef(null);

  useEffect(() => {
    if (mode) dialog.current.showModal();
    else dialog.current.close();
  }, [mode]);

  const openDialog = (nextMode, id = '') => {
    setError('');
    setForm(emptySupplier);
    setSelectedId(id);
    setMode(nextMode);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runMutation(async () => {
      setBusy(true);
      setError('');
      try {
        if (mode === 'create') {
          if (!form.supplierId.trim() || !form.name.trim()) {
            setError('Supplier ID and name are required.');
            return;
          }
          const { data } = await supplierApi.create(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])));
          setSuppliers(previous => [data.supplier, ...previous]);
          setSearch('');
          notify.success('Supplier added successfully.');
        } else {
          if (!selectedId) return;
          await supplierApi.remove(selectedId);
          setSuppliers(previous => previous.filter(supplier => supplier._id !== selectedId));
          notify.success('Supplier deleted successfully.');
        }
        setMode(null);
      } catch (err) {
        setError(apiErrorMessage(err, 'Unable to save this change. Please try again.'));
      } finally {
        setBusy(false);
      }
    });
  };

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await supplierApi.getAll();
      setSuppliers(res.data.suppliers || []);
    } catch (err) {
      console.error('AdminSuppliers load error:', err);
      setLoadError(apiErrorMessage(err, 'Unable to load suppliers. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = suppliers.filter((s) =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.supplierId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const csvData = filtered.map(s => ({
      'Supplier ID': s.supplierId || '',
      'Name': s.name || '',
      'Mobile': s.mobile || '',
      'Email': s.email || '',
      'Purchase Due (Rs)': s.purchaseDue || 0,
      'Return Due (Rs)': s.purchaseReturnDue || 0,
      'Status': s.status || ''
    }));
    exportToCSV(csvData, 'KBR_Suppliers');
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={20} className="text-brand-600" />
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Partners</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage suppliers, balances, and status</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => openDialog('delete')} disabled={loading || suppliers.length === 0} className="ui-btn ui-btn-outline text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800 hover:border-red-300">
            <Trash2 size={16} /> Delete Supplier
          </button>
          <button onClick={() => openDialog('create')} disabled={loading || !!loadError} className="ui-btn ui-btn-primary">
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      {loadError && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{loadError} <button onClick={load} className="font-semibold underline">Retry</button></div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs border-b border-gray-100">Supplier</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs border-b border-gray-100">Contact</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs border-b border-gray-100 text-right">Purchase Due</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs border-b border-gray-100 text-right">Return Due</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs border-b border-gray-100 text-center">Status</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs border-b border-gray-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                    <p className="font-medium text-gray-500">No suppliers found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{s.supplierId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{s.mobile || '—'}</p>
                      <p className="text-gray-500 text-xs">{s.email || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-gray-900">Rs. {s.purchaseDue?.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-gray-900">Rs. {s.purchaseReturnDue?.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        s.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {s.status === 'Active' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openDialog('delete', s._id)} aria-label={`Delete supplier ${s.name}`} title="Delete supplier" className="ui-btn ui-btn-sm ui-btn-ghost text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <dialog ref={dialog} className="ui-modal" data-theme="kbr" aria-labelledby="supplier-dialog-title" onCancel={event => { event.preventDefault(); if (!busy) setMode(null); }}>
        <div className="ui-modal-box bg-white text-gray-900">
          <div className="flex items-center justify-between mb-5">
            <h2 id="supplier-dialog-title" className="text-xl font-bold">{mode === 'create' ? 'Add Supplier' : 'Delete Supplier'}</h2>
            <button type="button" disabled={busy} onClick={() => setMode(null)} aria-label="Close supplier dialog" className="ui-btn ui-btn-sm ui-btn-circle ui-btn-ghost"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={busy} className="space-y-4">
              {mode === 'create' ? <>
                {[
                  ['supplierId', 'Supplier ID', 'text', true], ['name', 'Supplier name', 'text', true],
                  ['mobile', 'Mobile number', 'tel', false], ['email', 'Email', 'email', false], ['address', 'Address', 'text', false],
                ].map(([key, label, type, required]) => <label key={key} className="block text-sm font-semibold text-gray-700">
                  {label}{required ? ' *' : ' (optional)'}
                  <input required={required} type={type} value={form[key]} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))} className="ui-input ui-input-bordered w-full mt-1 bg-white" />
                </label>)}
                <label className="block text-sm font-semibold text-gray-700">Status
                  <select value={form.status} onChange={event => setForm(previous => ({ ...previous, status: event.target.value }))} className="ui-select ui-select-bordered w-full mt-1 bg-white"><option>Active</option><option>Inactive</option></select>
                </label>
              </> : <>
                <label className="block text-sm font-semibold text-gray-700">Supplier to delete
                  <select required value={selectedId} onChange={event => { setSelectedId(event.target.value); setError(''); }} className="ui-select ui-select-bordered w-full mt-1 bg-white">
                    <option value="">Select a supplier…</option>
                    {suppliers.map(supplier => <option key={supplier._id} value={supplier._id}>{supplier.name} ({supplier.supplierId})</option>)}
                  </select>
                </label>
                <p className="text-sm text-gray-600">Deleting this supplier is permanent. Suppliers with outstanding balances, linked products, or purchase history cannot be deleted.</p>
              </>}
            </fieldset>
            {error && <p role="alert" className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error}</p>}
            <div className="ui-modal-action">
              <button type="button" disabled={busy} onClick={() => setMode(null)} className="ui-btn ui-btn-ghost">Cancel</button>
              <button type="submit" disabled={busy || (mode === 'delete' && !selectedId)} className={`ui-btn ${mode === 'create' ? 'ui-btn-primary' : 'bg-red-600 text-white hover:bg-red-700 border-red-600'}`}>
                {busy ? 'Saving…' : mode === 'create' ? 'Add Supplier' : 'Delete Supplier'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </AdminLayout>
  );
}
