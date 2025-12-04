import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

// Merchant Pages
import MerchantDashboard from "@/pages/merchant/Dashboard";
import MerchantProducts from "@/pages/merchant/Products";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminMerchants from "@/pages/admin/Merchants";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />

      {/* Merchant Routes */}
      <Route path="/dashboard" component={MerchantDashboard} />
      <Route path="/dashboard/products" component={MerchantProducts} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/merchants" component={AdminMerchants} />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
