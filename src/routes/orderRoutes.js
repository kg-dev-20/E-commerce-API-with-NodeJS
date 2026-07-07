import express from 'express';
import { getMyOrders, getMyOrder, checkout, getAllOrders, updateOrderStatus } from '../controllers/orderController.js';
import { authenticate, authorize, requireAgeVerified } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Customer's own orders
router.get('/my', getMyOrders);
router.get('/my/:id', getMyOrder);

// Checkout requires both login AND age verification
router.post('/checkout', requireAgeVerified, checkout);

// Admin: manage all orders
router.get('/', authorize('ADMIN'), getAllOrders);
router.put('/:id/status', authorize('ADMIN'), updateOrderStatus);

export default router;
