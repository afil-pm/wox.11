import { PrismaClient, Category } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const customerPasswordHash = await bcrypt.hash("customer123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@wox11.com" },
    update: {},
    create: {
      email: "admin@wox11.com",
      name: "WOX Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@wox11.com" },
    update: {},
    create: {
      email: "customer@wox11.com",
      name: "Test Customer",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
      emailVerified: new Date(),
    },
  });

  console.log("Created users:", { admin: admin.id, customer: customer.id });

  const categories = [
    { name: "Men's Shirts", slug: "mens-shirts", gender: "men" },
    { name: "Men's T-Shirts", slug: "mens-t-shirts", gender: "men" },
    { name: "Men's Pants", slug: "mens-pants", gender: "men" },
    { name: "Boys' Shirts", slug: "boys-shirts", gender: "boys" },
    { name: "Boys' T-Shirts", slug: "boys-t-shirts", gender: "boys" },
    { name: "Boys' Pants", slug: "boys-pants", gender: "boys" },
  ];

  const createdCategories = await Promise.all(
    categories.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    )
  );

  console.log("Created categories:", createdCategories.length);

  const categoryMap: Record<string, string> = Object.fromEntries(
    createdCategories.map((c: Category) => [c.slug, c.id])
  );

  const products = [
    {
      name: "Classic Oxford Shirt",
      slug: "classic-oxford-shirt",
      description:
        "Timeless oxford shirt crafted from premium cotton. Perfect for both casual and semi-formal occasions.",
      basePrice: 1999,
      salePrice: 1499,
      sku: "WOX-SH-M-001",
      categorySlug: "mens-shirts",
      isFeatured: true,
    },
    {
      name: "Slim Fit Denim Shirt",
      slug: "slim-fit-denim-shirt",
      description:
        "Modern slim fit denim shirt with a comfortable stretch. A wardrobe essential.",
      basePrice: 2299,
      salePrice: null,
      sku: "WOX-SH-M-002",
      categorySlug: "mens-shirts",
      isFeatured: false,
    },
    {
      name: "Linen Blend Summer Shirt",
      slug: "linen-blend-summer-shirt",
      description:
        "Breathable linen blend shirt designed for the Indian summer. Lightweight and stylish.",
      basePrice: 2499,
      salePrice: 1999,
      sku: "WOX-SH-M-003",
      categorySlug: "mens-shirts",
      isFeatured: true,
    },
    {
      name: "Printed Casual Shirt",
      slug: "printed-casual-shirt",
      description:
        "Bold printed shirt with a relaxed fit. Stand out from the crowd.",
      basePrice: 1799,
      salePrice: 1399,
      sku: "WOX-SH-M-004",
      categorySlug: "mens-shirts",
      isFeatured: false,
    },
    {
      name: "Solid Regular Fit Shirt",
      slug: "solid-regular-fit-shirt",
      description:
        "Versatile solid shirt in regular fit. Dress it up or down.",
      basePrice: 1599,
      salePrice: null,
      sku: "WOX-SH-M-005",
      categorySlug: "mens-shirts",
      isFeatured: false,
    },
    {
      name: "Essential Crew Neck Tee",
      slug: "essential-crew-neck-tee",
      description:
        "Soft cotton crew neck t-shirt. The perfect everyday basic.",
      basePrice: 799,
      salePrice: 599,
      sku: "WOX-TS-M-001",
      categorySlug: "mens-t-shirts",
      isFeatured: true,
    },
    {
      name: "V-Neck Slim Tee",
      slug: "v-neck-slim-tee",
      description:
        "Sleek v-neck t-shirt with a slim fit silhouette. Minimalist design.",
      basePrice: 899,
      salePrice: null,
      sku: "WOX-TS-M-002",
      categorySlug: "mens-t-shirts",
      isFeatured: false,
    },
    {
      name: "Graphic Print Tee",
      slug: "graphic-print-tee",
      description:
        "Bold graphic print t-shirt made from 100% organic cotton.",
      basePrice: 999,
      salePrice: 799,
      sku: "WOX-TS-M-003",
      categorySlug: "mens-t-shirts",
      isFeatured: true,
    },
    {
      name: "Striped Polo Tee",
      slug: "striped-polo-tee",
      description:
        "Classic striped polo with a comfortable ribbed collar.",
      basePrice: 1299,
      salePrice: null,
      sku: "WOX-TS-M-004",
      categorySlug: "mens-t-shirts",
      isFeatured: false,
    },
    {
      name: "Athletic Fit Joggers",
      slug: "athletic-fit-joggers",
      description:
        "Performance joggers with tapered fit. Great for gym or casual wear.",
      basePrice: 1999,
      salePrice: 1499,
      sku: "WOX-PN-M-001",
      categorySlug: "mens-pants",
      isFeatured: true,
    },
    {
      name: "Slim Fit Chinos",
      slug: "slim-fit-chinos",
      description:
        "Tailored slim fit chinos in premium cotton twill. Office-ready comfort.",
      basePrice: 2199,
      salePrice: null,
      sku: "WOX-PN-M-002",
      categorySlug: "mens-pants",
      isFeatured: false,
    },
    {
      name: "Relaxed Fit Jeans",
      slug: "relaxed-fit-jeans",
      description:
        "Comfortable relaxed fit jeans with a classic wash. Everyday durability.",
      basePrice: 2499,
      salePrice: 1999,
      sku: "WOX-PN-M-003",
      categorySlug: "mens-pants",
      isFeatured: true,
    },
    {
      name: "Regular Fit Cotton Pants",
      slug: "regular-fit-cotton-pants",
      description:
        "All-day comfort cotton pants in a regular fit. Breathable and easy to wear.",
      basePrice: 1799,
      salePrice: null,
      sku: "WOX-PN-M-004",
      categorySlug: "mens-pants",
      isFeatured: false,
    },
    {
      name: "Checkered Shirt",
      slug: "boys-checkered-shirt",
      description:
        "Fun checkered shirt for boys. Durable fabric that handles playtime.",
      basePrice: 1299,
      salePrice: 999,
      sku: "WOX-SH-B-001",
      categorySlug: "boys-shirts",
      isFeatured: false,
    },
    {
      name: "Formal School Shirt",
      slug: "formal-school-shirt",
      description:
        "Crisp formal shirt perfect for school uniforms. Easy-care fabric.",
      basePrice: 999,
      salePrice: null,
      sku: "WOX-SH-B-002",
      categorySlug: "boys-shirts",
      isFeatured: false,
    },
    {
      name: "Color Block Tee",
      slug: "boys-color-block-tee",
      description:
        "Vibrant color block t-shirt for boys. Soft and stretchy cotton blend.",
      basePrice: 699,
      salePrice: 499,
      sku: "WOX-TS-B-001",
      categorySlug: "boys-t-shirts",
      isFeatured: true,
    },
    {
      name: "Superhero Print Tee",
      slug: "boys-superhero-print-tee",
      description:
        "Fun superhero themed t-shirt. Made with fade-resistant prints.",
      basePrice: 799,
      salePrice: 599,
      sku: "WOX-TS-B-002",
      categorySlug: "boys-t-shirts",
      isFeatured: false,
    },
    {
      name: "Stretch Denim Pants",
      slug: "boys-stretch-denim-pants",
      description:
        "Durable stretch denim pants for active boys. Reinforced knees.",
      basePrice: 1499,
      salePrice: 1199,
      sku: "WOX-PN-B-001",
      categorySlug: "boys-pants",
      isFeatured: false,
    },
    {
      name: "Elastic Waist Joggers",
      slug: "boys-elastic-waist-joggers",
      description:
        "Comfortable joggers with elastic waistband. Perfect for play and school.",
      basePrice: 1199,
      salePrice: 899,
      sku: "WOX-PN-B-002",
      categorySlug: "boys-pants",
      isFeatured: true,
    },
  ];

  const createdProducts = await Promise.all(
    products.map((p) =>
      prisma.product.upsert({
        where: { sku: p.sku },
        update: {},
        create: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          basePrice: p.basePrice,
          salePrice: p.salePrice,
          sku: p.sku,
          isFeatured: p.isFeatured,
          categoryId: categoryMap[p.categorySlug],
        },
      })
    )
  );

  console.log("Created products:", createdProducts.length);

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const childSizes = ["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"];

  for (const product of createdProducts) {
    const category = createdCategories.find(
      (c: Category) => c.id === product.categoryId
    );
    const isBoys = category?.gender === "boys";
    const productSizes = isBoys ? childSizes : sizes;

    // Create a default variant
    const variant = await prisma.productVariant.upsert({
      where: { id: `${product.id}-default` },
      update: {},
      create: {
        id: `${product.id}-default`,
        name: "Default",
        productId: product.id,
      },
    });

    for (const sizeName of productSizes) {
      await prisma.size.upsert({
        where: { variantId_name: { variantId: variant.id, name: sizeName } },
        update: {},
        create: {
          name: sizeName,
          variantId: variant.id,
          inventory: {
            create: {
              quantity: Math.floor(Math.random() * 50) + 10,
            },
          },
        },
      });
    }
  }

  console.log("Created variants and sizes for all products");
  console.log("Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
