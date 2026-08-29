import { createCategoryMetadata, createCategoryLayout } from "@/lib/category-seo";
export const generateMetadata = createCategoryMetadata("boys", "t-shirts");
const Layout = createCategoryLayout("boys", "t-shirts");
export default Layout;
