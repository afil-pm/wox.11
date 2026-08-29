import { createCategoryMetadata, createCategoryLayout } from "@/lib/category-seo";
export const generateMetadata = createCategoryMetadata("boys", "shirts");
const Layout = createCategoryLayout("boys", "shirts");
export default Layout;
