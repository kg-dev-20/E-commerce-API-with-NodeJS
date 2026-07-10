import express from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem } from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);

export default router;
