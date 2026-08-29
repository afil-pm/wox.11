import { createCategoryMetadata, createCategoryLayout } from "@/lib/category-seo";
export const generateMetadata = createCategoryMetadata("men", "pants");
const Layout = createCategoryLayout("men", "pants");
export default Layout;
