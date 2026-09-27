import Image, { type ImageProps } from "next/image";
import { isExternalImageUrl } from "@/lib/images";

type ProductImageProps = Omit<ImageProps, "unoptimized"> & {
  unoptimized?: boolean;
};

/**
 * Renders product images from either source the admin can provide:
 * uploaded images (data URLs / local assets) and externally hosted image URLs.
 *
 * Externally hosted images are rendered without going through the Next.js
 * image optimizer so they are loaded straight from their host instead of being
 * downloaded into the app's storage, and so no `images.remotePatterns`
 * configuration is required for arbitrary hosts.
 */
export function ProductImage({ src, unoptimized, ...props }: ProductImageProps) {
  const external = typeof src === "string" && isExternalImageUrl(src);

  return <Image {...props} src={src} unoptimized={unoptimized || external} />;
}
