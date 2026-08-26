"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Star,
  Truck,
  RotateCcw,
  Shield,
  Ruler,
  Check,
  X,
  Share2,
  MapPin,
  ChevronLeft,
} from "lucide-react";
import { cn, formatPrice, calculateDiscount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WoxLoader from "@/components/ui/wox-loader";
import useCartStore from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";

type ProductImage = { url: string; alt: string | null };
type ColorVariant = { id: string; name: string; color: string | null; colorCode: string | null; images: ProductImage[] };
type SizeOption = { id: string; name: string; inventory: { quantity: number } | null };
type Review = { id: string; rating: number; comment: string | null; createdAt: string; user: { name: string | null } };

type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  salePrice: number | null;
  averageRating: number;
  reviewCount: number;
  category: { name: string; slug: string; gender: string };
  images: ProductImage[];
  variants: (ColorVariant & { sizes: SizeOption[] })[];
  reviews: Review[];
};

function RatingStars({ rating, count, size = "sm" }: { rating: number; count: number; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(sizeMap[size], i <= rating ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200")} />
      ))}
      {count > 0 && <span className="ml-1 text-xs text-zinc-500">({count})</span>}
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const addItem = useCartStore((s) => s.addItem);
  const toggleItem = useWishlistStore((s) => s.toggleItem);

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [pincode, setPincode] = useState("");
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "reviews">("description");

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        const p: ApiProduct = data.product;
        setProduct(p);
        if (p.variants.length > 0) {
          const firstAvailable = p.variants[0]?.sizes.find((s) => (s.inventory?.quantity ?? 0) > 0);
          if (firstAvailable) setSelectedSize(firstAvailable.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  const isInWishlist = useWishlistStore((s) => product ? s.isInWishlist(product.id) : false);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <WoxLoader />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">Product Not Found</h1>
          <p className="mt-2 text-zinc-500">{error || "The product you're looking for doesn't exist."}</p>
          <Button asChild className="mt-6"><Link href="/men">Back to Men</Link></Button>
        </div>
      </div>
    );
  }

  const currentVariant = product.variants[selectedColor] ?? product.variants[0];
  const variantImages = currentVariant.images.length > 0 ? currentVariant.images : product.images;
  const allImages = variantImages.length > 0 ? variantImages : [{ url: "https://placehold.co/600x800?text=No+Image", alt: null }];
  const selectedSizeData = currentVariant.sizes.find((s) => s.id === selectedSize);
  const stock = selectedSizeData?.inventory?.quantity ?? 0;
  const inStock = stock > 0;
  const displayPrice = product.salePrice ?? product.basePrice;
  const isOnSale = product.salePrice !== null;
  const discount = isOnSale ? calculateDiscount(product.basePrice, product.salePrice!) : 0;

  const handleAddToCart = () => {
    if (!selectedSize || !selectedSizeData) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: displayPrice,
      image: allImages[0].url,
      size: selectedSizeData.name,
      sizeId: selectedSize,
      quantity,
      maxQuantity: stock,
      category: product.category.slug,
      gender: product.category.gender,
    });
  };

  const handleBuyNow = () => {
    const stored = localStorage.getItem("wox-user");
    if (!stored || !JSON.parse(stored)?.email) {
      router.push("/auth/login");
      return;
    }
    handleAddToCart();
    router.push("/checkout");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url: window.location.href }); } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  const highlights = [
    `Premium ${product.category.name.toLowerCase().includes("shirt") ? "cotton" : "blend"} fabric`,
    "Pre-shrunk for lasting fit",
    "Reinforced stitching",
    "Easy care — machine washable",
  ];

  const specifications = [
    { label: "Category", value: product.category.name },
    { label: "Fit", value: "Regular" },
    { label: "Material", value: "100% Organic Cotton" },
    { label: "Pattern", value: "Solid" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 overflow-x-auto text-xs text-zinc-500">
          <Link href="/" className="whitespace-nowrap hover:text-zinc-900">Home</Link>
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          <Link href={`/${product.category.gender}`} className="whitespace-nowrap capitalize hover:text-zinc-900">{product.category.gender}</Link>
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          <span className="whitespace-nowrap text-zinc-900">{product.name}</span>
        </nav>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
          {/* Left: Images Gallery */}
          <div className="lg:col-span-5">
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <div className="flex gap-2 sm:flex-col">
                {allImages.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)}
                    className={cn("relative h-16 w-16 flex-shrink-0 overflow-hidden border-2 transition-all sm:h-20 sm:w-20", selectedImage === idx ? "border-zinc-900" : "border-zinc-200 hover:border-zinc-400")}>
                    <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="relative flex-1 overflow-hidden bg-zinc-50">
                <div className="aspect-[3/4] relative">
                  <img src={allImages[selectedImage].url} alt={allImages[selectedImage].alt ?? product.name} className="h-full w-full object-cover" />
                </div>
                {isOnSale && (
                  <Badge className="absolute left-3 top-3 bg-zinc-900 text-xs font-bold text-white">-{discount}%</Badge>
                )}
                {allImages.length > 1 && (
                  <>
                    <button onClick={() => setSelectedImage((p) => (p > 0 ? p - 1 : allImages.length - 1))} className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => setSelectedImage((p) => (p < allImages.length - 1 ? p + 1 : 0))} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  {selectedImage + 1} / {allImages.length}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-7 lg:pl-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">{product.name}</h1>
              <div className="mt-2 flex items-center gap-3">
                <RatingStars rating={product.averageRating} count={product.reviewCount} size="md" />
                <span className="text-xs text-zinc-400">|</span>
                <span className="text-xs text-zinc-500">{product.reviewCount} ratings</span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-3 border-b border-zinc-100 pb-4">
              <span className="text-3xl font-bold text-zinc-900">{formatPrice(displayPrice)}</span>
              {isOnSale && (
                <>
                  <span className="text-base text-zinc-400 line-through">{formatPrice(product.basePrice)}</span>
                  <Badge variant="success" className="text-xs font-bold">{discount}% off</Badge>
                </>
              )}
            </div>

            {/* Color Selector */}
            {product.variants.length > 1 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-zinc-900">
                  COLOR: <span className="font-normal text-zinc-500">{currentVariant.name}</span>
                </p>
                <div className="flex gap-2">
                  {product.variants.map((variant, idx) => (
                    <button key={variant.id} onClick={() => { setSelectedColor(idx); setSelectedImage(0); }}
                      className={cn("h-10 w-10 rounded-full border-2 transition-all", selectedColor === idx ? "border-zinc-900 ring-2 ring-zinc-900 ring-offset-2" : "border-zinc-200 hover:border-zinc-400")}>
                      <span className="block h-full w-full rounded-full" style={{ backgroundColor: variant.colorCode ?? variant.color ?? "#ccc" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">
                  SIZE: {selectedSizeData && <span className="font-normal text-zinc-500">{selectedSizeData.name}</span>}
                </p>
                <button onClick={() => setShowSizeGuide(true)} className="flex items-center gap-1 text-xs font-medium text-zinc-600 underline-offset-4 hover:underline">
                  <Ruler className="h-3.5 w-3.5" /> Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentVariant.sizes.map((size) => {
                  const qty = size.inventory?.quantity ?? 0;
                  return (
                    <button key={size.id} onClick={() => setSelectedSize(size.id)} disabled={qty === 0}
                      className={cn("relative flex h-11 min-w-[44px] items-center justify-center rounded-md border px-3 text-sm font-medium transition-all",
                        selectedSize === size.id ? "border-zinc-900 bg-zinc-900 text-white" : qty === 0 ? "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300 line-through" : "border-zinc-200 hover:border-zinc-500"
                      )}>
                      {size.name}
                      {qty > 0 && qty <= 5 && <span className="absolute -top-2 right-0 text-[9px] font-bold text-orange-500">LOW</span>}
                    </button>
                  );
                })}
              </div>
              {selectedSize && !inStock && <p className="mt-2 text-sm text-red-500">This size is out of stock</p>}
            </div>

            {/* Stock Info */}
            {inStock && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="text-green-600 font-medium">In Stock</span>
                {stock <= 5 && <span className="text-orange-500">— Only {stock} left!</span>}
              </div>
            )}

            {/* Quantity + Buttons */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-11 items-center rounded-md border border-zinc-200">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}
                  className="flex h-full w-10 items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                <span className="flex h-full w-10 items-center justify-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(stock, q + 1))} disabled={quantity >= stock}
                  className="flex h-full w-10 items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-30"><Plus className="h-4 w-4" /></button>
              </div>
              <Button onClick={handleAddToCart} disabled={!selectedSize || !inStock}
                className="h-11 flex-1 rounded-md bg-amber-500 text-sm font-bold text-white hover:bg-amber-600 disabled:bg-zinc-300">ADD TO CART</Button>
              <Button onClick={handleBuyNow} disabled={!selectedSize || !inStock}
                className="h-11 flex-1 rounded-md bg-orange-500 text-sm font-bold text-white hover:bg-orange-600 disabled:bg-zinc-300">BUY NOW</Button>
            </div>

            {/* Wishlist + Share */}
            <div className="mt-3 flex gap-3">
              <button onClick={() => toggleItem({ productId: product.id, name: product.name, slug: product.slug, price: product.basePrice, image: allImages[0].url, category: product.category.slug, gender: product.category.gender })}
                className={cn("flex flex-1 items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-all",
                  isInWishlist ? "border-red-200 bg-red-50 text-red-600" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                )}>
                <Heart className={cn("h-4 w-4", isInWishlist && "fill-red-500")} />
                {isInWishlist ? "Wishlisted" : "Wishlist"}
              </button>
              <button onClick={handleShare}
                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition-all hover:border-zinc-400">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>

            {/* Delivery Check */}
            <div className="mt-5 rounded-lg border border-zinc-200 p-4">
              <p className="mb-2 text-sm font-medium text-zinc-900">DELIVERY OPTIONS</p>
              <div className="flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-md border border-zinc-200 px-3 py-2">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Enter Pincode"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400" />
                </div>
                <Button variant="outline" size="sm" className="px-4">Check</Button>
              </div>
              {pincode.length === 6 && (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600"><Truck className="h-4 w-4" /> Free delivery by Aug 28-30</div>
                  <div className="flex items-center gap-2 text-zinc-600"><RotateCcw className="h-4 w-4" /> 7 days return policy</div>
                  <div className="flex items-center gap-2 text-zinc-600"><Shield className="h-4 w-4" /> Pay on delivery available</div>
                </div>
              )}
            </div>

            {/* Highlights */}
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-zinc-900">HIGHLIGHTS</p>
              <ul className="space-y-1.5">
                {highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-zinc-600">
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-600" /> {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 border-t border-zinc-100 pt-8">
          <div className="flex gap-6 border-b border-zinc-100">
            {(["description", "specifications", "reviews"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("pb-3 text-sm font-medium capitalize transition-colors border-b-2",
                  activeTab === tab ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-600"
                )}>
                {tab} {tab === "reviews" && `(${product.reviewCount})`}
              </button>
            ))}
          </div>

          <div className="py-6">
            {activeTab === "description" && (
              <div className="max-w-3xl">
                <p className="leading-relaxed text-zinc-600">{product.description || "No description available."}</p>
              </div>
            )}
            {activeTab === "specifications" && (
              <div className="max-w-3xl overflow-hidden rounded-lg border border-zinc-100">
                {specifications.map((spec, idx) => (
                  <div key={spec.label} className={cn("flex justify-between px-4 py-3 text-sm", idx % 2 === 0 ? "bg-zinc-50" : "")}>
                    <span className="font-medium text-zinc-700">{spec.label}</span>
                    <span className="text-zinc-500">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="max-w-3xl">
                <div className="mb-6 flex items-center gap-6 rounded-lg bg-zinc-50 p-6">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-zinc-900">{product.averageRating}</span>
                    <div className="mt-1"><RatingStars rating={product.averageRating} count={0} size="md" /></div>
                    <p className="mt-1 text-xs text-zinc-500">{product.reviewCount} ratings</p>
                  </div>
                </div>
                {product.reviews.length === 0 ? (
                  <p className="text-sm text-zinc-500">No reviews yet.</p>
                ) : (
                  <div className="space-y-6">
                    {product.reviews.map((review) => (
                      <div key={review.id} className="border-b border-zinc-100 pb-6 last:border-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white">
                              {(review.user.name ?? "A").charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-900">{review.user.name ?? "Anonymous"}</p>
                              <RatingStars rating={review.rating} count={0} size="sm" />
                            </div>
                          </div>
                          <span className="text-xs text-zinc-400">
                            {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        {review.comment && <p className="mt-3 text-sm leading-relaxed text-zinc-600">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg">
          Link copied to clipboard!
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-xl">
            <button onClick={() => setShowSizeGuide(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900">Size Guide</h3>
            <p className="mt-1 text-sm text-zinc-500">All measurements are in inches</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="px-4 py-2 text-left font-medium text-zinc-700">Size</th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-700">Chest</th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-700">Length</th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-700">Shoulder</th>
                  </tr>
                </thead>
                <tbody>
                  {[{ size: "XS", chest: "38", length: "26", shoulder: "18" }, { size: "S", chest: "40", length: "27", shoulder: "19" }, { size: "M", chest: "42", length: "28", shoulder: "20" }, { size: "L", chest: "44", length: "29", shoulder: "21" }, { size: "XL", chest: "46", length: "30", shoulder: "22" }, { size: "XXL", chest: "48", length: "31", shoulder: "23" }].map((row) => (
                    <tr key={row.size} className="border-b border-zinc-100">
                      <td className="px-4 py-2.5 font-medium text-zinc-900">{row.size}</td>
                      <td className="px-4 py-2.5 text-zinc-600">{row.chest}</td>
                      <td className="px-4 py-2.5 text-zinc-600">{row.length}</td>
                      <td className="px-4 py-2.5 text-zinc-600">{row.shoulder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={() => setShowSizeGuide(false)} variant="outline" className="mt-6 w-full">Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
