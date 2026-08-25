import { Prisma, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import prisma from "@/lib/db";

interface OrderItemInput {
  productId: string;
  sizeId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  image?: string;
}

interface CreateOrderInput {
  userId: string;
  addressId: string;
  items: OrderItemInput[];
  subtotal: number;
  discount?: number;
  shippingCost?: number;
  tax?: number;
  total: number;
  notes?: string;
  couponUsageId?: string;
  paymentMethod: PaymentMethod;
}

interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
  notes?: string;
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
}

/**
 * Create a new order with inventory deduction in a transaction.
 * @param input - Order creation input
 * @returns Created order with payment and items
 */
export async function createOrder(input: CreateOrderInput) {
  return prisma.$transaction(async (tx) => {
    // Verify inventory for all items and deduct
    for (const item of input.items) {
      const size = await tx.size.findUnique({
        where: { id: item.sizeId },
        include: { inventory: true },
      });

      if (!size || !size.inventory) {
        throw new Error(`Inventory not found for size ${item.sizeId}`);
      }

      if (size.inventory.quantity < item.quantity) {
        throw new Error(
          `Insufficient inventory for ${item.name} (size: ${item.size}). Available: ${size.inventory.quantity}, Requested: ${item.quantity}`
        );
      }

      await tx.inventory.update({
        where: { id: size.inventory.id },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    // Generate unique order number
    const orderCount = await tx.order.count();
    const orderNumber = `WOX-${String(orderCount + 1001).padStart(6, "0")}`;

    // Create order with items and payment
    const order = await tx.order.create({
      data: {
        orderNumber,
        status: "PENDING",
        subtotal: input.subtotal,
        discount: input.discount ?? 0,
        shippingCost: input.shippingCost ?? 0,
        tax: input.tax ?? 0,
        total: input.total,
        notes: input.notes,
        addressId: input.addressId,
        userId: input.userId,
        couponUsageId: input.couponUsageId,
        items: {
          create: input.items.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            image: item.image,
            productId: item.productId,
          })),
        },
        payment: {
          create: {
            amount: input.total,
            method: input.paymentMethod,
            status: "PENDING",
          },
        },
      },
      include: {
        items: true,
        payment: true,
        address: true,
      },
    });

    return order;
  });
}

/**
 * Get an order by its ID with all related data.
 * @param orderId - The order ID
 * @returns Order with items, payment, address, and shipment
 */
export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { take: 1 },
            },
          },
        },
      },
      payment: true,
      address: true,
      shipment: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
}

/**
 * Get all orders for a user with pagination.
 * @param userId - The user ID
 * @param page - Page number (1-indexed)
 * @param limit - Number of orders per page
 * @returns Paginated orders
 */
export async function getOrdersByUserId(
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 },
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update the status of an order.
 * @param input - Status update input
 * @returns Updated order
 */
export async function updateOrderStatus(input: UpdateOrderStatusInput) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { payment: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Validate status transitions
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["PACKED", "CANCELLED"],
    PACKED: ["SHIPPED"],
    SHIPPED: ["OUT_FOR_DELIVERY"],
    OUT_FOR_DELIVERY: ["DELIVERED"],
    DELIVERED: ["RETURNED"],
    CANCELLED: ["REFUNDED"],
    RETURNED: ["REFUNDED"],
    REFUNDED: [],
  };

  if (!validTransitions[order.status].includes(input.status)) {
    throw new Error(
      `Invalid status transition from ${order.status} to ${input.status}`
    );
  }

  return prisma.order.update({
    where: { id: input.orderId },
    data: {
      status: input.status,
      notes: input.notes ?? order.notes,
    },
    include: {
      items: true,
      payment: true,
      address: true,
    },
  });
}

/**
 * Cancel an order and restore inventory.
 * @param orderId - The order ID to cancel
 * @returns Updated order
 */
export async function cancelOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "CANCELLED") {
      throw new Error("Order is already cancelled");
    }

    if (order.status === "DELIVERED") {
      throw new Error("Cannot cancel a delivered order");
    }

    // Restore inventory for each item
    for (const item of order.items) {
      const orderItemWithProduct = await tx.orderItem.findFirst({
        where: { orderId: orderId, size: item.size },
        include: {
          product: {
            include: {
              variants: {
                include: {
                  sizes: {
                    where: { name: item.size },
                    include: { inventory: true },
                  },
                },
              },
            },
          },
        },
      });

      const inventorySize = orderItemWithProduct?.product.variants
        .flatMap((v) => v.sizes)
        .find((s) => s.name === item.size);

      if (inventorySize?.inventory) {
        await tx.inventory.update({
          where: { id: inventorySize.inventory.id },
          data: { quantity: { increment: item.quantity } },
        });
      }
    }

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
      include: {
        items: true,
        payment: true,
      },
    });

    // Update payment status if it exists
    if (updatedOrder.payment) {
      await tx.payment.update({
        where: { id: updatedOrder.payment.id },
        data: { status: "FAILED" },
      });
    }

    return updatedOrder;
  });
}

/**
 * Get order statistics for admin dashboard.
 * @param startDate - Start date for stats period
 * @param endDate - End date for stats period
 * @returns Order statistics
 */
export async function getOrderStats(
  startDate?: Date,
  endDate?: Date
): Promise<OrderStats> {
  const dateFilter: Prisma.OrderWhereInput = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.gte = startDate;
    if (endDate) dateFilter.createdAt.lte = endDate;
  }

  const [totalOrders, totalRevenue, pendingOrders, deliveredOrders, cancelledOrders] =
    await Promise.all([
      prisma.order.count({ where: dateFilter }),
      prisma.order.aggregate({
        where: { ...dateFilter, status: { notIn: ["CANCELLED", "REFUNDED"] } },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { ...dateFilter, status: "PENDING" } }),
      prisma.order.count({ where: { ...dateFilter, status: "DELIVERED" } }),
      prisma.order.count({ where: { ...dateFilter, status: "CANCELLED" } }),
    ]);

  return {
    totalOrders,
    totalRevenue: totalRevenue._sum.total ?? 0,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    averageOrderValue:
      totalOrders > 0 ? Math.round((totalRevenue._sum.total ?? 0) / totalOrders) : 0,
  };
}
