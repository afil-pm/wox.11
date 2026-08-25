import prisma from "@/lib/db";

interface AddToCartInput {
  userId: string;
  productId: string;
  sizeId: string;
  quantity?: number;
}

interface UpdateCartItemInput {
  userId: string;
  cartItemId: string;
  quantity: number;
}

/**
 * Get a user's cart with all items, products, sizes, and inventory.
 * @param userId - The user ID
 * @returns Cart with items or null if no cart exists
 */
export async function getCart(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { take: 1 },
              variants: {
                include: {
                  sizes: {
                    include: { inventory: true },
                  },
                },
              },
            },
          },
          size: {
            include: { inventory: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Add an item to the user's cart. Creates the cart if it doesn't exist.
 * If the same product+size combination already exists, increments quantity.
 * @param input - Cart item input
 * @returns Updated or created cart
 */
export async function addToCart(input: AddToCartInput) {
  const { userId, productId, sizeId, quantity = 1 } = input;

  // Verify product and size exist
  const size = await prisma.size.findUnique({
    where: { id: sizeId },
    include: { inventory: true },
  });

  if (!size) {
    throw new Error("Size not found");
  }

  if (!size.inventory || size.inventory.quantity < quantity) {
    throw new Error("Insufficient inventory");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.isActive) {
    throw new Error("Product not found or inactive");
  }

  return prisma.$transaction(async (tx) => {
    // Get or create cart
    let cart = await tx.cart.findUnique({ where: { userId } });

    if (!cart) {
      cart = await tx.cart.create({
        data: { userId },
      });
    }

    // Check if item already exists in cart
    const existingItem = await tx.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        sizeId,
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > (size.inventory?.quantity ?? 0)) {
        throw new Error("Insufficient inventory");
      }

      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new item
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          sizeId,
          quantity,
        },
      });
    }

    // Return full cart
    return tx.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 },
                variants: {
                  include: {
                    sizes: { include: { inventory: true } },
                  },
                },
              },
            },
            size: {
              include: { inventory: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  });
}

/**
 * Update the quantity of a cart item.
 * @param input - Update input with userId, cartItemId, and new quantity
 * @returns Updated cart
 */
export async function updateCartItem(input: UpdateCartItemInput) {
  const { userId, cartItemId, quantity } = input;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true, size: { include: { inventory: true } } },
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  if (cartItem.cart.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  if (quantity > (cartItem.size.inventory?.quantity ?? 0)) {
    throw new Error("Insufficient inventory");
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });

  return getCart(userId);
}

/**
 * Remove an item from the user's cart.
 * @param userId - The user ID
 * @param cartItemId - The cart item ID to remove
 * @returns Updated cart
 */
export async function removeFromCart(userId: string, cartItemId: string) {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  if (cartItem.cart.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  return getCart(userId);
}

/**
 * Clear all items from the user's cart.
 * @param userId - The user ID
 * @returns Empty cart
 */
export async function clearCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });

  if (!cart) {
    return null;
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return getCart(userId);
}
