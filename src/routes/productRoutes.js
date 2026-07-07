import express from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public storefront browsing — no login required
router.get('/', getProducts);
router.get('/:id', getProduct);

// ADMIN only for catalog management
router.post('/', authenticate, authorize('ADMIN'), createProduct);
router.put('/:id', authenticate, authorize('ADMIN'), updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteProduct);

export default router;
