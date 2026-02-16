import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Dashboard from "@/pages/Dashboard";
import Proposals from "@/pages/Proposals";
import ProposalsList from "@/pages/ProposalsList";
import ProposalForm from "@/pages/ProposalForm";
import ProposalDetail from "@/pages/ProposalDetail";
import EvaluationForm from "@/pages/EvaluationForm";
import Evaluations from "@/pages/Evaluations";
import Admin from "@/pages/Admin";
import AdminPanel from "@/pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <NotificationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/proposals" element={<Proposals />} />
              <Route path="/proposals/new" element={<ProposalForm />} />
              <Route path="/proposals/list" element={<ProposalsList />} />
              <Route path="/proposals/:id" element={<ProposalDetail />} />
              <Route path="/evaluations" element={<Evaluations />} />
              <Route path="/evaluations/:id" element={<EvaluationForm />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/panel" element={<AdminPanel />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
