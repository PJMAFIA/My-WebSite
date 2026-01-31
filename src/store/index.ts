import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase'; 

/* =======================
   TYPES
======================= */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  balance: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  images: string[];
  prices: {
    '1_day': number;
    '7_days': number;
    '30_days': number;
    'lifetime': number;
  };
  softwareDownloadLink?: string;
  tutorialVideoLink?: string;
  applyProcess?: string;
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

export interface Order {
  id: string;
  userId: string;
  productId: string;
  plan: '1_day' | '7_days' | '30_days' | 'lifetime';
  price: number;
  status: 'pending' | 'completed' | 'rejected';
  paymentMethod: 'upi' | 'crypto' | 'bank_transfer' | 'paypal';
  transactionId: string;
  paymentScreenshot?: string;
  createdAt: string;
  completedAt?: string;
  licenseKey?: string;
  softwareDownloadLink?: string;
}

export interface BalanceRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  paymentMethod: 'upi' | 'crypto' | 'bank_transfer' | 'paypal';
  transactionId: string;
  paymentScreenshot?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
}

/* =======================
   AUTH STORE
======================= */

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>; 
  reset: () => void;
  updateBalance: (amount: number) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      reset: () => {
        set({ user: null, token: null, isAuthenticated: false });
        sessionStorage.clear(); 
      },

      logout: async () => {
        try {
          await supabase.auth.signOut(); 
        } catch (error) {
          console.error("Supabase signOut failed", error);
        }
        get().reset(); 
      },

      updateBalance: (amount) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, balance: state.user.balance + amount }
            : null,
        })),

      refreshUser: async () => {
        try {
          const res = await api.get('/users/me');
          console.log("💰 User Refresh Data:", res.data.data);
          set({ user: res.data.data });
        } catch (e) {
          console.error("Failed to refresh user", e);
        }
      }
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
  isLoading: boolean;
  fetchRequests: () => Promise<void>; 
  fetchUserRequests: () => Promise<void>; 
  addBalanceRequest: (formData: FormData) => Promise<void>;
  updateBalanceRequestStatus: (
    id: string,
    status: 'approved' | 'rejected'
  ) => Promise<void>;
}

export const useBalanceRequestStore = create<BalanceRequestState>((set) => ({
  balanceRequests: [],
  isLoading: false,

  fetchRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/balance/admin/all');
      const mapped = res.data.data.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        userName: r.userName || 'Unknown',
        userEmail: r.userEmail || 'Unknown',
        amount: Number(r.amount),
        paymentMethod: r.paymentMethod,
        transactionId: r.transactionId,
        paymentScreenshot: r.paymentScreenshot,
        status: r.status,
        createdAt: r.createdAt,
        processedAt: r.processedAt
      }));
      set({ balanceRequests: mapped });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/balance/my-requests');
      const mapped = res.data.data.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        amount: Number(r.amount),
        paymentMethod: r.paymentMethod,
        transactionId: r.transactionId,
        paymentScreenshot: r.paymentScreenshot,
        status: r.status,
        createdAt: r.createdAt,
        processedAt: r.processedAt
      }));
      set({ balanceRequests: mapped });
    } finally {
      set({ isLoading: false });
    }
  },

  addBalanceRequest: async (formData) => {
    set({ isLoading: true });
    try {
      await api.post('/balance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateBalanceRequestStatus: async (id, status) => {
    set({ isLoading: true });
    try {
      const endpoint = status === 'approved' ? 'approve' : 'reject';
      await api.patch(`/balance/${id}/${endpoint}`);
      set((state) => ({
        balanceRequests: state.balanceRequests.map((r) =>
          r.id === id ? { ...r, status, processedAt: new Date().toISOString() } : r
        ),
      }));
    } finally {
      set({ isLoading: false });
    }
  },
}));

/* =======================
   PRODUCT STORE
======================= */

interface ProductState {
  products: Product[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (formData: FormData) => Promise<void>;
  updateProduct: (id: string, updates: any) => Promise<void>; // ✅ Updated Signature
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
        id: p.id,
        name: p.name,
        description: p.description,
        image: p.image_url || '/placeholder.svg',
        images: p.images && p.images.length > 0 ? p.images : [p.image_url || '/placeholder.svg'], 
        prices: {
          '1_day': Number(p.price_1_day),
          '7_days': Number(p.price_7_days),
          '30_days': Number(p.price_30_days),
          'lifetime': Number(p.price_lifetime),
        },
        softwareDownloadLink: p.download_link,
        tutorialVideoLink: p.tutorial_video_link,
        applyProcess: p.activation_process,
      }));
      set({ products: mapped });
    } finally {
      set({ isLoading: false });
    }
  },

  addProduct: async (formData) => {
    set({ isLoading: true });
    try {
      await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Refresh list handled by caller or we can auto-fetch
    } finally {
      set({ isLoading: false });
    }
  },

  // ✅ FIXED: Calls API PUT request
  updateProduct: async (id, updates) => {
    set({ isLoading: true });
    try {
      // Check if 'updates' is FormData (for files) or just JSON
      const isFormData = updates instanceof FormData;
      const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};

      await api.put(`/products/${id}`, updates, { headers });
      
      // We don't manually update local state here because the Admin Page 
      // calls fetchProducts() immediately after this succeeds.
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
}));

/* =======================
   ORDER STORE
======================= */

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: (isAdmin?: boolean) => Promise<void>;
  updateOrderStatus: (
    id: string,
    status: 'completed' | 'rejected'
  ) => Promise<void>;
  addOrder: (order: Order) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  isLoading: false,

  fetchOrders: async (isAdmin = false) => {
    set({ isLoading: true });
    try {
      const endpoint = isAdmin
        ? '/orders/admin/all'
        : '/orders/my-orders';
      const res = await api.get(endpoint);

      set({
        orders: res.data.data.map((o: any) => ({
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
          licenseKey: o.licenses?.key || o.licenseKey || null, 
          softwareDownloadLink: o.products?.download_link,
        })),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateOrderStatus: async (id, status) => {
    set({ isLoading: true });
    try {
      await api.patch(`/orders/${id}/status`, { status });
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, status } : o
        ),
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  addOrder: (order) =>
    set((state) => ({ orders: [...state.orders, order] })),
}));

/* =======================
   CART & LICENSE STORES
======================= */

export const useLicenseStore = create<{ licenses: License[]; addLicense: (l: License) => void }>()(
  persist(
    (set) => ({
      licenses: [],
      addLicense: (license) => set((state) => ({ licenses: [...state.licenses, license] })),
    }),
    { name: 'license-storage' }
  )
);

export const useCartStore = create<{
  selectedProduct: Product | null;
  selectedPlan: '1_day' | '7_days' | '30_days' | 'lifetime' | null;
  setCart: (p: Product, plan: any) => void;
  clearCart: () => void;
}>((set) => ({
  selectedProduct: null,
  selectedPlan: null,
  setCart: (product, plan) => set({ selectedProduct: product, selectedPlan: plan }),
  clearCart: () => set({ selectedProduct: null, selectedPlan: null }),
}));

/* =======================
   HELPERS
======================= */

export const generateLicenseKey = () =>
  'KEY-' + Math.random().toString(36).substring(2, 11).toUpperCase();

export const formatPlan = (plan: string) =>
  ({
    '1_day': '1 Day',
    '7_days': '7 Days',
    '30_days': '30 Days',
    'lifetime': 'Lifetime',
  }[plan] || plan);

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });