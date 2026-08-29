import { createCategoryMetadata, createCategoryLayout } from "@/lib/category-seo";
export const generateMetadata = createCategoryMetadata("boys", "pants");
const Layout = createCategoryLayout("boys", "pants");
export default Layout;
