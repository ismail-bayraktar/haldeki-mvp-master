import { useState } from "react";
import { ThumbsUp, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StarRating from "./StarRating";
import {
  Review,
  getReviewsByProductId,
  getAverageRating,
  getRatingDistribution,
} from "@/data/reviews";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

const ProductReviews = ({ productId, productName }: ProductReviewsProps) => {
  const { isAuthenticated, openAuthDrawer } = useAuth();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());
  
  // Review form state
  const [newRating, setNewRating] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviews = getReviewsByProductId(productId);
  const { average, count } = getAverageRating(productId);
  const distribution = getRatingDistribution(productId);
  
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const maxDistribution = Math.max(...Object.values(distribution), 1);

  const handleHelpful = (reviewId: string) => {
    if (helpfulClicked.has(reviewId)) return;
    setHelpfulClicked(new Set([...helpfulClicked, reviewId]));
    toast({
      title: "Teşekkürler!",
      description: "Geri bildiriminiz kaydedildi.",
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      openAuthDrawer();
      return;
    }

    if (newRating === 0) {
      toast({
        title: "Puan gerekli",
        description: "Lütfen bir yıldız puanı seçin.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Yorum gerekli",
        description: "Lütfen bir yorum yazın.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: "Değerlendirmeniz gönderildi!",
      description: "Yorumunuz incelendikten sonra yayınlanacaktır.",
    });
    
    setNewRating(0);
    setNewTitle("");
    setNewComment("");
    setShowReviewForm(false);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* Rating Summary */}
        <div className="flex items-start gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-foreground">{average.toFixed(1)}</div>
            <StarRating rating={average} size="md" />
            <p className="text-sm text-muted-foreground mt-1">{count} değerlendirme</p>
          </div>
          
          {/* Rating Distribution */}
          <div className="space-y-1.5 min-w-[200px]">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-sm w-3">{stars}</span>
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                <Progress
                  value={(distribution[stars] / maxDistribution) * 100}
                  className="h-2 flex-1"
                />
                <span className="text-xs text-muted-foreground w-6 text-right">
                  {distribution[stars]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        <Button
          onClick={() => {
            if (!isAuthenticated) {
              openAuthDrawer();
            } else {
              setShowReviewForm(!showReviewForm);
            }
          }}
          variant={showReviewForm ? "outline" : "default"}
        >
          {showReviewForm ? "İptal" : "Değerlendirme Yaz"}
        </Button>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-secondary/30 rounded-xl p-6 space-y-4 animate-fade-in"
        >
          <h3 className="font-bold text-lg">{productName} için değerlendirme yazın</h3>
          
          <div className="space-y-2">
            <Label>Puanınız *</Label>
            <StarRating
              rating={newRating}
              size="lg"
              interactive
              onRatingChange={setNewRating}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="review-title">Başlık</Label>
            <Input
              id="review-title"
              placeholder="Değerlendirmeniz için kısa bir başlık"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="review-comment">Yorumunuz *</Label>
            <Textarea
              id="review-comment"
              placeholder="Ürün hakkındaki deneyiminizi paylaşın..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
            />
          </div>
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Gönderiliyor..." : "Değerlendirmeyi Gönder"}
          </Button>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {displayedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={() => handleHelpful(review.id)}
              helpfulClicked={helpfulClicked.has(review.id)}
            />
          ))}
          
          {reviews.length > 3 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAllReviews(!showAllReviews)}
            >
              {showAllReviews ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Daha az göster
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Tüm değerlendirmeleri gör ({reviews.length})
                </>
              )}
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-secondary/30 rounded-xl">
          <p className="text-muted-foreground mb-4">
            Bu ürün için henüz değerlendirme yapılmamış.
          </p>
          <Button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthDrawer();
              } else {
                setShowReviewForm(true);
              }
            }}
          >
            İlk değerlendirmeyi siz yapın
          </Button>
        </div>
      )}
    </div>
  );
};

// Individual Review Card
interface ReviewCardProps {
  review: Review;
  onHelpful: () => void;
  helpfulClicked: boolean;
}

const ReviewCard = ({ review, onHelpful, helpfulClicked }: ReviewCardProps) => {
  const formattedDate = new Date(review.createdAt).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="border-b pb-6 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {review.userName.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{review.userName}</span>
                {review.verified && (
                  <span className="flex items-center gap-1 text-xs text-stock-plenty">
                    <CheckCircle className="h-3 w-3" />
                    Onaylı Alıcı
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          
          <StarRating rating={review.rating} size="sm" />
          
          {review.title && (
            <h4 className="font-bold mt-2">{review.title}</h4>
          )}
          
          <p className="text-muted-foreground mt-1">{review.comment}</p>
          
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "mt-3 text-muted-foreground",
              helpfulClicked && "text-primary"
            )}
            onClick={onHelpful}
            disabled={helpfulClicked}
          >
            <ThumbsUp className={cn("h-4 w-4 mr-1", helpfulClicked && "fill-primary")} />
            Faydalı ({helpfulClicked ? review.helpful + 1 : review.helpful})
          </Button>
        </div>
      </div>
    </div>
  );
};

// Need to import Star for the distribution bars
import { Star } from "lucide-react";

export default ProductReviews;
