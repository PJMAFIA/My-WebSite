import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Loader2, ChevronLeft, ChevronRight, Gift, Zap } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
    enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0 })
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => (prevIndex + newDirection + images.length) % images.length);
  };

  const hasMultiple = images.length > 1;

  return (
    <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6 relative overflow-hidden group">
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`${name} - ${currentIndex + 1}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
          className="absolute w-full h-full object-contain p-4"
        />
      </AnimatePresence>
      {(!images || images.length === 0) && (
        <div className="w-full h-full flex items-center justify-center absolute inset-0">
          <span className="text-3xl font-bold text-primary-foreground">{name.charAt(0)}</span>
        </div>
      )}
      {hasMultiple && (
        <>
          <button onClick={(e) => { e.stopPropagation(); paginate(-1); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/70 z-10"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={(e) => { e.stopPropagation(); paginate(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/70 z-10"><ChevronRight className="h-5 w-5" /></button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, idx) => (
              <div key={idx} className={`h-1.5 w-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-primary' : 'bg-white/50'}`} />
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
  
  // ✅ NEW: State for tracking active/expired trials
  const [userTrials, setUserTrials] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    if (isAuthenticated) {
      fetchUserTrials();
    }
  }, [fetchProducts, isAuthenticated]);

  useEffect(() => {
    const initial: Record<string, PlanType> = {};
    products.forEach(p => { initial[p.id] = '30_days'; });
    setSelectedPlans(initial);
  }, [products]);

  // ✅ NEW: Fetch user orders to check for existing trials
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

  // ✅ NEW: Logic to check if a specific product trial is still active
  const isTrialActive = (productId: string, trialHours: number) => {
    const trialOrder = userTrials.find(t => t.product_id === productId);
    if (!trialOrder) return false;

    const startTime = new Date(trialOrder.created_at).getTime();
    const expiryTime = startTime + (trialHours * 60 * 60 * 1000);
    const currentTime = new Date().getTime();

    return currentTime < expiryTime;
  };

  // ✅ NEW: Logic to check if user has already used their trial (Active or Expired)
  const hasUsedTrial = (productId: string) => {
    return userTrials.some(t => t.product_id === productId);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.description.toLowerCase().includes(search.toLowerCase())
  );

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
            fetchUserTrials(); // Refresh trials
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

  const getPrice = (product: any, plan: string): number => {
    if (currency === 'USD') return product.prices[plan] || 0;
    if (product.currency_prices?.[currency]?.[plan]) return product.currency_prices[currency][plan];
    return 0;
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-primary" /> Shop
            </h1>
            <p className="text-muted-foreground mt-1">Browse our collection of premium software products</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Products Grid */}
        {isLoading && products.length === 0 ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, i) => {
                const prod = product as any;
                const selectedPlan = selectedPlans[product.id] || '30_days';
                const currentPrice = getPrice(product, selectedPlan);
                
                // ✅ Check if trial is active or already used
                const trialIsActive = isTrialActive(product.id, prod.trial_hours);
                const trialAlreadyUsed = hasUsedTrial(product.id);

                return (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card variant="glass" className="h-full flex flex-col hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden">
                        
                        {/* ✅ Dynamic Trial Badge */}
                        {prod.is_trial && !trialAlreadyUsed && (
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 z-20 rounded-br-lg shadow-lg">
                                FREE TRIAL ({prod.trial_hours}H)
                            </div>
                        )}
                        {trialIsActive && (
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-3 py-1 z-20 rounded-br-lg shadow-lg">
                                TRIAL ACTIVE
                            </div>
                        )}

                        <CardContent className="p-6 flex-1 flex flex-col">
                            <ProductImageSlider images={product.images && product.images.length > 0 ? product.images : [product.image]} name={product.name} />

                            <div className="flex-1">
                                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{product.description}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Select value={selectedPlans[product.id] || '30_days'} onValueChange={(value: PlanType) => setSelectedPlans(prev => ({ ...prev, [product.id]: value }))}>
                                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select plan" /></SelectTrigger>
                                    <SelectContent>
                                        {['1_day', '7_days', '30_days', 'lifetime'].map(plan => {
                                            const pPrice = getPrice(product, plan);
                                            if(pPrice === 0 && currency !== 'USD') return null;
                                            return (
                                                <SelectItem key={plan} value={plan}>{formatPlan(plan)} - {formatPrice(pPrice)}</SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1">
                                        <p className="text-2xl font-bold text-primary">{formatPrice(currentPrice)}</p>
                                        <p className="text-xs text-muted-foreground">{formatPlan(selectedPlans[product.id] || '30_days')} plan</p>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2">
                                        <Button variant="gradient" size="sm" onClick={() => handleBuyNow(product.id)}>Buy Now</Button>
                                        
                                        {/* ✅ Conditional Trial Button: Hidden if already used */}
                                        {prod.is_trial && !trialAlreadyUsed && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                                                onClick={() => handleClaimTrial(product.id)}
                                                disabled={claimingTrial === product.id}
                                            >
                                                {claimingTrial === product.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Gift className="h-4 w-4 mr-1"/> Try Free</>}
                                            </Button>
                                        )}

                                        {/* ✅ Show dashboard link if trial is active */}
                                        {trialIsActive && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="border-blue-500 text-blue-500"
                                                onClick={() => navigate('/dashboard')}
                                            >
                                                <Zap className="h-4 w-4 mr-1"/> Use Trial
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
                )
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}