const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');

// Get all suppliers
exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort('-createdAt');
    res.json({ success: true, count: suppliers.length, suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create a new supplier
exports.createSupplier = async (req, res) => {
  try {
    const supplierId = typeof req.body.supplierId === 'string' ? req.body.supplierId.trim() : '';
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!supplierId || !name) return res.status(400).json({ success: false, message: 'Supplier ID and name are required.' });
    const supplier = await Supplier.create({ ...req.body, supplierId, name });
    res.status(201).json({ success: true, supplier });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'This supplier ID already exists. Use a different ID.' });
    console.error('Error creating supplier:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get single supplier
exports.getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, supplier });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, supplier });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    if (supplier.purchaseDue || supplier.purchaseReturnDue) {
      return res.status(409).json({ success: false, message: 'This supplier has outstanding balances. Settle them before deleting the supplier.' });
    }
    const [product, purchase] = await Promise.all([
      Product.exists({ $or: [{ supplierRef: supplier._id }, { supplierName: supplier.name }] }),
      Purchase.exists({ supplierName: supplier.name }),
    ]);
    if (product || purchase) {
      return res.status(409).json({ success: false, message: 'This supplier is linked to products or purchase history and cannot be deleted.' });
    }
    await Supplier.findByIdAndDelete(supplier._id);
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(error.name === 'CastError' ? 400 : 500).json({ success: false, message: error.name === 'CastError' ? 'Invalid supplier ID' : 'Unable to delete supplier. Please try again.' });
  }
};
