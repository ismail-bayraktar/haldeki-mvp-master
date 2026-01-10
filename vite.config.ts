import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";
import { componentTagger } from "lovable-tagger";
import viteImagemin from "vite-plugin-imagemin";

// Security headers for development and production
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.unsplash.com https://*.supabase.co https://images.unsplash.com; connect-src 'self' https://*.supabase.co https://api.brevo.com; font-src 'self' data:; object-src 'none'; frame-ancestors 'none';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Build-time görüntü optimizasyonu - Sadece production'da aktif
    mode === "production" && viteImagemin({
      verbose: true, // Sıkıştırma sonuçlarını logla
      // WebP formatına dönüşüm - Modern tarayıcılar için ideal
      webp: {
        quality: 80,
        method: 6, // Daha iyi sıkıştırma (0-6 arası, 6 en yavaş ama en etkili)
      },
      // PNG optimizasyonu
      optipng: {
        optimizationLevel: 7, // 0-7 arası, 7 en agresif
      },
      // JPEG optimizasyonu
      mozjpeg: {
        quality: 80,
      },
      // SVG optimizasyonu
      svgo: {
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                cleanupNumericValues: {
                  precision: 2,
                },
              },
            },
          },
          "removeDimensions",
          "removeViewBox",
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015',
    minify: 'esbuild',
    sourcemap: false,
    // Add cache busting suffix
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Add content hash to filenames for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: (id) => {
          // Don't create separate charts chunk - causes TDZ errors
          // Recharts will be bundled with dashboard pages only

          // React core
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-core';
          }
          // Radix UI components
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }
          // Data & forms
          if (id.includes('@tanstack') || id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'data-vendor';
          }
          // Icons - smaller chunks for better tree-shaking
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          // Utilities
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance')) {
            return 'utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable compression for better build output
    reportCompressedSize: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      // Recharts excluded - loaded dynamically to avoid TDZ errors
    ],
    exclude: ['recharts'],
  },
}));
