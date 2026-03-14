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
import ShopPage from "./pages/shop/ShopPage";
import ProductDetailsPage from "./pages/shop/ProductDetailsPage"; // ✅ NEW PAGE IMPORT
import CheckoutPage from "./pages/checkout/CheckoutPage";

// User Pages
import UserDashboard from "./pages/user/Dashboard";
import MyProductsPage from "./pages/user/MyProductsPage";
import OrderHistoryPage from "./pages/user/OrderHistoryPage";
import AddBalancePage from "./pages/user/AddBalancePage";
import BalanceHistoryPage from "./pages/user/BalanceHistoryPage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminBalancePage from "./pages/admin/AdminBalancePage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminLicensesPage from "./pages/admin/AdminLicensesPage";
import AdminResetsPage from "./pages/admin/AdminResetsPage";
import AdminPromosPage from "./pages/admin/AdminPromosPage";
import AdminAnnouncementPage from "./pages/admin/AdminAnnouncementPage"; 

const queryClient = new QueryClient();

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
        const response = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
        if (mounted) {
          login(response.data.data, token);
          if (['/login', '/register', '/'].includes(location.pathname)) navigate('/dashboard');
        }
      } catch (error: any) {
        if (error.response?.status === 401) await supabase.auth.signOut();
      } finally {
        if (mounted) setIsChecking(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) syncUser(session); else setIsChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) { setIsChecking(true); syncUser(session); } 
      else if (event === 'SIGNED_OUT') setIsChecking(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [login, navigate, location.pathname]);

  if (isChecking) return <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-primary"><Loader2 className="h-12 w-12 animate-spin mb-4" /><p className="text-muted-foreground animate-pulse">Syncing Account...</p></div>;

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
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/product/:id" element={<ProductDetailsPage />} /> {/* ✅ NEW ROUTE */}

              {/* User Routes */}
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/products" element={<MyProductsPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
              <Route path="/add-balance" element={<AddBalancePage />} />
              <Route path="/balance-history" element={<BalanceHistoryPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/balance" element={<AdminBalancePage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
              <Route path="/admin/licenses" element={<AdminLicensesPage />} />
              <Route path="/admin/resets" element={<AdminResetsPage />} />
              <Route path="/admin/promos" element={<AdminPromosPage />} />
              <Route path="/admin/announcement" element={<AdminAnnouncementPage />} /> 

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthWrapper>
        </BrowserRouter>
      </TooltipProvider>
   
  </QueryClientProvider>
);

export default App;