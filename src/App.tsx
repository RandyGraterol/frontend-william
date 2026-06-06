import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import ProposalsList from "@/pages/ProposalsList";
import ProposalsTracking from "@/pages/ProposalsTracking";
import ProposalTrackingDetail from "@/pages/ProposalTrackingDetail";
import ProposalForm from "@/pages/ProposalForm";
import ProposalDetail from "@/pages/ProposalDetail";
import ProposalObjectives from "@/pages/ProposalObjectives";
import EvaluationForm from "@/pages/EvaluationForm";
import Evaluations from "@/pages/Evaluations";
import EvaluatorDashboard from "@/pages/EvaluatorDashboard";
import EvaluatorProfile from "@/pages/EvaluatorProfile";
import ProponenteDashboard from "@/pages/ProponenteDashboard";
import Notificaciones from "@/pages/Notificaciones";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import AdminPanel from "@/pages/AdminPanel";
import AdminUsers from "@/pages/AdminUsers";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes with MainLayout */}
              {/* Outer wrapper: only checks authentication */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>

                  {/* ── All authenticated users ── */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/home" element={<Dashboard />} />
                  <Route path="/proposals" element={<ProposalsList />} />
                  <Route path="/proposals/list" element={<ProposalsList />} />
                  <Route path="/proposals/:id" element={<ProposalDetail />} />
                  <Route path="/notificaciones" element={<Notificaciones />} />
                  <Route path="/profile" element={<Profile />} />

                  {/* ── All authenticated users ── */}
                  <Route path="/proposals/:id/tracking" element={<ProposalTrackingDetail />} />

                  {/* ── Proponente only ── */}
                  <Route element={<ProtectedRoute allowedRoles={['proponente']} />}>
                    <Route path="/proposals/new" element={<ProposalForm />} />
                    <Route path="/proposals/:id/edit" element={<ProposalForm />} />
                    <Route path="/proposals/tracking" element={<ProposalsTracking />} />
                    <Route path="/proposals/:id/objectives" element={<ProposalObjectives />} />
                    <Route path="/proponente/dashboard" element={<ProponenteDashboard />} />
                  </Route>

                  {/* ── Evaluador + Admin ── */}
                  <Route element={<ProtectedRoute allowedRoles={['evaluador', 'administrador']} />}>
                    <Route path="/evaluations" element={<Evaluations />} />
                    <Route path="/evaluations/:id" element={<EvaluationForm />} />
                  </Route>

                  {/* ── Evaluador only ── */}
                  <Route element={<ProtectedRoute allowedRoles={['evaluador']} />}>
                    <Route path="/evaluator" element={<EvaluatorDashboard />} />
                    <Route path="/evaluator/dashboard" element={<EvaluatorDashboard />} />
                    <Route path="/evaluator/profile" element={<EvaluatorProfile />} />
                  </Route>

                  {/* ── Administrador only ── */}
                  <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/panel" element={<AdminPanel />} />
                    <Route path="/admin/usuarios" element={<AdminUsers />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
