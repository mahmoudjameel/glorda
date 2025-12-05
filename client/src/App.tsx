import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, ProtectedRoute } from "@/hooks/useAuth";

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
import AdminPendingMerchants from "@/pages/admin/PendingMerchants";
import AdminAdmins from "@/pages/admin/Admins";
import AdminLogin from "@/pages/admin/Login";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />

      {/* Merchant Routes - Protected */}
      <Route path="/dashboard">
        <ProtectedRoute requiredRole="merchant">
          <MerchantDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/products">
        <ProtectedRoute requiredRole="merchant">
          <MerchantProducts />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/wallet">
        <ProtectedRoute requiredRole="merchant">
          <MerchantWallet />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/socials">
        <ProtectedRoute requiredRole="merchant">
          <MerchantSocials />
        </ProtectedRoute>
      </Route>
      
      {/* Admin Routes - Protected */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/pending">
        <ProtectedRoute requiredRole="admin">
          <AdminPendingMerchants />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/merchants">
        <ProtectedRoute requiredRole="admin">
          <AdminMerchants />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/admins">
        <ProtectedRoute requiredRole="admin">
          <AdminAdmins />
        </ProtectedRoute>
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
