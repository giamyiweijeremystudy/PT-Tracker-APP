import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { TeamProvider } from "./contexts/TeamContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CompleteProfile from "./pages/CompleteProfile";
import PTDashboard from "./pages/PTDashboard";
import ProfileHistory from "./pages/ProfileHistory";
import Calculators from "./pages/Calculators";
import Activities from "./pages/Activities";
import Teams from "./pages/Teams";
import PTSettings from "./pages/PTSettings";
import Schedule from "./pages/Schedule";
import Chat from "./pages/Chat";
import TrainingProgrammes from "./pages/TrainingProgrammes";
import UsefulInfo from "./pages/UsefulInfo";
import NotFound from "./pages/NotFound";

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
        <TeamProvider>
          <Routes>
            <Route path="/login"            element={<Login />} />
            <Route path="/signup"           element={<Signup />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/"                 element={<P><PTDashboard /></P>} />
            <Route path="/profile"          element={<P><ProfileHistory /></P>} />
            <Route path="/calculators"      element={<P><Calculators /></P>} />
            <Route path="/activities"       element={<P><Activities /></P>} />
            <Route path="/teams"            element={<P><Teams /></P>} />
            <Route path="/settings"         element={<P><PTSettings /></P>} />
            <Route path="/schedule"         element={<P><Schedule /></P>} />
            <Route path="/programs"        element={<P><TrainingProgrammes /></P>} />
            <Route path="/useful-info"       element={<P><UsefulInfo /></P>} />
            <Route path="/chat"            element={<P><Chat /></P>} />
            <Route path="*"                 element={<NotFound />} />
          </Routes>
        </TeamProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
