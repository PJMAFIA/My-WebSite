import { useState, useEffect } from 'react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Cloud, Lock, ChevronRight, Star, CheckCircle2, ShoppingCart, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useProductStore, useCartStore, formatPlan } from '@/store'; 

const features = [
  {
    icon: Shield,
    title: 'Undetected Security',
    description: 'Kernel-level bypassing and zero-knowledge architecture to keep your accounts safe.',
  },
  {
    icon: Zap,
    title: 'Instant Delivery',
    description: 'Get your license keys and loader downloads immediately after purchase.',
  },
  {
    icon: Cloud,
    title: 'Cloud Configs',
    description: 'Save and load your custom settings directly from the cloud.',
  },
  {
    icon: Lock,
    title: 'HWID Locked',
    description: 'Secure licensing system with automated HWID resets via your dashboard.',
  },
];

const testimonials = [
  {
    name: 'GhostProtocol',
    role: 'Competitive Player',
    content: 'The cleanest ESP I have ever used. Not a single ban in 6 months of raging.',
    rating: 5,
  },
  {
    name: 'SilentAim99',
    role: 'Verified Customer',
    content: 'Setup took literally 2 minutes. The auto-delivery system is flawless.',
    rating: 5,
  },
  {
    name: 'Xerox',
    role: 'Streamer',
    content: 'Stream-proof features work perfectly. Support team is actually helpful.',
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
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-cyan-500/30">
      
      {/* ── AMBIENT BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-cyan-600/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_20%,transparent_100%)] opacity-40" />
      </div>
      
      {/* ── NAVBAR ── */}
      <header className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0 shadow-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-contain drop-shadow-[0_0_10px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform" />
            </div>
            <span className="font-black text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">Universal Store</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 bg-white/[0.03] px-6 py-2.5 rounded-full border border-white/[0.05]">
            <Link to="/shop" className="text-sm font-bold text-gray-300 hover:text-cyan-400 transition-colors">Store</Link>
            <button onClick={() => scrollToSection('features')} className="text-sm font-bold text-gray-300 hover:text-cyan-400 transition-colors">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm font-bold text-gray-300 hover:text-cyan-400 transition-colors">Pricing</button>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-none shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-full px-6 font-bold">
                <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'}>
                  Dashboard <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-gray-300 hover:text-cyan-400 hover:bg-white/[0.05] rounded-full hidden sm:flex font-bold">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild className="bg-white text-black hover:bg-gray-200 rounded-full px-6 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
                  <Link to="/register">
                    Get Started <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative z-10 pt-32 pb-24 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            
            <Badge className="mb-8 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-4 py-1.5 text-sm font-bold tracking-wide shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <Terminal className="w-4 h-4 mr-2 inline" /> Initializing Bypass Protocol V2.0
            </Badge>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.1] tracking-tighter">
              Dominate With <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
                Elite Software
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
              Undetected tools. Instant automated delivery. Secure HWID resets. 
              Join the winning side today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={() => scrollToSection('pricing')} className="h-14 px-8 text-lg font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-none shadow-[0_0_30px_rgba(6,182,212,0.4)] rounded-xl w-full sm:w-auto transition-all">
                View Arsenal <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button asChild variant="outline" className="h-14 px-8 text-lg font-bold bg-black/40 border-white/10 hover:bg-white/5 hover:border-white/20 text-white backdrop-blur-xl rounded-xl w-full sm:w-auto transition-all">
                <Link to="/register">Create Account</Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-20 max-w-4xl mx-auto bg-black/40 border border-white/5 rounded-2xl backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
              {[
                { value: '10K+', label: 'Active Users' },
                { value: '0', label: 'Detections' },
                { value: '24/7', label: 'Support' },
                { value: '< 1s', label: 'Delivery' },
              ].map((stat, i) => (
                <div key={i} className="text-center px-4">
                  <p className="text-3xl md:text-4xl font-black text-white drop-shadow-md">{stat.value}</p>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="relative z-10 py-24 bg-black/20 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Tactical <span className="text-cyan-400">Advantage</span></h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">Engineered for performance and security. We handle the code, you handle the game.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-md group shadow-xl">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                      <feature.icon className="h-7 w-7 text-cyan-400" />
                    </div>
                    <h3 className="font-bold text-xl mb-3 text-white group-hover:text-cyan-400 transition-colors">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING STORE SECTION ── */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Choose Your <span className="text-cyan-400">Weapon</span></h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 font-medium">Select a plan. Pay securely. Inject instantly.</p>

            {/* Duration Tabs */}
            <div className="inline-flex p-1.5 bg-black/60 rounded-xl border border-white/10 backdrop-blur-md shadow-2xl">
              {[ { id: '1_day', label: '1 Day' }, { id: '7_days', label: '7 Days' }, { id: '30_days', label: '30 Days' }, { id: 'lifetime', label: 'Lifetime' } ].map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedDuration(plan.id as any)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${selectedDuration === plan.id ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {plan.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
               <div className="col-span-full flex flex-col items-center py-20 text-cyan-400"><Zap className="animate-spin h-10 w-10 mb-4" /> Fetching Arsenal...</div>
            ) : products.map((product, i) => {
              const price = product.prices?.[selectedDuration];
              if(price === 0 || price === undefined) return null;

              return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full flex flex-col bg-black/40 border-white/[0.05] hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(0,240,255,0.15)] group overflow-hidden relative backdrop-blur-xl">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/0 to-cyan-500/0 group-hover:to-cyan-500/[0.02] transition-colors pointer-events-none z-0" />
                  
                  {selectedDuration === 'lifetime' && <div className="absolute top-5 -right-12 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest py-1 px-12 rotate-45 shadow-[0_0_10px_rgba(0,240,255,0.5)] z-20">Best Value</div>}
                  
                  <CardHeader className="p-8 pb-4 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 overflow-hidden shadow-lg group-hover:border-cyan-500/30 transition-colors">
                       {product.image && product.image !== '/placeholder.svg' ? <img src={product.image} className="w-full h-full object-cover"/> : <span className="font-bold text-cyan-400 text-2xl">{product.name.charAt(0)}</span>}
                    </div>
                    <CardTitle className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors">{product.name}</CardTitle>
                    <CardDescription className="text-gray-400 text-sm mt-2 line-clamp-2 font-medium">{product.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-8 pt-0 flex-grow relative z-10">
                    <div className="my-6 pb-6 border-b border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-cyan-500">$</span>
                        <span className="text-5xl font-black text-white drop-shadow-md">{price}</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-4">
                      {['Undetected Kernel Bypass', 'Instant Auto-Delivery', '24/7 Premium Support'].map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm font-bold text-gray-300">
                          <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" /> <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <div className="p-8 pt-0 mt-auto relative z-10">
                    <Button onClick={() => handleBuyNow(product)} className="w-full h-12 text-md font-black bg-white/5 hover:bg-cyan-500 hover:text-black border border-white/10 hover:border-cyan-500 transition-all duration-300 shadow-none hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                      <ShoppingCart className="mr-2 h-5 w-5" /> Acquire License
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )})}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative z-10 py-24 bg-black/40 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Community <span className="text-cyan-400">Feedback</span></h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">Don't just take our word for it. See what top players are saying.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full bg-white/[0.02] border-white/[0.05] backdrop-blur-md">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-6">
                      {Array.from({ length: testimonial.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-cyan-400 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-6 font-medium italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-black text-white">
                            {testimonial.name.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{testimonial.name}</p>
                        <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <Card className="relative overflow-hidden bg-black border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-purple-600/20 to-cyan-600/20" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
              <CardContent className="relative z-10 py-20 px-8 text-center">
                <h2 className="text-4xl md:text-5xl font-black mb-6 text-white drop-shadow-lg">
                  Ready to <span className="text-cyan-400">Dominate?</span>
                </h2>
                <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto font-medium">
                  Create your account today and gain access to the most secure, undetected software on the market.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild className="h-14 px-8 text-lg font-black bg-cyan-500 hover:bg-cyan-400 text-black border-none shadow-[0_0_30px_rgba(0,240,255,0.5)] rounded-xl transition-all">
                    <Link to="/register">Create Free Account <ArrowRight className="h-5 w-5 ml-2" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 bg-black/80 pt-16 pb-8 backdrop-blur-xl">
        <div className="container mx-auto px-6 text-center">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-xl object-contain mx-auto mb-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer" />
            <h3 className="font-black text-xl mb-6 text-gray-500 hover:text-white transition-colors">Universal Store</h3>
            <div className="flex items-center justify-center gap-8 text-sm font-bold text-gray-500 mb-12 uppercase tracking-wider">
              <Link to="/terms" className="hover:text-cyan-400 transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-cyan-400 transition-colors">Privacy</Link>
              <Link to="/contact" className="hover:text-cyan-400 transition-colors">Support</Link>
            </div>
            <p className="text-gray-700 text-xs font-medium">© {new Date().getFullYear()} Universal Store. All rights reserved. Strictly for educational purposes.</p>
        </div>
      </footer>
    </div>
  );
}