import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

// Optimized QueryClient configuration for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 10, // 10 minutes - cache cleanup
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App queryClient={queryClient} />
  </React.StrictMode>
);