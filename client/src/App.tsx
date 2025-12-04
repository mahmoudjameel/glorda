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
import MerchantWallet from "@/pages/merchant/Wallet";
import MerchantSocials from "@/pages/merchant/Socials";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminMerchants from "@/pages/admin/Merchants";
import AdminAdmins from "@/pages/admin/Admins";
import AdminLogin from "@/pages/admin/Login";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />

      {/* Merchant Routes */}
      <Route path="/dashboard" component={MerchantDashboard} />
      <Route path="/dashboard/products" component={MerchantProducts} />
      <Route path="/dashboard/wallet" component={MerchantWallet} />
      <Route path="/dashboard/socials" component={MerchantSocials} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/merchants" component={AdminMerchants} />
      <Route path="/admin/admins" component={AdminAdmins} />

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
