import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Minus, ShoppingBag, Star, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { productsApi, type Product } from "@/api/products";
import { useToast } from "@/hooks/use-toast";

interface CartItem extends Product {
  quantity: number;
}

export default function NewOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [activeCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const category = activeCategory === "All" ? undefined : activeCategory;
      const data = await productsApi.getProducts(category);
      setProducts(data.filter(p => p.isAvailable)); // Only show available products
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Failed to load products. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load products. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from products
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredItems = products.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: Product) => {
    // Check stock availability
    if (item.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${item.name} is currently out of stock.`,
        variant: "destructive"
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        // Check if adding more would exceed stock
        if (existing.quantity >= item.stock) {
          toast({
            title: "Stock Limit",
            description: `Only ${item.stock} ${item.name} available in stock.`,
            variant: "destructive"
          });
          return prev;
        }
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + delta;
            // Check stock limit when increasing
            if (delta > 0 && newQuantity > item.stock) {
              toast({
                title: "Stock Limit",
                description: `Only ${item.stock} ${item.name} available in stock.`,
                variant: "destructive"
              });
              return item;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const getItemQuantity = (id: string) => {
    return cart.find((item) => item.id === id)?.quantity || 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout.",
        variant: "destructive"
      });
      return;
    }
    navigate("/customer-info", { state: { cart } });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-playfair text-xl font-bold text-foreground">New Order</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-muted border-0"
          />
        </div>
      </header>

      {/* Categories */}
      <div className="sticky top-[116px] z-30 bg-card/95 backdrop-blur-xl px-4 py-3 border-b border-border/50">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300",
                activeCategory === category
                  ? "gradient-button text-primary-foreground shadow-button"
                  : "bg-muted text-muted-foreground hover:bg-pink-soft hover:text-pink-deep"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="px-4 py-12">
          <div className="bakery-card text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive font-semibold mb-2">Error Loading Products</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadProducts} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Menu Grid */}
      {!loading && !error && (
        <main className="px-4 py-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const quantity = getItemQuantity(item.id);
                const isOutOfStock = item.stock <= 0;
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "bakery-card relative p-3",
                      quantity > 0 && "ring-2 ring-primary",
                      isOutOfStock && "opacity-60"
                    )}
                  >
                    {item.stock > 0 && item.stock <= 5 && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-lg z-10">
                        <Star className="w-4 h-4 text-white" fill="currentColor" />
                      </div>
                    )}
                    
                    {/* Product Image */}
                    <div className="w-full h-48 mb-3 rounded-xl overflow-hidden bg-pink-soft flex items-center justify-center shadow-sm">
                      {item.image && (item.image.startsWith('http') || item.image.startsWith('data:')) ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: 'center' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={cn(
                          "w-full h-full flex items-center justify-center text-5xl",
                          item.image && (item.image.startsWith('http') || item.image.startsWith('data:')) ? "hidden" : ""
                        )}
                        style={{ display: item.image && (item.image.startsWith('http') || item.image.startsWith('data:')) ? 'none' : 'flex' }}
                      >
                        {item.image && !item.image.startsWith('http') && !item.image.startsWith('data:') ? item.image : '🎂'}
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-primary font-bold text-base">₹{item.price}</p>
                      {item.stock > 0 && (
                        <p className="text-xs text-muted-foreground">Stock: {item.stock}</p>
                      )}
                    </div>

                    {isOutOfStock ? (
                      <Button
                        variant="soft"
                        size="sm"
                        className="w-full"
                        disabled
                      >
                        Out of Stock
                      </Button>
                    ) : quantity === 0 ? (
                      <Button
                        onClick={() => addToCart(item)}
                        variant="soft"
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between bg-pink-soft rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-lg bg-card flex items-center justify-center shadow-sm"
                        >
                          <Minus className="w-4 h-4 text-pink-deep" />
                        </button>
                        <span className="font-bold text-pink-deep">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm"
                          disabled={quantity >= item.stock}
                        >
                          <Plus className="w-4 h-4 text-primary-foreground" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* Cart Preview */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
          <div
            onClick={() => setShowCart(!showCart)}
            className="gradient-button rounded-2xl p-4 shadow-glow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-card/20 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-card" />
                </div>
                <div>
                  <p className="text-card font-bold">{cartCount} items</p>
                  <p className="text-card/70 text-sm">Tap to view cart</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-card font-bold text-xl">₹{cartTotal}</p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckout();
                  }}
                  variant="glass"
                  size="sm"
                  className="mt-1"
                >
                  Checkout →
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowCart(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[70vh] overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-playfair text-xl font-bold">Your Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted rounded-2xl">
                  {item.image && (item.image.startsWith('http') || item.image.startsWith('data:')) ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={cn(
                      "w-12 h-12 rounded-xl bg-pink-soft flex items-center justify-center text-2xl",
                      item.image && (item.image.startsWith('http') || item.image.startsWith('data:')) ? "hidden" : ""
                    )}
                    style={{ display: item.image && (item.image.startsWith('http') || item.image.startsWith('data:')) ? 'none' : 'flex' }}
                  >
                    {item.image && !item.image.startsWith('http') && !item.image.startsWith('data:') ? item.image : '🎂'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-primary font-bold">₹{item.price * item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-card rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-pink-soft flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3 text-pink-deep" />
                    </button>
                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center"
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="w-3 h-3 text-primary-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-gradient">₹{cartTotal}</span>
              </div>
              <Button onClick={handleCheckout} variant="bakery" size="lg" className="w-full">
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
