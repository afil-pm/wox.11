import StoreHome from "./home-client";
import { getActiveHeroSlides } from "@/lib/hero-slides-server";

/**
 * Server page: hero banners are read from the database here so the initial
 * HTML already contains the admin-managed slides. The root layout awaits
 * `headers()` (CSP nonce), which keeps this route rendered per request — an
 * admin save is reflected on the next page load without a redeploy.
 */
export default async function Home() {
  const heroSlides = await getActiveHeroSlides();
  return <StoreHome heroSlides={heroSlides} />;
}
