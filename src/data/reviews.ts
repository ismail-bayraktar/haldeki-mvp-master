export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  helpful: number;
  verified: boolean;
}

export const mockReviews: Review[] = [
  {
    id: "r1",
    productId: "1",
    userId: "u1",
    userName: "Ayşe K.",
    rating: 5,
    title: "Muhteşem tazelik!",
    comment: "Elmalar gerçekten çok taze ve lezzetli geldi. Paketleme de gayet özenli yapılmıştı. Kesinlikle tekrar alacağım.",
    createdAt: "2025-12-20",
    helpful: 12,
    verified: true,
  },
  {
    id: "r2",
    productId: "1",
    userId: "u2",
    userName: "Mehmet T.",
    rating: 4,
    title: "Kaliteli ürün",
    comment: "Genel olarak memnunum. Elmalar güzel ama birkaç tanesi biraz ezik gelmişti.",
    createdAt: "2025-12-18",
    helpful: 5,
    verified: true,
  },
  {
    id: "r3",
    productId: "2",
    userId: "u3",
    userName: "Fatma S.",
    rating: 5,
    title: "Anamur muzunun en iyisi",
    comment: "Tam kıvamında olgunlaşmış, harika muzlar. Çocuklar bayıldı!",
    createdAt: "2025-12-21",
    helpful: 8,
    verified: true,
  },
  {
    id: "r4",
    productId: "5",
    userId: "u4",
    userName: "Ali V.",
    rating: 5,
    title: "Sofralık domates tam olması gerektiği gibi",
    comment: "Rengi, tadı, kokusu mükemmel. Salatalarda harika oluyor. Haldeki'den almaya devam edeceğim.",
    createdAt: "2025-12-22",
    helpful: 15,
    verified: true,
  },
  {
    id: "r5",
    productId: "5",
    userId: "u5",
    userName: "Zeynep D.",
    rating: 4,
    title: "Güzel domatesler",
    comment: "Taze ve lezzetli. Teslimat da hızlıydı.",
    createdAt: "2025-12-19",
    helpful: 3,
    verified: false,
  },
  {
    id: "r6",
    productId: "3",
    userId: "u6",
    userName: "Emre K.",
    rating: 5,
    title: "Çilekler muhteşem!",
    comment: "Bu kadar taze ve tatlı çilek bulmak zor. Kesinlikle tavsiye ederim.",
    createdAt: "2025-12-23",
    helpful: 7,
    verified: true,
  },
];

export const getReviewsByProductId = (productId: string): Review[] => {
  return mockReviews.filter((r) => r.productId === productId);
};

export const getAverageRating = (productId: string): { average: number; count: number } => {
  const reviews = getReviewsByProductId(productId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
};

export const getRatingDistribution = (productId: string): Record<number, number> => {
  const reviews = getReviewsByProductId(productId);
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    distribution[r.rating]++;
  });
  return distribution;
};
