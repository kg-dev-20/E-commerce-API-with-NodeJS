import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Anyone can browse categories, no login required (public storefront)
router.get('/', getCategories);

// Only ADMIN can manage categories
router.post('/', authenticate, authorize('ADMIN'), createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

export default router;
