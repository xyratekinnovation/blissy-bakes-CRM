import { 
  ShoppingCart, 
  Users, 
  BarChart3, 
  UtensilsCrossed, 
  Package, 
  Boxes, 
  Receipt, 
  Gift, 
  Settings,
  Cake,
  Star,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { reportsApi } from "@/api/reports";
import { ordersApi } from "@/api/orders";
import { Loader2 } from "lucide-react";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  path: string;
  color: "pink" | "lavender" | "gold" | "cream";
  highlight?: boolean;
}

const quickActions: QuickAction[] = [
  { icon: ShoppingCart, label: "New Order", path: "/new-order", color: "pink", highlight: true },
  { icon: Users, label: "Customers", path: "/customers", color: "lavender" },
  { icon: BarChart3, label: "Dashboard", path: "/dashboard", color: "gold" },
  { icon: UtensilsCrossed, label: "Menu & Pricing", path: "/menu", color: "cream" },
  { icon: Package, label: "Bulk Orders", path: "/bulk-orders", color: "lavender" },
  { icon: Boxes, label: "Inventory", path: "/inventory", color: "pink" },
  { icon: Receipt, label: "Expenses", path: "/expenses", color: "cream" },
  { icon: Gift, label: "Offers", path: "/offers", color: "gold" },
  { icon: Settings, label: "Settings", path: "/settings", color: "lavender" },
];

const colorClasses = {
  pink: "bg-pink-soft hover:bg-pink-medium border-pink-medium/30 text-pink-deep",
  lavender: "bg-lavender-soft hover:bg-lavender-medium border-lavender-medium/30 text-lavender-deep",
  gold: "bg-gold-soft hover:bg-gold-sparkle/30 border-gold-sparkle/30 text-chocolate",
  cream: "bg-cream hover:bg-pink-soft border-border text-foreground",
};

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ todaySales: 0, todayOrders: 0, avgOrder: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Load user data
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    
    loadData();
    
    // Refresh data when page gains focus
    const handleFocus = () => {
      loadData();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardStats, orders] = await Promise.all([
        reportsApi.getDashboardStats('today'),
        ordersApi.getOrders()
      ]);
      
      // Use the correct field names from the API response
      setStats({
        todaySales: dashboardStats.totalSales || 0,
        todayOrders: dashboardStats.orderCount || 0,
        avgOrder: dashboardStats.avgOrderValue || 0
      });
      
      // Get most recent 3 orders
      setRecentOrders(orders.slice(0, 3));
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return "User";
    // Show "Madhu" for admin, otherwise show user's full name
    if (user.role === "admin") {
      return "Madhu";
    }
    return user.fullName || "User";
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="gradient-hero px-4 pt-6 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-lavender-medium/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-medium/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl gradient-button flex items-center justify-center shadow-button">
                <Cake className="w-6 h-6 text-card" />
              </div>
              <div>
                <h1 className="font-playfair text-xl font-bold text-gradient">Blissyy Bakes</h1>
                <p className="text-sm text-muted-foreground">Hi, {getUserDisplayName()} ☀️</p>
              </div>
            </div>
            <button className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center shadow-soft">
              <Star className="w-5 h-5 text-gold-sparkle" />
            </button>
          </div>

          {/* Today's Stats */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold text-gradient">
                  ₹{stats.todaySales >= 1000 ? `${(stats.todaySales / 1000).toFixed(1)}K` : stats.todaySales.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Today's Sales</p>
              </div>
              <div className="glass-card rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold text-lavender-deep">{stats.todayOrders}</p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
              <div className="glass-card rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold text-gold-sparkle">
                  ₹{Math.round(stats.avgOrder)}
                </p>
                <p className="text-xs text-muted-foreground">Avg Order</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Quick Actions Grid */}
      <main className="px-4 py-6">
        <h2 className="font-playfair text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-card active:scale-95",
                colorClasses[action.color],
                action.highlight && "ring-2 ring-primary/30 animate-glow-pulse"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                action.color === "pink" && "bg-pink-medium/50",
                action.color === "lavender" && "bg-lavender-medium/50",
                action.color === "gold" && "bg-gold-sparkle/30",
                action.color === "cream" && "bg-pink-soft/50",
              )}>
                <action.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Recent Orders */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-lg font-semibold text-foreground">Recent Orders</h2>
            <button 
              onClick={() => navigate("/orders")}
              className="text-sm text-primary font-medium"
            >
              View All
            </button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cake className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No recent orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="bakery-card flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-pink-soft flex items-center justify-center">
                    <Cake className="w-6 h-6 text-pink-deep" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground">{order.order_number ? `#${order.order_number}` : `#${order.id.slice(0, 8).toUpperCase()}`}</span>
                      <span className="text-sm font-bold text-primary">₹{order.total_amount.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{order.customer_name || "Walk-in Customer"}</p>
                    <p className="text-xs text-muted-foreground/70 truncate">{order.items_summary || "No items"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimeAgo(order.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
