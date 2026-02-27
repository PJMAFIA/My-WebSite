import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase'; 

/* =======================
   CONSTANTS & TYPES
======================= */

export type CurrencyType = 'USD' | 'GBP' | 'INR' | 'PKR' | 'BDT' | 'NPR';

// ✅ Centralized Exchange Rates (Must match MainLayout & Dashboard)
export const exchangeRates: Record<string, number> = { 
  USD: 1, 
  GBP: 0.79, 
  INR: 83.50, 
  PKR: 278.00, 
  BDT: 117.00,
  NPR: 133.00
};

export interface PriceStructure {
  '1_day': number;
  '7_days': number;
  '30_days': number;
  'lifetime': number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  balance: number;
  country?: string; 
  currency?: CurrencyType; 
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  images: string[];
  prices: PriceStructure; 
  currency_prices?: {
    GBP?: PriceStructure;
    INR?: PriceStructure;
    PKR?: PriceStructure;
    BDT?: PriceStructure;
    NPR?: PriceStructure;
  };
  softwareDownloadLink?: string;
  tutorialVideoLink?: string;
  applyProcess?: string;
  
  // ✅ NEW: Trial Fields
  is_trial?: boolean;
  trial_hours?: number;
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  // ✅ ADDED 'trial' to Plan Type
  plan: '1_day' | '7_days' | '30_days' | 'lifetime' | 'trial';
  price: number;
  currency?: string; 
  status: 'pending' | 'completed' | 'rejected';
  // ✅ ADDED 'free_trial' to Payment Method
  paymentMethod: 'upi' | 'crypto' | 'bank_transfer' | 'paypal' | 'free_trial';
  transactionId: string;
  paymentScreenshot?: string;
  createdAt: string;
  completedAt?: string;
  licenseKey?: string;
  softwareDownloadLink?: string;
  // ✅ Logic support for Admin Dashboard display
  userName?: string;
  userEmail?: string;
  productName?: string;
}

export interface BalanceRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency?: string; 
  paymentMethod: 'upi' | 'crypto' | 'bank_transfer' | 'paypal';
  transactionId: string;
  paymentScreenshot?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
}

export interface License {
  id: string;
  key: string;
  productId: string;
  userId?: string;
  status: 'unused' | 'assigned' | 'expired' | 'revoked';
  createdAt: string;
  assignedAt?: string;
}

/* =======================
   AUTH STORE
======================= */

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentCurrency: CurrencyType; 
  
  login: (user: User, token: string) => void;
  logout: () => Promise<void>; 
  reset: () => void;
  updateBalance: (amount: number) => void;
  refreshUser: () => Promise<void>;
  setCurrency: (currency: CurrencyType) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      currentCurrency: 'USD', 

      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true, 
        currentCurrency: user.currency || 'USD' 
      }),

      reset: () => {
        set({ user: null, token: null, isAuthenticated: false, currentCurrency: 'USD' });
        sessionStorage.clear(); 
      },

      logout: async () => {
        try { await supabase.auth.signOut(); } catch (error) { console.error("Supabase signOut failed", error); }
        get().reset(); 
      },

      updateBalance: (amount) =>
        set((state) => ({ user: state.user ? { ...state.user, balance: state.user.balance + amount } : null })),

      refreshUser: async () => {
        try {
          const res = await api.get('/users/me');
          set({ user: res.data.data });
        } catch (e) { console.error("Failed to refresh user", e); }
      },

      setCurrency: (currency) => set({ currentCurrency: currency }),
    }),
    { 
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage), 
    }
  )
);

/* =======================
   BALANCE REQUEST STORE
======================= */

interface BalanceRequestState {
  balanceRequests: BalanceRequest[];
  pendingAmount: number;
  isLoading: boolean;
  fetchRequests: () => Promise<void>; 
  fetchUserRequests: () => Promise<void>; 
  addBalanceRequest: (formData: FormData) => Promise<void>;
  updateBalanceRequestStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>;
}

