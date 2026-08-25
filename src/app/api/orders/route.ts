import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkoutSchema, orderPaginationSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = {
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
      status: searchParams.get("status") || undefined,
    };

    const parsed = orderPaginationSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { page, limit, status } = parsed.data;
    const skip = (page - 1) * limit;

    const where = {
      userId: user.id,
      ...(status ? { status } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          payment: true,
          address: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ORDERS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { addressId, paymentMethod, notes } = parsed.data;

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: user.id },
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { position: "asc" } },
                variants: { include: { sizes: true } },
              },
            },
            size: { include: { inventory: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    for (const item of cart.items) {
      if (!item.size.inventory || item.size.inventory.quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${item.product.name} (Size: ${item.size.name})`,
          },
          { status: 400 }
        );
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItems = [];

      for (const item of cart.items) {
        const price = item.product.salePrice ?? item.product.basePrice;
        subtotal += price * item.quantity;

        orderItems.push({
          name: item.product.name,
          price,
          quantity: item.quantity,
          size: item.size.name,
          color: item.product.variants[0]?.color ?? null,
          image: item.product.images[0]?.url ?? null,
          productId: item.productId,
        });

        await tx.inventory.update({
          where: { sizeId: item.sizeId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      const shippingCost = subtotal >= 999 ? 0 : 99;
      const tax = Math.round(subtotal * 0.18);
      const total = subtotal + shippingCost + tax;

      const orderNumber = `WOX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          subtotal,
          shippingCost,
          tax,
          total,
          notes,
          addressId,
          userId: user.id,
          items: {
            create: orderItems,
          },
          payment: {
            create: {
              amount: total,
              method: paymentMethod,
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

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return NextResponse.json(
      { message: "Order created successfully", order },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ORDERS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
