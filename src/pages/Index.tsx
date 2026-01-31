import { useState, useEffect } from 'react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Cloud, Lock, ChevronRight, Star, CheckCircle2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useProductStore, useCartStore, formatPlan } from '@/store'; 

const features = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption and zero-knowledge architecture to protect your data.',
  },
  {
    icon: Zap,
    title: 'Instant Delivery',
    description: 'Get your license keys and downloads immediately after purchase.',
  },
  {
    icon: Cloud,
    title: 'Cloud Sync',
    description: 'Access your licenses and products from anywhere, anytime.',
  },
  {
    icon: Lock,
    title: 'Secure Licensing',
    description: 'Tamper-proof license validation with automatic renewal options.',
  },
];

const testimonials = [
  {
    name: 'Alex Chen',
    role: 'CTO at TechCorp',
    content: 'Universal Store transformed how we manage our software licenses. The platform is incredibly intuitive.',
    rating: 5,
  },
  {
    name: 'Sarah Miller',
    role: 'Founder at StartupX',
    content: 'The best licensing platform we\'ve ever used. Fast, secure, and reliable.',
    rating: 5,
  },
  {
    name: 'James Wilson',
    role: 'Developer',
    content: 'Finally, a platform that understands developers. The API integration is seamless.',
    rating: 5,
  },
];

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { products, fetchProducts, isLoading } = useProductStore();
  const { setCart } = useCartStore();

  const [selectedDuration, setSelectedDuration] = useState<'1_day' | '7_days' | '30_days' | 'lifetime'>('30_days');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleBuyNow = (product: any) => {
    setCart(product, selectedDuration);
    navigate('/checkout');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      <header className="relative z-10 border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow">
              <span className="text-primary-foreground font-bold">S</span>
            </div>
            <span className="font-bold text-xl">Universal Store</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
              Products
            </Link>
            <button onClick={() => scrollToSection('features')} className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild variant="gradient">
                <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'}>
                  Dashboard
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild variant="gradient">
                  <Link to="/register">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-24 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-8">
              <Zap className="h-4 w-4" />
              <span>New: Lifetime licenses now available</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Premium Software
              <br />
              <span className="text-gradient">Licensing Made Simple</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Access enterprise-grade software with secure licensing, instant delivery, 
              and world-class support. Start your journey today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={() => scrollToSection('pricing')} variant="gradient" size="xl">
                Browse Pricing
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/register">Create Free Account</Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { value: '50K+', label: 'Active Users' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Support' },
              { value: '100+', label: 'Products' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 bg-gradient-to-b from-transparent to-secondary/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to{' '}
              <span className="text-gradient">succeed</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built for developers and enterprises alike. Get the tools you need with the security you demand.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card variant="glass" className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Choose the license duration that fits your needs. No hidden fees.
            </p>

            {/* Duration Selector */}
            <div className="inline-flex p-1 bg-secondary/50 rounded-xl border border-border/50 backdrop-blur-sm">
              {[
                { id: '1_day', label: '1 Day' },
                { id: '7_days', label: '7 Days' },
                { id: '30_days', label: '30 Days' },
                { id: 'lifetime', label: 'Lifetime' }
              ].map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedDuration(plan.id as any)}
                  className={`
                    px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${selectedDuration === plan.id 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}
                  `}
                >
                  {plan.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
               <div className="col-span-full text-center py-20 text-muted-foreground">Loading products...</div>
            ) : products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card variant="glass" className="h-full flex flex-col hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 group">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-4">
                       <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
                          {product.image && product.image !== '/placeholder.svg' ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              // 🔥 FIX: object-contain with padding
                              className="w-full h-full object-contain p-2 rounded-xl" 
                            />
                          ) : (
                            <span className="font-bold text-primary text-xl">{product.name.charAt(0)}</span>
                          )}
                       </div>
                       {selectedDuration === 'lifetime' && (
                         <Badge variant="active" className="bg-primary/20 text-primary border-primary/20">Best Value</Badge>
                       )}
                    </div>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-2 h-10">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-grow">
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">$</span>
                        <span className="text-5xl font-bold tracking-tight">
                          {product.prices[selectedDuration]}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          / {formatPlan(selectedDuration).toLowerCase()}
                        </span>
                      </div>
                    </div>
                    
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>Instant Delivery</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>Secure License Key</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>24/7 Support</span>
                      </li>
                      {selectedDuration === 'lifetime' && (
                        <li className="flex items-center gap-3 text-sm font-medium text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>One-time Payment</span>
                        </li>
                      )}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button 
                      onClick={() => handleBuyNow(product)} 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant="outline"
                      size="lg"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Buy Now
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-transparent to-secondary/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by <span className="text-gradient">developers</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust Universal Store.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card variant="glass" className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-foreground mb-4">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <span className="text-primary-foreground font-medium text-sm">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{testimonial.name}</p>
                        <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card variant="gradient" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
              <div className="absolute inset-0 noise" />
              <CardContent className="relative z-10 py-16 px-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to get started?
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                  Join thousands of developers and businesses who trust Universal Store for their software licensing needs.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild variant="gradient" size="xl">
                    <Link to="/register">
                      Create Free Account
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="xl">
                    <Link to="/shop">Browse Products</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-bold">Universal Store</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Universal Store. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}