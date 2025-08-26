import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import DrugDatabase from "./pages/DrugDatabase";
import SentimentAnalysis from "./pages/SentimentAnalysis";
import Forecasting from "./pages/Forecasting";
import Formulary from "./pages/Formulary";
import Scenarios from "./pages/Scenarios";
import Providers from "./pages/Providers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          } />
          <Route path="/drugs" element={
            <AppLayout>
              <DrugDatabase />
            </AppLayout>
          } />
          <Route path="/sentiment" element={
            <AppLayout>
              <SentimentAnalysis />
            </AppLayout>
          } />
          <Route path="/forecasting" element={
            <AppLayout>
              <Forecasting />
            </AppLayout>
          } />
          <Route path="/formulary" element={
            <AppLayout>
              <Formulary />
            </AppLayout>
          } />
          {/* <Route path="/scenarios" element={
            <AppLayout>
              <Scenarios />
            </AppLayout>
          } /> */}
          {/* <Route path="/providers" element={
            <AppLayout>
              <Providers />
            </AppLayout>
          } /> */}
          {/* <Route path="/adherence" element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          } /> */}
          {/* <Route path="/reports" element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          } /> */}
          {/* <Route path="/settings" element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          } /> */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;
