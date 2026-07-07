import prisma from '../utils/prisma.js';

// Fetches (or lazily creates) the current user's cart with items + product details.
export async function getCart(req, res, next) {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
        include: { items: { include: { product: true } } },
      });
    }

    const total = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    res.json({ ...cart, total });
  } catch (err) {
    next(err);
  }
}

// Adds a product to the cart, or increments quantity if it's already in there.
export async function addToCart(req, res, next) {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'productId and a positive quantity are required' });
    }

    const product = await prisma.product.findFirst({
      where: { id: Number(productId), isActive: true },
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.user.id } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: Number(productId) } },
    });

    let item;
    if (existingItem) {
      item = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + Number(quantity) },
      });
    } else {
      item = await prisma.cartItem.create({
        data: { cartId: cart.id, productId: Number(productId), quantity: Number(quantity) },
      });
    }

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

// Sets a cart item to an exact quantity (0 removes it).
export async function updateCartItem(req, res, next) {
  try {
    const itemId = Number(req.params.itemId);
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: 'A valid quantity is required' });
    }

    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
    if (!item || item.cart.userId !== req.user.id) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return res.status(204).send();
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: Number(quantity) },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function removeCartItem(req, res, next) {
  try {
    const itemId = Number(req.params.itemId);

    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
    if (!item || item.cart.userId !== req.user.id) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
