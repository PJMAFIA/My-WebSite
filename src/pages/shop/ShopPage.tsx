import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductStore, useCartStore, useAuthStore, formatPlan } from '@/store';

type PlanType = '1_day' | '7_days' | '30_days' | 'lifetime';

export default function ShopPage() {
  const navigate = useNavigate();
  const { products, fetchProducts, isLoading } = useProductStore();
  const { setCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
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
      if (isAuthenticated) {
        navigate('/checkout');
      } else {
        navigate('/login');
      }
    }
  };

  const getPrice = (productId: string): number => {
    const product = products.find(p => p.id === productId);
    const plan = selectedPlans[productId] || '30_days';
    return product?.prices[plan] || 0;
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-primary" />
              Shop
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse our collection of premium software products
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && products.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          /* Products Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card variant="glass" className="h-full flex flex-col hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                  <CardContent className="p-6 flex-1 flex flex-col">
                    
                    {/* Product Image - FIXED */}
                    <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6 flex items-center justify-center relative overflow-hidden group">
                      {product.image && product.image !== '/placeholder.svg' ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          // 🔥 FIX: Changed object-cover to object-contain and added padding
                          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all" />
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center relative z-10 shadow-lg shadow-primary/30">
                            <span className="text-3xl font-bold text-primary-foreground">
                              {product.name.charAt(0)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    {/* Plan Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Select
                          value={selectedPlans[product.id] || '30_days'}
                          onValueChange={(value: PlanType) => 
                            setSelectedPlans(prev => ({ ...prev, [product.id]: value }))
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1_day">1 Day - ${product.prices['1_day']}</SelectItem>
                            <SelectItem value="7_days">7 Days - ${product.prices['7_days']}</SelectItem>
                            <SelectItem value="30_days">30 Days - ${product.prices['30_days']}</SelectItem>
                            <SelectItem value="lifetime">Lifetime - ${product.prices['lifetime']}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            ${getPrice(product.id).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPlan(selectedPlans[product.id] || '30_days')} plan
                          </p>
                        </div>
                        <Button 
                          variant="gradient" 
                          onClick={() => handleBuyNow(product.id)}
                        >
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}