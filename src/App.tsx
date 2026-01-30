import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import UserDashboard from "./pages/user/Dashboard";
import AddBalancePage from "./pages/user/AddBalancePage";
import BalanceHistoryPage from "./pages/user/BalanceHistoryPage";
import ShopPage from "./pages/shop/ShopPage";
import CheckoutPage from "./pages/checkout/CheckoutPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminBalancePage from "./pages/admin/AdminBalancePage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminLicensesPage from "./pages/admin/AdminLicensesPage";

const queryClient = new QueryClient();

// 🟢 Auth Wrapper: Handles Google Login Sync & Protection
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { login } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const syncUser = async (session: any) => {
      try {
        const token = session.access_token;
        
        // Call Backend to Sync User (This creates the user in DB if missing)
        const response = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (mounted) {
          // Update Global State
          login(response.data.data, token);
          
          // Redirect logic: If on public auth pages, go to dashboard
          if (['/login', '/register', '/'].includes(location.pathname)) {
            navigate('/dashboard');
          }
        }
      } catch (error: any) {
        console.error("❌ Sync Failed:", error);
        
        // If 401, the token is truly bad/expired. Log out to clear it.
        if (error.response?.status === 401) {
          await supabase.auth.signOut();
        }
      } finally {
        if (mounted) setIsChecking(false);
      }
    };

    // 1. Check for active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        syncUser(session);
      } else {
        setIsChecking(false);
      }
    });

    // 2. Listen for Auth Changes (Google Redirect triggers this)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsChecking(true);
        syncUser(session);
      } else if (event === 'SIGNED_OUT') {
        setIsChecking(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [login, navigate, location.pathname]);

  // Global Loading Screen
  if (isChecking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-primary">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse">Syncing Account...</p>
      </div>
    );
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthWrapper>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/shop" element={<ShopPage />} />

            {/* User Routes */}
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/products" element={<UserDashboard />} />
            <Route path="/orders" element={<UserDashboard />} />
            <Route path="/add-balance" element={<AddBalancePage />} />
            <Route path="/balance-history" element={<BalanceHistoryPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/balance" element={<AdminBalancePage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/licenses" element={<AdminLicensesPage />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;