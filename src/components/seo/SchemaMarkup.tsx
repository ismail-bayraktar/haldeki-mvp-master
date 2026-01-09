import { useEffect } from "react";

interface LocalBusinessSchemaProps {
  name?: string;
  description?: string;
  areaServed?: string[];
  locality?: string;
  region?: string;
}

interface ProductSchemaProps {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "LimitedAvailability";
  brand?: string;
  category?: string;
  ratingValue?: number;
  reviewCount?: number;
}

interface DeliveryAreaSchemaProps {
  areas: { name: string; locality: string; region: string }[];
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQItem[];
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export const LocalBusinessSchema = ({
  name = "Haldeki",
  description = "İzmir Menemen ve Aliağa'ya taze meyve sebze teslimatı. Toptan hal fiyatlarına online sipariş.",
  areaServed = ["Menemen", "Aliağa"],
  locality = "Menemen",
  region = "İzmir",
}: LocalBusinessSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://haldeki.com/#organization",
    name: name,
    alternateName: "Haldeki Dijital Hal",
    description: description,
    url: "https://haldeki.com",
    telephone: "+902321234567",
    email: "info@haldeki.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: locality,
      addressRegion: region,
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "38.9465",
      longitude: "27.0622",
    },
    areaServed: areaServed.map((area) => ({
      "@type": "City",
      name: area,
    })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "06:00",
        closes: "22:00",
      },
    ],
    priceRange: "₺₺",
    image: "https://haldeki.com/logo.png",
    sameAs: [
      "https://facebook.com/haldeki",
      "https://instagram.com/haldeki",
      "https://twitter.com/haldeki",
    ],
  };

  useEffect(() => {
    const existingScript = document.querySelector('script[data-schema="local-business"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema", "local-business");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description, locality, region, areaServed]);

  return null;
};

export const ProductSchema = ({
  name,
  description,
  image,
  price,
  currency = "TRY",
  availability = "InStock",
  brand = "Haldeki",
  category,
  ratingValue,
  reviewCount,
}: ProductSchemaProps) => {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: name,
    description: description,
    image: image,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    category: category,
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      areaServed: [
        { "@type": "City", name: "Menemen" },
        { "@type": "City", name: "Aliağa" },
      ],
      seller: {
        "@type": "Organization",
        name: "Haldeki",
      },
    },
  };

  if (ratingValue && reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      reviewCount: reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  useEffect(() => {
    const existingScript = document.querySelector('script[data-schema="product"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema", "product");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description, image, price, availability, ratingValue, reviewCount]);

  return null;
};

export const FAQSchema = ({ faqs }: FAQSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  useEffect(() => {
    const existingScript = document.querySelector('script[data-schema="faq"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema", "faq");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faqs]);

  return null;
};

export const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  useEffect(() => {
    const existingScript = document.querySelector('script[data-schema="breadcrumb"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema", "breadcrumb");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return null;
};

export const DeliveryAreaSchema = ({ areas }: DeliveryAreaSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Meyve Sebze Teslimatı",
    provider: {
      "@type": "LocalBusiness",
      name: "Haldeki",
    },
    areaServed: areas.map((area) => ({
      "@type": "Place",
      name: area.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: area.locality,
        addressRegion: area.region,
        addressCountry: "TR",
      },
    })),
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: "https://haldeki.com",
      servicePhone: "+902321234567",
    },
  };

  useEffect(() => {
    const existingScript = document.querySelector('script[data-schema="delivery-area"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema", "delivery-area");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas]);

  return null;
};