export const useBalanceRequestStore = create<BalanceRequestState>((set) => ({
  balanceRequests: [],
  pendingAmount: 0,
  isLoading: false,

  fetchRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/balance/admin/all');
      const mapped = res.data.data.map((r: any) => ({
        id: r.id, userId: r.userId, userName: r.userName || 'Unknown', userEmail: r.userEmail || 'Unknown',
        amount: Number(r.amount), currency: r.currency || 'USD', paymentMethod: r.paymentMethod,
        transactionId: r.transactionId, paymentScreenshot: r.paymentScreenshot, status: r.status,
        createdAt: r.createdAt, processedAt: r.processedAt
      }));
      set({ balanceRequests: mapped });
    } finally { set({ isLoading: false }); }
  },

  fetchUserRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/balance/my-requests');
      const mapped = res.data.data.map((r: any) => ({
        id: r.id, userId: r.user_id, amount: Number(r.amount), currency: r.currency || 'USD',
        paymentMethod: r.paymentMethod, transactionId: r.transactionId, paymentScreenshot: r.paymentScreenshot,
        status: r.status, createdAt: r.createdAt, processedAt: r.processedAt
      }));
      
      // ✅ FIX: Normalize Pending Amount to USD before summing
      const pendingTotalUSD = mapped
        .filter((r: BalanceRequest) => r.status === 'pending')
        .reduce((sum: number, r: BalanceRequest) => {
           // Get rate for the transaction's specific currency
           const rate = exchangeRates[r.currency || 'USD'] || 1;
           // Convert this transaction to USD
           const amountInUSD = r.amount / rate;
           return sum + amountInUSD;
        }, 0);

      set({ balanceRequests: mapped, pendingAmount: pendingTotalUSD });
    } finally { set({ isLoading: false }); }
  },

  addBalanceRequest: async (formData) => {
    set({ isLoading: true });
    try { await api.post('/balance', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); } 
    finally { set({ isLoading: false }); }
  },

  updateBalanceRequestStatus: async (id, status) => {
    set({ isLoading: true });
    try {
      const endpoint = status === 'approved' ? 'approve' : 'reject';
      await api.patch(`/balance/${id}/${endpoint}`);
      set((state) => ({
        balanceRequests: state.balanceRequests.map((r) => r.id === id ? { ...r, status, processedAt: new Date().toISOString() } : r),
      }));
    } finally { set({ isLoading: false }); }
  },
}));

/* =======================
   PRODUCT & ORDER STORES
======================= */

