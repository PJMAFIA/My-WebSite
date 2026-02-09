import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductStore, useCartStore, useAuthStore, formatPlan } from '@/store';

type PlanType = '1_day' | '7_days' | '30_days' | 'lifetime';

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
  
  // ✅ Use Global Currency from Auth Store (Controlled by MainLayout)
  const { isAuthenticated, currency } = useAuthStore() as any; 
  
  const [search, setSearch] = useState('');
  const [selectedPlans, setSelectedPlans] = useState<Record<string, PlanType>>({});

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const initial: Record<string, PlanType> = {};
    products.forEach(p => {
      initial[p.id] = '30_days';
    });
    setSelectedPlans(initial);
  }, [products]);

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

  // ✅ Helper: Format Price Symbol
  const formatPrice = (price: number) => {
    const currentCurrency = currency || 'USD'; // Default to USD
    switch (currentCurrency) {
      case 'GBP': return `£${price.toFixed(2)}`;
      case 'INR': return `₹${price.toLocaleString()}`;
      case 'PKR': return `Rs. ${price.toLocaleString()}`;
      case 'BDT': return `৳${price.toLocaleString()}`;
      default: return `$${price.toFixed(2)}`;
    }
  };

  // ✅ Helper: Get Correct Price from Product Data
  const getPrice = (product: any, plan: string): number => {
    const currentCurrency = currency || 'USD';

    // If USD, return base prices
    if (currentCurrency === 'USD') {
        return product.prices[plan] || 0;
    }
    // For other currencies, check currency_prices object
    if (product.currency_prices?.[currentCurrency]?.[plan]) {
        return product.currency_prices[currentCurrency][plan];
    }
    return 0; // Return 0 if price not defined for that currency
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
          {/* ❌ Removed Local Currency Dropdown - Now using MainLayout's global one */}
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
                const selectedPlan = selectedPlans[product.id] || '30_days';
                const currentPrice = getPrice(product, selectedPlan);

                return (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card variant="glass" className="h-full flex flex-col hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
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
                                    
                                    // Logic: Hide plan if price is 0 AND not USD. (Always show USD 0 if explicitly set, but usually 0 means unavailable)
                                    // You can adjust this logic if you want to show "Unavailable" instead of hiding
                                    if(pPrice === 0 && currency !== 'USD') return null;

                                    return (
                                        <SelectItem key={plan} value={plan}>{formatPlan(plan)} - {formatPrice(pPrice)}</SelectItem>
                                    )
                                })}
                            </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                            <p className="text-2xl font-bold text-primary">{formatPrice(currentPrice)}</p>
                            <p className="text-xs text-muted-foreground">{formatPlan(selectedPlans[product.id] || '30_days')} plan</p>
                            </div>
                            <Button variant="gradient" onClick={() => handleBuyNow(product.id)}>Buy Now</Button>
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