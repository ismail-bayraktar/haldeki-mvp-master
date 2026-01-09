import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  openGraphUrl?: string;
  ogImage?: string;
  ogType?: "website" | "product" | "article";
  noIndex?: boolean;
}

const PageMeta = ({
  title,
  description,
  keywords,
  canonicalUrl,
  openGraphUrl,
  ogImage = "https://haldeki.com/og-image.jpg",
  ogType = "website",
  noIndex = false,
}: PageMetaProps) => {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Basic meta tags
    updateMeta("description", description);
    if (keywords) {
      updateMeta("keywords", keywords);
    }

    // Robots
    if (noIndex) {
      updateMeta("robots", "noindex, nofollow");
    } else {
      updateMeta("robots", "index, follow");
    }

    // Geo meta tags for local SEO
    updateMeta("geo.region", "TR-35");
    updateMeta("geo.placename", "İzmir, Menemen, Aliağa");
    updateMeta("geo.position", "38.9465;27.0622");
    updateMeta("ICBM", "38.9465, 27.0622");

    // Open Graph tags
    updateMeta("og:title", title, true);
    updateMeta("og:description", description, true);
    updateMeta("og:type", ogType, true);
    updateMeta("og:image", ogImage, true);
    updateMeta("og:site_name", "Haldeki", true);
    updateMeta("og:locale", "tr_TR", true);
    if (openGraphUrl) {
      updateMeta("og:url", openGraphUrl, true);
    }

    // Twitter Card tags
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", title);
    updateMeta("twitter:description", description);
    updateMeta("twitter:image", ogImage);

    // Canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
    }

    // Cleanup function
    return () => {
      // Reset title on unmount if needed
    };
  }, [title, description, keywords, canonicalUrl, openGraphUrl, ogImage, ogType, noIndex]);

  return null;
};

export default PageMeta;
