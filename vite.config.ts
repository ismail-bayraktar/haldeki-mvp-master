import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
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
          // Charts & visualization
          if (id.includes('recharts') || id.includes('embla-carousel')) {
            return 'charts';
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