interface ProductState {
  products: Product[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (formData: FormData) => Promise<void>;
  updateProduct: (id: string, updates: any) => Promise<void>; 
  deleteProduct: (id: string) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  isLoading: false,
  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/products');
      const mapped = res.data.data.map((p: any) => ({
        id: p.id, name: p.name, description: p.description, image: p.image_url || '/placeholder.svg',
        images: p.images && p.images.length > 0 ? p.images : [p.image_url || '/placeholder.svg'], 
        prices: {
          '1_day': Number(p.price_1_day), '7_days': Number(p.price_7_days),
          '30_days': Number(p.price_30_days), 'lifetime': Number(p.price_lifetime),
        },
        currency_prices: p.currency_prices || {}, 
        softwareDownloadLink: p.download_link, tutorialVideoLink: p.tutorial_video_link, applyProcess: p.activation_process,
        
        // ✅ CRITICAL ADDITION: Mapping Trial Data
        is_trial: p.is_trial,
        trial_hours: p.trial_hours
      }));
      set({ products: mapped });
    } finally { set({ isLoading: false }); }
  },
  addProduct: async (formData) => { set({ isLoading: true }); try { await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); } finally { set({ isLoading: false }); } },
  updateProduct: async (id, updates) => { set({ isLoading: true }); try { const headers = updates instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}; await api.put(`/products/${id}`, updates, { headers }); } finally { set({ isLoading: false }); } },
  deleteProduct: (id) => set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
}));

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: (isAdmin?: boolean) => Promise<void>;
  updateOrderStatus: (id: string, status: 'completed' | 'rejected') => Promise<void>;
  addOrder: (order: Order) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  isLoading: false,
 fetchOrders: async (isAdmin = false) => {
    set({ isLoading: true });
    try {
      const endpoint = isAdmin ? '/orders/admin/all' : '/orders/my-orders';
      const res = await api.get(endpoint);
      
      const rawData = res.data.data || [];

      set({
        orders: rawData.map((o: any) => ({
          id: o.id, 
          userId: o.user_id, 
          productId: o.product_id, 
          plan: o.plan,
          price: Number(o.price), 
          status: o.status, 
          paymentMethod: o.payment_method,
          transactionId: o.transaction_id, 
          paymentScreenshot: o.payment_screenshot_url,
          createdAt: o.created_at, 
          completedAt: o.updated_at, 
          licenseKey: o.extracted_license_key || o.licenses?.key || o.license_obj?.key || o.licenseKey || null, 
          softwareDownloadLink: o.products?.download_link, 
          // Mapping the manually stitched data from backend
          currency: o.users?.currency || o.currency || 'USD',
          userName: o.users?.full_name || 'System User',
          userEmail: o.users?.email || 'N/A',
          productName: o.products?.name || 'Unknown Asset'
        })),
      });
    } catch (error) {
       console.error("Store Fetch Error:", error);
       set({ orders: [] }); 
    } finally { set({ isLoading: false }); }
  },
  updateOrderStatus: async (id, status) => { set({ isLoading: true }); try { await api.patch(`/orders/${id}/status`, { status }); set((state) => ({ orders: state.orders.map((o) => o.id === id ? { ...o, status } : o) })); } finally { set({ isLoading: false }); } },
  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
}));

export const useLicenseStore = create<{ licenses: License[]; addLicense: (l: License) => void }>()(
  persist((set) => ({ licenses: [], addLicense: (license) => set((state) => ({ licenses: [...state.licenses, license] })) }), { name: 'license-storage' })
);

export const useCartStore = create<{ selectedProduct: Product | null; selectedPlan: '1_day' | '7_days' | '30_days' | 'lifetime' | null; setCart: (p: Product, plan: any) => void; clearCart: () => void; }>((set) => ({ selectedProduct: null, selectedPlan: null, setCart: (product, plan) => set({ selectedProduct: product, selectedPlan: plan }), clearCart: () => set({ selectedProduct: null, selectedPlan: null }), }));

/* =======================
   HELPERS
======================= */

export const generateLicenseKey = () => 'KEY-' + Math.random().toString(36).substring(2, 11).toUpperCase();

// ✅ UPDATED: Added 'trial' to Plan Helper
export const formatPlan = (plan: string) => ({ 
  '1_day': '1 Day', 
  '7_days': '7 Days', 
  '30_days': '30 Days', 
  'lifetime': 'Lifetime',
  'trial': 'Free Trial' 
}[plan] || plan);

export const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// ✅ Updated: Uses passed currency to calculate rate and symbol
export const formatPrice = (amountInUsd: number, currency: string = 'USD') => {
  const rate = exchangeRates[currency] || 1;
  const converted = amountInUsd * rate;
  let symbol = '$';
  switch (currency) {
    case 'GBP': symbol = '£'; break;
    case 'INR': symbol = '₹'; break;
    case 'PKR': symbol = 'Rs. '; break;
    case 'BDT': symbol = '৳'; break;
    case 'NPR': symbol = 'Rs. '; break; // ✅ Case for Nepal
  }
  return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getProductPrice = (product: Product, plan: string, currency: string = 'USD'): number => {
  if (currency === 'USD') return product.prices[plan as keyof PriceStructure] || 0;
  if (product.currency_prices?.[currency as CurrencyType]?.[plan as keyof PriceStructure]) {
    const local = product.currency_prices[currency as CurrencyType]![plan as keyof PriceStructure];
    return local > 0 ? local : 0;
  }
  // Fallback: Convert USD if no local price set
  const usdPrice = product.prices[plan as keyof PriceStructure] || 0;
  return usdPrice * (exchangeRates[currency] || 1);
};