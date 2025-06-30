import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ScanHistory from "./pages/ScanHistory";
import Admin from "./pages/Admin";
import Login from "./pages/Login"; // Import Login page
import Navbar from "./components/Navbar";
import { SessionContextProvider } from "./integrations/supabase/auth"; // Import SessionContextProvider

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider> {/* Wrap the app with SessionContextProvider */}
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/history" element={<ScanHistory />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} /> {/* Add Login route */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;