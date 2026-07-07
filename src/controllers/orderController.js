import prisma from '../utils/prisma.js';

// Customer: view their own order history
export async function getMyOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

export async function getMyOrder(req, res, next) {
  try {
    const id = Number(req.params.id);
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
      include: { items: { include: { product: true } } },
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
}

// Checkout: turns the current cart into an order.
// Requires age verification (enforced by requireAgeVerified middleware on the route).
export async function checkout(req, res, next) {
  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ message: 'shippingAddress is required' });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // Verify stock is still available for every item before committing.
    for (const item of cart.items) {
      if (!item.product.isActive) {
        return res.status(400).json({ message: `${item.product.name} is no longer available` });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${item.product.name}` });
      }
    }

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    // Atomic transaction: create the order + order items, decrement stock for each
    // product, and clear the cart — all or nothing.
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          status: 'PENDING',
          totalAmount,
          shippingAddress,
          ageVerifiedAtCheckout: true,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

// ADMIN: view all orders across all customers
export async function getAllOrders(req, res, next) {
  try {
    const { status } = req.query;

    const orders = await prisma.order.findMany({
      where: { ...(status && { status }) },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (err) {
    next(err);
  }
}

// ADMIN: update order status (e.g. mark as PAID, SHIPPED, DELIVERED, CANCELLED)
export async function updateOrderStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    res.json(order);
  } catch (err) {
    next(err);
  }
}

