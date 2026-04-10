import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CompleteProfile from "./pages/CompleteProfile";
import PTDashboard from "./pages/PTDashboard";
import ProfileHistory from "./pages/ProfileHistory";
import Calculators from "./pages/Calculators";
import PTSettings from "./pages/PTSettings";
import NotFound from "./pages/NotFound";
import Activities from "./pages/Activities";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AppLayout>{children}</AppLayout></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login"            element={<Login />} />
          <Route path="/signup"           element={<Signup />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/"                 element={<P><PTDashboard /></P>} />
          <Route path="/profile"          element={<P><ProfileHistory /></P>} />
          <Route path="/calculators" element={<P><Calculators /></P>} />
          <Route path="/activities" element={<P><Activities /></P>} />
          <Route path="/settings"         element={<P><PTSettings /></P>} />
          <Route path="*"                 element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
