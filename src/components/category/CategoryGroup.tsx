import type { CategoryGroup as CategoryGroupType } from "./data";
import CategoryIntroCard from "./CategoryIntroCard";
import CategoryCard from "./CategoryCard";

export default function CategoryGroup({ group }: { group: CategoryGroupType }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      <CategoryIntroCard
        label={group.label}
        description={group.description}
        href={group.href}
      />
      {group.categories.map((category) => (
        <CategoryCard key={`${group.gender}-${category.slug}`} category={category} />
      ))}
    </div>
  );
}
