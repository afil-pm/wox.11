import { createCategoryMetadata, createCategoryLayout } from "@/lib/category-seo";
export const generateMetadata = createCategoryMetadata("men", "shirts");
const Layout = createCategoryLayout("men", "shirts");
export default Layout;
