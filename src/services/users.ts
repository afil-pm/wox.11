import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";

interface CreateAddressInput {
  userId: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

interface UpdateUserInput {
  name?: string;
  phone?: string;
  image?: string;
}

/**
 * Get a user by ID with select fields.
 * @param userId - The user ID
 * @returns User data without sensitive fields
 */
export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Update user profile data.
 * @param userId - The user ID
 * @param input - Fields to update
 * @returns Updated user data
 */
export async function updateUser(userId: string, input: UpdateUserInput) {
  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
      role: true,
      updatedAt: true,
    },
  });
}

/**
 * Create a new address for a user.
 * @param input - Address creation input
 * @returns Created address
 */
export async function createAddress(input: CreateAddressInput) {
  const { userId, isDefault, ...addressData } = input;

  // If this is set as default, unset other defaults
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // If this is the user's first address, make it default
  const addressCount = await prisma.address.count({ where: { userId } });
  const shouldBeDefault = addressCount === 0 || isDefault;

  return prisma.address.create({
    data: {
      ...addressData,
      userId,
      isDefault: shouldBeDefault,
    },
  });
}

/**
 * Get all addresses for a user.
 * @param userId - The user ID
 * @returns Array of addresses, ordered by default first
 */
export async function getAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { id: "desc" }],
  });
}

/**
 * Delete an address by ID.
 * @param userId - The user ID (for ownership verification)
 * @param addressId - The address ID to delete
 * @returns Deleted address
 */
export async function deleteAddress(userId: string, addressId: string) {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address) {
    throw new Error("Address not found");
  }

  if (address.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const deleted = await prisma.address.delete({
    where: { id: addressId },
  });

  // If deleted address was default, make the most recent address the default
  if (deleted.isDefault) {
    const mostRecent = await prisma.address.findFirst({
      where: { userId },
      orderBy: { id: "desc" },
    });

    if (mostRecent) {
      await prisma.address.update({
        where: { id: mostRecent.id },
        data: { isDefault: true },
      });
    }
  }

  return deleted;
}
