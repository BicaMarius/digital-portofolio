import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminProvider } from "@/contexts/AdminContext";
import { DataProvider } from "@/contexts/DataContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import WebDevelopment from "./pages/WebDevelopment";
import DigitalArt from "./pages/DigitalArt";
import Database from "./pages/Database";
import Photography from "./pages/Photography";
import AiMl from "./pages/AiMl";
import UiUxDesign from "./pages/UiUxDesign";
import TraditionalArt from "./pages/TraditionalArt";
import CreativeWriting from "./pages/CreativeWriting";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - datele rămân fresh mai mult timp
      gcTime: 1000 * 60 * 10, // 10 minutes - cache-ul persistă mai mult
    },
  },
});

// Component pentru prefetch-ul datelor la pornirea aplicației
const DataPrefetcher = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch toate datele importante la pornirea aplicației
    queryClient.prefetchQuery({
      queryKey: ['projects'],
      queryFn: api.getProjects,
    });

    queryClient.prefetchQuery({
      queryKey: ['galleryItems'],
      queryFn: api.getGalleryItems,
    });

    queryClient.prefetchQuery({
      queryKey: ['writings'],
      queryFn: api.getWritings,
    });

    queryClient.prefetchQuery({
      queryKey: ['albums', 'writings'],
      queryFn: () => api.getAlbums('writings'),
    });

    queryClient.prefetchQuery({
      queryKey: ['tags'],
      queryFn: api.getTags,
    });

    // Photo related options (locations & devices) for photography dashboard
    queryClient.prefetchQuery({
      queryKey: ['photoLocations'],
      queryFn: api.getPhotoLocations,
    });
    queryClient.prefetchQuery({
      queryKey: ['photoDevices'],
      queryFn: api.getPhotoDevices,
    });
  }, [queryClient]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DataPrefetcher />
    <AdminProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/web-dev" element={<WebDevelopment />} />
              <Route path="/digital-art" element={<DigitalArt />} />
              <Route path="/database" element={<Database />} />
              <Route path="/photography" element={<Photography />} />
              <Route path="/ai-ml" element={<AiMl />} />
              <Route path="/ui-ux" element={<UiUxDesign />} />
              <Route path="/traditional-art" element={<TraditionalArt />} />
              <Route path="/writing" element={<CreativeWriting />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AdminProvider>
  </QueryClientProvider>
);

export default App;
