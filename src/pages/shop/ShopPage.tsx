import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Search, Loader2, ChevronLeft, ChevronRight, Gift, Zap, Package, ArrowRight, Sparkles 
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductStore, useCartStore, useAuthStore, formatPlan } from '@/store';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

type PlanType = '1_day' | '7_days' | '30_days' | 'lifetime';
type CurrencyType = 'USD' | 'GBP' | 'INR' | 'PKR' | 'BDT' | 'NPR';

// --- 🌟 Dedicated Slider Component ---
const ProductImageSlider = ({ images, name }: { images: string[]; name: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 })
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => (prevIndex + newDirection + images.length) % images.length);
  };

  const hasMultiple = images.length > 1;

  return (
    <div className="relative w-full h-52 overflow-hidden bg-black/30 group">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none z-10" />

      <AnimatePresence initial={false} custom={direction}>
        {images && images.length > 0 ? (
           <motion.img
           key={currentIndex}
           src={images[currentIndex]}
           alt={`${name} - ${currentIndex + 1}`}
           custom={direction}
           variants={slideVariants}
           initial="enter"
           animate="center"
           exit="exit"
           transition={{ duration: 0.3, ease: 'easeOut' }}
           className="absolute inset-0 w-full h-full object-contain p-2"
         />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
               <span className="text-2xl font-bold text-cyan-400">{name.charAt(0)}</span>
             </div>
          </div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none" />

      {hasMultiple && (
        <>
          <button onClick={(e) => { e.stopPropagation(); paginate(-1); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/80 hover:border-cyan-400/40 z-30"><ChevronLeft size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); paginate(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/80 hover:border-cyan-400/40 z-30"><ChevronRight size={16} /></button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-30">
            {images.map((_, idx) => (
              <div key={idx} className={`transition-all duration-200 rounded-full ${idx === currentIndex ? 'w-4 h-1.5 bg-cyan-400' : 'w-1.5 h-1.5 bg-white/30'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function ShopPage() {
  const navigate = useNavigate();
  const { products, fetchProducts, isLoading } = useProductStore();
  const { setCart } = useCartStore();
  const { isAuthenticated, currentCurrency } = useAuthStore(); 
  const { toast } = useToast();
  const currency = currentCurrency as CurrencyType;

  const [search, setSearch] = useState('');
  const [selectedPlans, setSelectedPlans] = useState<Record<string, PlanType>>({});
  const [claimingTrial, setClaimingTrial] = useState<string | null>(null);
  
  const [userTrials, setUserTrials] = useState<any[]>([]);

  // Helper to get raw price
  const getPrice = (product: any, plan: string): number => {
    if (currency === 'USD') return product.prices[plan] || 0;
    if (product.currency_prices?.[currency]?.[plan]) return product.currency_prices[currency][plan];
    return 0;
  };

  useEffect(() => {
    fetchProducts();
    if (isAuthenticated) {
      fetchUserTrials();
    }
  }, [fetchProducts, isAuthenticated]);

  // ✅ FIXED: Dynamically set the default plan to the first one that is NOT $0
  useEffect(() => {
    const initial: Record<string, PlanType> = {};
    const planOptions: PlanType[] = ['1_day', '7_days', '30_days', 'lifetime'];
    
    products.forEach(p => { 
        // Find the first plan that actually has a price > 0
        const firstAvailablePlan = planOptions.find(plan => getPrice(p, plan) > 0);
        initial[p.id] = firstAvailablePlan || '30_days'; // Fallback just in case
    });
    setSelectedPlans(initial);
  }, [products, currency]);

  const fetchUserTrials = async () => {
    try {
      const response = await api.get('/orders/my-orders');
      if (response.data.status === 'success') {
        const trials = response.data.data.filter((order: any) => order.plan === 'trial');
        setUserTrials(trials);
      }
    } catch (error) {
      console.error("Error fetching user trials:", error);
    }
  };

  const isTrialActive = (productId: string, trialHours: number) => {
    const trialOrder = userTrials.find(t => t.product_id === productId);
    if (!trialOrder) return false;

    const startTime = new Date(trialOrder.created_at).getTime();
    const expiryTime = startTime + (trialHours * 60 * 60 * 1000);
    const currentTime = new Date().getTime();

    return currentTime < expiryTime;
  };

  const hasUsedTrial = (productId: string) => {
    return userTrials.some(t => t.product_id === productId);
  };

  const filteredProducts = products?.filter((p) => {
    const searchLower = search.toLowerCase();
    return p?.name?.toLowerCase().includes(searchLower) || p?.description?.toLowerCase().includes(searchLower);
  }) || [];

  const handleBuyNow = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const plan = selectedPlans[productId] || '30_days';
    if (product) {
      setCart(product, plan);
      if (isAuthenticated) { navigate('/checkout'); } else { navigate('/login'); }
    }
  };

  const handleClaimTrial = async (productId: string) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    
    setClaimingTrial(productId);
    try {
        const response = await api.post('/orders/claim-trial', { productId });
        if (response.data.status === 'success') {
            toast({ title: "Success!", description: "Free trial claimed. Check your dashboard.", className: "bg-green-500 text-white" });
            fetchUserTrials(); 
            navigate('/dashboard');
        }
    } catch (error: any) {
        toast({ title: "Failed", description: error.response?.data?.message || "Could not claim trial.", variant: "destructive" });
    } finally {
        setClaimingTrial(null);
    }
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

  return (
    <MainLayout>
      <div className="relative min-h-[calc(100vh-4rem)]">
        
        <motion.div
          className="relative z-10 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={20} className="text-cyan-400 drop-shadow-[0_0_6px_rgba(0,240,255,0.6)]" />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/30 via-cyan-400/10 to-transparent" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Premium{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">Software</span>{' '}
              Store
            </h1>
            <p className="mt-2 text-gray-400 text-lg font-medium">
              Elite tools. Instant access. No compromise.
            </p>
          </motion.div>

          {/* ── Search Bar ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12, ease: 'easeOut' }}
            className="mb-8"
          >
            <div className="relative max-w-lg">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus-visible:ring-cyan-400/30 focus-visible:border-cyan-400/50 transition-all duration-200 rounded-xl"
              />
              {search && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-cyan-400 font-semibold"
                >
                  {filteredProducts.length} found
                </motion.span>
              )}
            </div>
          </motion.div>

          {/* ── Loading ──────────────────────────────────────────────────────── */}
          {isLoading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-16 h-16 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-cyan-400" />
              </div>
              <p className="text-gray-400 font-medium tracking-wide">Loading products...</p>
            </div>
          )}

          {/* ── Products Grid ─────────────────────────────────────────────────── */}
          {(!isLoading && products.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, i) => {
                const prod = product as any;
                const selectedPlan = selectedPlans[product.id] || '30_days';
                const currentPrice = getPrice(product, selectedPlan);
                
                const trialIsActive = isTrialActive(product.id, prod.trial_hours);
                const trialAlreadyUsed = hasUsedTrial(product.id);

                // ✅ Check if the product has ANY valid plans
                const hasValidPlans = (['1_day', '7_days', '30_days', 'lifetime'] as PlanType[]).some(plan => getPrice(product, plan) > 0);

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 28, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
                    className="bg-white/[0.02] border border-white/[0.05] rounded-xl flex flex-col group relative overflow-hidden backdrop-blur-md hover:border-cyan-400/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,240,255,0.05)]"
                  >
                    {/* Shine overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.05] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

                    {/* Status badges */}
                    <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                      {prod.is_trial && !trialAlreadyUsed && (
                        <span className="bg-purple-500/20 border border-purple-500/50 text-purple-400 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-lg backdrop-blur-md">
                          <Gift size={10} />
                          FREE TRIAL ({prod.trial_hours}H)
                        </span>
                      )}
                      {trialIsActive && (
                        <span className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-lg backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                          TRIAL ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Image slider */}
                    <ProductImageSlider
                      images={product.images?.length > 0 ? product.images : product.image ? [product.image] : []}
                      name={product.name}
                    />

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-5 gap-4 relative z-20">
                      <div>
                        <h3 className="font-bold text-lg text-white leading-tight tracking-tight group-hover:text-cyan-400 transition-colors duration-200">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      {/* Plan selector */}
                      <Select
                        value={selectedPlan}
                        onValueChange={(val: PlanType) => setSelectedPlans((prev) => ({ ...prev, [product.id]: val }))}
                        disabled={!hasValidPlans}
                      >
                        <SelectTrigger className="h-10 text-sm bg-black/40 border-white/[0.08] text-white hover:border-cyan-400/30 transition-colors duration-200 rounded-lg">
                          <SelectValue placeholder={hasValidPlans ? "" : "Unavailable"} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f1219] border-white/[0.08] text-white backdrop-blur-xl">
                          {(['1_day', '7_days', '30_days', 'lifetime'] as PlanType[]).map((plan) => {
                            const p = getPrice(product, plan);
                            
                            // ✅ FIXED: Hide plan entirely from the list if price is 0
                            if (p <= 0) return null; 
                            
                            return (
                              <SelectItem key={plan} value={plan} className="text-sm focus:text-cyan-400 focus:bg-cyan-400/10 cursor-pointer">
                                {formatPlan(plan)} — {formatPrice(p)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      {/* Divider */}
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.1] to-transparent my-1" />

                      {/* Price + CTAs */}
                      <div className="flex flex-col gap-3 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-2xl font-black tracking-tight text-white drop-shadow-md">
                            {hasValidPlans ? formatPrice(currentPrice) : "N/A"}
                          </span>
                          <span className="text-xs text-gray-500 font-medium mt-0.5 uppercase tracking-wider">
                            {hasValidPlans ? `${formatPlan(selectedPlan)} plan` : "Currently Out of Stock"}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleBuyNow(product.id)}
                            disabled={!hasValidPlans}
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white w-full h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] border-none disabled:opacity-50 disabled:shadow-none"
                          >
                            <ShoppingBag size={15} />
                            Buy Now
                            <ArrowRight size={14} className="ml-auto opacity-70" />
                          </Button>

                          {prod.is_trial && !trialAlreadyUsed && (
                            <Button
                              onClick={() => handleClaimTrial(product.id)}
                              disabled={claimingTrial === product.id}
                              variant="outline"
                              className="bg-white/[0.02] hover:bg-white/[0.08] border-white/[0.1] text-purple-400 hover:text-purple-300 w-full h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                            >
                              {claimingTrial === product.id ? <Loader2 size={14} className="animate-spin" /> : <><Gift size={14} /> Try Free</>}
                            </Button>
                          )}

                          {trialIsActive && (
                            <Button
                              onClick={() => navigate('/dashboard')}
                              variant="outline"
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400 w-full h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                            >
                              <Sparkles size={14} /> Use Trial
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── Empty State ───────────────────────────────────────────────────── */}
          {filteredProducts.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center py-20 gap-5"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center backdrop-blur-md">
                <Package size={32} className="text-gray-500" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-1">No products found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your search terms</p>
              </div>
              {search && (
                <Button onClick={() => setSearch('')} variant="outline" className="border-white/10 text-gray-400 hover:text-white mt-2">
                  Clear search
                </Button>
              )}
            </motion.div>
          )}

        </motion.div>
      </div>
    </MainLayout>
  );
}