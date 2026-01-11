import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";
import { componentTagger } from "lovable-tagger";
// TODO: Fix vite-plugin-imagemin import issue - temporarily disabled
// import * as viteImagemin from "vite-plugin-imagemin";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

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
    // TODO: Fix vite-plugin-imagemin import issue - temporarily disabled
    // Build-time görüntü optimizasyonu will be added back after fixing the import
    // Gzip compression for production
    mode === "production" && viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files larger than 10KB
      deleteOriginFile: false,
    }),
    // Brotli compression for production (better than gzip)
    mode === "production" && viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
    // Bundle analyzer - generates stats.html
    mode === "production" && visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false,
      },
    },
    sourcemap: false,
    // Add cache busting suffix
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Add content hash to filenames for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          // Separate images, fonts, and other assets for better caching
          if (assetInfo.name && /\.(png|jpg|jpeg|gif|svg|webp|avif)$/.test(assetInfo.name)) {
            return 'assets/images/[name].[hash].[ext]';
          }
          if (assetInfo.name && /\.(woff|woff2|ttf|otf|eot)$/.test(assetInfo.name)) {
            return 'assets/fonts/[name].[hash].[ext]';
          }
          return 'assets/[name].[hash].[ext]';
        },
        manualChunks: (id) => {
          // Don't create separate charts chunk - causes TDZ errors
          // Recharts will be bundled with dashboard pages only

          // React core - separate for better caching
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
          // Recharts - dynamic only
          if (id.includes('recharts')) {
            return 'charts';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable compression for better build output
    reportCompressedSize: true,
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
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
