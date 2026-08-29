import { createCategoryMetadata, createCategoryLayout } from "@/lib/category-seo";
export const generateMetadata = createCategoryMetadata("men", "t-shirts");
const Layout = createCategoryLayout("men", "t-shirts");
export default Layout;
