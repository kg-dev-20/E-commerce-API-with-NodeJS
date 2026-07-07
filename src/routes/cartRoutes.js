import express from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem } from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Cart requires login (linked to a specific user), but not age verification —
// browsing/holding items in a cart is fine; the age gate applies at checkout.
router.use(authenticate);

router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);

export default router;
