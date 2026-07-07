import prisma from '../utils/prisma.js';

// Public: browse the storefront. Only shows active products.
export async function getProducts(req, res, next) {
  try {
    const { search, categoryId, minPrice, maxPrice } = req.query;

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { categoryId: Number(categoryId) }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: Number(minPrice) }),
          ...(maxPrice && { lte: Number(maxPrice) }),
        },
      }),
    };

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { id: 'asc' },
    });

    res.json(products);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findFirst({
      where: { id, isActive: true },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// ADMIN only
export async function createProduct(req, res, next) {
  try {
    const { sku, name, description, brand, abv, volumeMl, price, stock, imageUrl, categoryId } = req.body;

    if (!sku || !name || price === undefined) {
      return res.status(400).json({ message: 'sku, name and price are required' });
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description,
        brand,
        abv: abv !== undefined ? Number(abv) : undefined,
        volumeMl: volumeMl !== undefined ? Number(volumeMl) : undefined,
        price,
        stock: stock ?? 0,
        imageUrl,
        categoryId: categoryId ? Number(categoryId) : undefined,
      },
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

// ADMIN only
export async function updateProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, description, brand, abv, volumeMl, price, stock, imageUrl, categoryId, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(brand !== undefined && { brand }),
        ...(abv !== undefined && { abv: Number(abv) }),
        ...(volumeMl !== undefined && { volumeMl: Number(volumeMl) }),
        ...(price !== undefined && { price }),
        ...(stock !== undefined && { stock }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(categoryId !== undefined && { categoryId: Number(categoryId) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(product);
  } catch (err) {
    next(err);
  }
}

// ADMIN only — soft delete (deactivate) rather than hard delete, so past orders still
// reference a valid product row.
export async function deleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

