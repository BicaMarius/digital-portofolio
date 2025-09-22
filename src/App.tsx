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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AdminProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
