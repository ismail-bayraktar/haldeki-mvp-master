import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert string to URL-friendly slug
 * Example: "Yeni Ürün" → "yeni-urun"
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')                  // Separate accented characters
    .replace(/[\u0300-\u036f]/g, '')   // Remove accents
    .replace(/[^a-z0-9\s-]/g, '')      // Remove special chars
    .replace(/\s+/g, '-')              // Replace spaces with -
    .replace(/-+/g, '-')               // Replace multiple - with single -
    .substring(0, 100);                // Max 100 chars
}

/**
 * Generate unique slug by adding random suffix if needed
 */
export function generateUniqueSlug(baseName: string, existingSlugs: string[] = []): string {
  let slug = generateSlug(baseName);
  let counter = 1;

  // If slug exists, add counter
  while (existingSlugs.includes(slug)) {
    slug = `${generateSlug(baseName)}-${counter}`;
    counter++;
  }

  return slug;
}
