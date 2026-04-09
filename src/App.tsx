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
import BmiCalculator from "./pages/BmiCalculator";
import IpptCalculator from "./pages/IpptCalculator";
import CalorieCalculator from "./pages/CalorieCalculator";
import Leaderboard from "./pages/Leaderboard";
import SpartanSubmissions from "./pages/SpartanSubmissions";
import TrainingSchedule from "./pages/TrainingSchedule";
import TrainingProgrammes from "./pages/TrainingProgrammes";
import Reminders from "./pages/Reminders";
import TemperatureIft from "./pages/TemperatureIft";
import PtAttendance from "./pages/PtAttendance";
import PTSettings from "./pages/PTSettings";
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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/" element={<P><PTDashboard /></P>} />
          <Route path="/profile" element={<P><ProfileHistory /></P>} />
          <Route path="/bmi" element={<P><BmiCalculator /></P>} />
          <Route path="/ippt" element={<P><IpptCalculator /></P>} />
          <Route path="/calories" element={<P><CalorieCalculator /></P>} />
          <Route path="/leaderboard" element={<P><Leaderboard /></P>} />
          <Route path="/spartan" element={<P><SpartanSubmissions /></P>} />
          <Route path="/schedule" element={<P><TrainingSchedule /></P>} />
          <Route path="/programmes" element={<P><TrainingProgrammes /></P>} />
          <Route path="/reminders" element={<P><Reminders /></P>} />
          <Route path="/temperature" element={<P><TemperatureIft /></P>} />
          <Route path="/attendance" element={<P><PtAttendance /></P>} />
          <Route path="/settings" element={<P><PTSettings /></P>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
