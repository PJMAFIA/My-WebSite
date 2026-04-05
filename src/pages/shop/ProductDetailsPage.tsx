import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ShoppingBag, ShieldCheck, Zap, ShieldAlert, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductStore, useCartStore, useAuthStore, formatPlan } from '@/store';

type PlanType = '1_day' | '7_days' | '30_days' | 'lifetime';
type CurrencyType = 'USD' | 'GBP' | 'INR' | 'PKR' | 'BDT' | 'NPR';

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { products, fetchProducts, isLoading } = useProductStore();
  const { setCart } = useCartStore();
  const { isAuthenticated, currentCurrency } = useAuthStore();
  
  const currency = (currentCurrency as CurrencyType) || 'USD';
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('30_days');
  const [activeImage, setActiveImage] = useState<string>('');

  const product = products.find(p => p.id === id);

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products.length]);

  useEffect(() => {
    if (product) {
      const planOptions: PlanType[] = ['1_day', '7_days', '30_days', 'lifetime'];
      const firstAvailablePlan = planOptions.find(plan => getPrice(product, plan) > 0);
      if (firstAvailablePlan) setSelectedPlan(firstAvailablePlan);
      
      setActiveImage(product.images?.[0] || product.image || '/placeholder.svg');
    }
  }, [product]);

  const getPrice = (prod: any, plan: string): number => {
    if (currency === 'USD') return prod.prices[plan] || 0;
    if (prod.currency_prices?.[currency]?.[plan]) return prod.currency_prices[currency][plan];
    return 0;
  };

  const formatPrice = (price: number) => {
    switch (currency) {
      case 'GBP': return `£${price.toFixed(2)}`;
      case 'INR': return `₹${price.toLocaleString()}`;
      case 'PKR': return `Rs. ${price.toLocaleString()}`;
      case 'BDT': return `৳${price.toLocaleString()}`;
      case 'NPR': return `Rs. ${price.toLocaleString()}`;
      default: return `$${price.toFixed(2)}`;
    }
  };

  if (isLoading && !product) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          <p className="text-gray-400">Loading product details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <ShieldAlert className="h-12 w-12 text-red-500" />
          <h2 className="text-2xl font-bold text-white">Product Not Found</h2>
          <Button variant="outline" onClick={() => navigate('/shop')} className="mt-4">Return to Store</Button>
        </div>
      </MainLayout>
    );
  }

  const currentPrice = getPrice(product, selectedPlan);
  const hasValidPlans = (['1_day', '7_days', '30_days', 'lifetime'] as PlanType[]).some(plan => getPrice(product, plan) > 0);

  const handleBuyNow = () => {
    setCart(product, selectedPlan);
    if (isAuthenticated) { navigate('/checkout'); } else { navigate('/login'); }
  };

  const allImages = product.images?.length > 0 ? product.images : product.image ? [product.image] : [];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8">
        
        <Button variant="ghost" onClick={() => navigate('/shop')} className="mb-8 text-gray-400 hover:text-white hover:bg-white/5">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Store
        </Button>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Left Column: Images */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="w-full aspect-[4/3] rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl relative">
               <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
               <img src={activeImage} alt={product.name} className="w-full h-full object-contain p-6 relative z-10 drop-shadow-2xl" />
            </div>
            
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-cyan-400 scale-105' : 'border-white/5 border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover bg-black/50" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right Column: Details & Checkout */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
            
            <div className="mb-6">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">{product.name}</h1>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Status: Undetected
                </span>
                <span className="flex items-center gap-1.5 text-sm font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                  <Zap className="h-4 w-4" /> Instant Delivery
                </span>
              </div>
            </div>

            {/* ✅ THIS IS WHERE THE DESCRIPTION Renders Perfectly */}
            <div className="prose prose-invert max-w-none mb-10">
              <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Sticky Checkout Block */}
            <div className="mt-auto bg-black/40 border border-white/[0.08] p-6 sm:p-8 rounded-2xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
              
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Select License Duration</label>
                <Select value={selectedPlan} onValueChange={(val: PlanType) => setSelectedPlan(val)} disabled={!hasValidPlans}>
                  <SelectTrigger className="h-14 text-base bg-white/[0.02] border-white/10 text-white rounded-xl focus:ring-cyan-400/30">
                    <SelectValue placeholder={hasValidPlans ? "" : "Out of Stock"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1219] border-white/10 text-white backdrop-blur-2xl">
                    {(['1_day', '7_days', '30_days', 'lifetime'] as PlanType[]).map((plan) => {
                      const p = getPrice(product, plan);
                      if (p <= 0) return null; 
                      return (
                        <SelectItem key={plan} value={plan} className="text-base py-3 focus:text-cyan-400 focus:bg-cyan-400/10 cursor-pointer">
                          {formatPlan(plan)} <span className="text-gray-500 mx-2">|</span> {formatPrice(p)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end justify-between mb-8 pb-8 border-b border-white/10">
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Price</p>
                  <span className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                    {hasValidPlans ? formatPrice(currentPrice) : "N/A"}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleBuyNow}
                disabled={!hasValidPlans}
                className="w-full h-16 text-lg font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-none shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all rounded-xl disabled:opacity-50 disabled:shadow-none"
              >
                <ShoppingBag className="mr-2 h-6 w-6" /> 
                {hasValidPlans ? "Purchase & Deploy" : "Out of Stock"}
              </Button>
              
              <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure checkout & instant automated key delivery
              </p>
            </div>

          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}