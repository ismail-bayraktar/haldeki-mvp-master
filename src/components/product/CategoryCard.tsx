import { Link } from "react-router-dom";
import { icons, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const IconComponent = icons[category.iconName as keyof typeof icons] as LucideIcon;

  return (
    <Link to={`/urunler?kategori=${category.slug}`}>
      <Card className="group overflow-hidden card-hover cursor-pointer">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2">
              {IconComponent && (
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-white">{category.name}</h3>
                <p className="text-sm text-white/80">{category.productCount} ürün</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default CategoryCard;
