const Category = require('../models/Category');
const Product = require('../models/Product');

const getCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  return res.json({ categories });
};

const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    return res.status(201).json({ category });
  } catch (error) {
    return res.status(400).json({ message: 'Error creating category', error: error.message });
  }
};

const updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  return res.json({ category });
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    if (await Product.exists({ category: category._id })) {
      return res.status(409).json({ message: 'This category is used by products. Move those products to another category before deleting it.' });
    }
    await Category.findByIdAndDelete(category._id);
    return res.json({ message: 'Category deleted' });
  } catch (error) {
    return res.status(error.name === 'CastError' ? 400 : 500).json({ message: error.name === 'CastError' ? 'Invalid category ID' : 'Unable to delete category. Please try again.' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
