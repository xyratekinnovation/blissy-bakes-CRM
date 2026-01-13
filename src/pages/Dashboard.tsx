import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Star,
  Clock,
  BarChart3,
  Loader2
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { reportsApi } from "@/api/reports";
import { useToast } from "@/hooks/use-toast";

const periods = ["Today", "Week", "Month"];

interface HourlyData {
  hour: string;
  orders: number;
  sales: number;
}

interface DashboardStats {
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  lowStockItems: number;
  topSellingProduct: string | null;
  hourlyData?: HourlyData[];
}

export default function Dashboard() {
  const { toast } = useToast();
  const [activePeriod, setActivePeriod] = useState<"today" | "week" | "month">("today");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [activePeriod]);

  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getDashboardStats(activePeriod);
      setStats(data);
      
      // Set hourly data if available
      if (data.hourlyData && data.hourlyData.length > 0) {
        setHourlyData(data.hourlyData);
      } else {
        // Fallback: create empty hourly data structure (9 AM to 12 AM)
        const emptyHourlyData: HourlyData[] = [];
        // 9 AM to 11 PM
        for (let h = 9; h < 24; h++) {
          const hourLabel = h === 12 ? "12PM" : h < 12 ? `${h}AM` : `${h - 12}PM`;
          emptyHourlyData.push({ hour: hourLabel, orders: 0, sales: 0 });
        }
        // Add 12 AM (midnight)
        emptyHourlyData.push({ hour: "12AM", orders: 0, sales: 0 });
        setHourlyData(emptyHourlyData);
      }
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const maxOrders = hourlyData.length > 0 
    ? Math.max(...hourlyData.map((d) => d.orders), 1) 
    : 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="gradient-hero px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-playfair text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-card/80 backdrop-blur rounded-xl">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">Live</span>
          </div>
        </div>

        {/* Period Toggle */}
        <div className="flex gap-2 p-1 bg-card/50 backdrop-blur rounded-2xl">
          {periods.map((period) => {
            const periodKey = period.toLowerCase() as "today" | "week" | "month";
            return (
              <button
                key={period}
                onClick={() => setActivePeriod(periodKey)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl font-semibold transition-all duration-300",
                  activePeriod === periodKey
                    ? "bg-card shadow-soft text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {period}
              </button>
            );
          })}
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bakery-card col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
                <p className="text-3xl font-bold text-gradient">
                  {formatCurrency(stats.totalSales)}
                </p>
              </div>
              {stats.totalSales > 0 && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold bg-green-100 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>Active</span>
                </div>
              )}
            </div>
          </div>

          <div className="bakery-card">
            <div className="w-10 h-10 rounded-xl bg-pink-soft flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5 text-pink-deep" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.orderCount}</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>

          <div className="bakery-card">
            <div className="w-10 h-10 rounded-xl bg-lavender-soft flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-lavender-deep" />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.avgOrderValue)}</p>
            <p className="text-sm text-muted-foreground">Avg Order Value</p>
          </div>

          {stats.lowStockItems > 0 && (
            <div className="bakery-card">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-2xl font-bold text-destructive">{stats.lowStockItems}</p>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
            </div>
          )}

          {stats.topSellingProduct && stats.topSellingProduct !== "N/A" && (
            <div className="bakery-card">
              <div className="w-10 h-10 rounded-xl bg-gold-soft flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-chocolate" />
              </div>
              <p className="text-sm font-bold text-foreground truncate">{stats.topSellingProduct}</p>
              <p className="text-xs text-muted-foreground">Top Seller</p>
            </div>
          )}
        </div>

        {/* Hourly Sales Chart */}
        <div className="bakery-card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Peak Hours</h2>
          </div>
          {hourlyData.length > 0 ? (
            <div className="flex items-end gap-1 h-32">
              {hourlyData.map((data) => (
                <div key={data.hour} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg gradient-button transition-all duration-300 hover:opacity-80 cursor-pointer"
                    style={{ height: `${Math.max((data.orders / maxOrders) * 100, 5)}%`, minHeight: '4px' }}
                    title={`${data.hour}: ${data.orders} orders, ₹${data.sales.toFixed(0)}`}
                  />
                  <span className="text-[10px] text-muted-foreground">{data.hour}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p className="text-sm">No hourly data available for this period</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bakery-card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Summary</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period:</span>
              <span className="font-medium">{activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Revenue:</span>
              <span className="font-medium text-primary">{formatCurrency(stats.totalSales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Orders:</span>
              <span className="font-medium">{stats.orderCount}</span>
            </div>
            {stats.topSellingProduct && stats.topSellingProduct !== "N/A" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Top Product:</span>
                <span className="font-medium">{stats.topSellingProduct}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
