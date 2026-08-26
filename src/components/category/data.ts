export type CategoryItem = {
  title: string;
  slug: string;
  image: string;
  href: string;
  icon: "shirt" | "pants";
};

export type CategoryGroup = {
  gender: string;
  label: string;
  description: string;
  href: string;
  categories: CategoryItem[];
};

export const categoryGroups: CategoryGroup[] = [
  {
    gender: "men",
    label: "MEN",
    description: "Timeless styles\nfor every occasion.",
    href: "/men",
    categories: [
      {
        title: "SHIRTS",
        slug: "shirts",
        image: "/images/products/men/shirts/wox-green-plaid-flannel-shirt-1.png",
        href: "/men/shirts",
        icon: "shirt",
      },
      {
        title: "T-SHIRTS",
        slug: "t-shirts",
        image: "/images/products/men/t-shirts/wox-peach-polo-shirt-1.png",
        href: "/men/t-shirts",
        icon: "shirt",
      },
      {
        title: "PANTS",
        slug: "pants",
        image: "/images/products/men/pants/wox-khaki-cargo-pants-1.png",
        href: "/men/pants",
        icon: "pants",
      },
    ],
  },
  {
    gender: "boys",
    label: "BOYS",
    description: "Comfortable styles\nfor every adventure.",
    href: "/boys",
    categories: [
      {
        title: "SHIRTS",
        slug: "shirts",
        image: "/images/products/boys/shirts/wox-boys-denim-shirt-1.png",
        href: "/boys/shirts",
        icon: "shirt",
      },
      {
        title: "T-SHIRTS",
        slug: "t-shirts",
        image: "/images/products/boys/t-shirts/wox-boys-grey-sweatshirt-1.png",
        href: "/boys/t-shirts",
        icon: "shirt",
      },
      {
        title: "PANTS",
        slug: "pants",
        image: "/images/products/boys/pants/wox-boys-black-wide-leg-jeans-1.png",
        href: "/boys/pants",
        icon: "pants",
      },
    ],
  },
];
