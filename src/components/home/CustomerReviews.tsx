import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomerReview {
  id: string;
  name: string;
  region: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

const reviews: CustomerReview[] = [
  {
    id: "cr1",
    name: "Ayşe K.",
    region: "Menemen",
    rating: 5,
    comment: "Menemen'e aynı gün teslimat harika! Domatesler gerçekten taze ve lezzetli geldi. Artık hep Haldeki'den alacağım.",
    date: "2025-12-20",
    verified: true,
  },
  {
    id: "cr2",
    name: "Mehmet T.",
    region: "Aliağa",
    rating: 5,
    comment: "Aliağa'ya teslimat çok hızlı. Ürünler halden yeni gelmiş gibi taptaze. Fiyatlar da marketten çok uygun.",
    date: "2025-12-19",
    verified: true,
  },
  {
    id: "cr3",
    name: "Fatma S.",
    region: "Menemen",
    rating: 5,
    comment: "Ulukent'e bile teslimat yapıyorlar, çok memnunum. Portakallar muhteşemdi!",
    date: "2025-12-21",
    verified: true,
  },
  {
    id: "cr4",
    name: "Ali V.",
    region: "Aliağa",
    rating: 4,
    comment: "Ürün kalitesi çok iyi. Tek öneri paketleme biraz daha sağlam olabilir.",
    date: "2025-12-18",
    verified: true,
  },
  {
    id: "cr5",
    name: "Zeynep D.",
    region: "Menemen",
    rating: 5,
    comment: "Çilekler muhteşemdi! Çocuklar bayıldı. Kesinlikle tavsiye ederim.",
    date: "2025-12-22",
    verified: true,
  },
  {
    id: "cr6",
    name: "Hüseyin A.",
    region: "Aliağa",
    rating: 5,
    comment: "İş yerine bile teslimat yaptılar. Profesyonel ve güvenilir hizmet.",
    date: "2025-12-17",
    verified: true,
  },
];

const CustomerReviews = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const reviewsPerPage = 3;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalPages);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalPages]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const visibleReviews = reviews.slice(
    currentIndex * reviewsPerPage,
    (currentIndex + 1) * reviewsPerPage
  );

  const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Quote className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Müşterilerimiz Ne Diyor?
            </h2>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-5 w-5",
                    star <= Math.round(Number(averageRating))
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted"
                  )}
                />
              ))}
            </div>
            <span className="font-bold text-foreground">{averageRating}</span>
            <span>/ 5 ({reviews.length} değerlendirme)</span>
          </div>
        </div>

        <div className="relative">
          <div className="grid md:grid-cols-3 gap-6">
            {visibleReviews.map((review) => (
              <div
                key={review.id}
                className="bg-card rounded-xl p-6 shadow-md border border-border"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{review.name}</span>
                      {review.verified && (
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{review.region}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-4 w-4",
                          star <= review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-foreground/90 leading-relaxed">"{review.comment}"</p>

                <p className="text-xs text-muted-foreground mt-4">
                  {new Date(review.date).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentIndex
                      ? "bg-primary w-6"
                      : "bg-muted hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
