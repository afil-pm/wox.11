"use client";

import { useEffect } from "react";

type OgMetaProps = {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: string;
};

export default function OgMeta({ title, description, image, url, type = "website" }: OgMetaProps) {
  useEffect(() => {
    const metas: { name?: string; property?: string; content: string }[] = [
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: type },
      { property: "og:site_name", content: "WOX.11" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];

    if (image) {
      const fullImage = image.startsWith("http") ? image : `https://wox11.vercel.app${image}`;
      metas.push(
        { property: "og:image", content: fullImage },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:image", content: fullImage }
      );
    }

    const elements: HTMLMetaElement[] = [];
    metas.forEach((m) => {
      const existing = document.querySelector(
        m.property
          ? `meta[property="${m.property}"]`
          : `meta[name="${m.name}"]`
      );
      if (existing) {
        existing.setAttribute("content", m.content);
      } else {
        const el = document.createElement("meta");
        if (m.property) el.setAttribute("property", m.property);
        if (m.name) el.setAttribute("name", m.name);
        el.setAttribute("content", m.content);
        document.head.appendChild(el);
        elements.push(el);
      }
    });

    return () => {
      elements.forEach((el) => el.remove());
    };
  }, [title, description, image, url, type]);

  return null;
}
