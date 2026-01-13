import { useState } from "react";
import { Search, Gift, Calendar, Star, MessageCircle, TrendingUp, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  visits: number;
  lastVisit: string;
  birthday?: string;
  favoriteItems: string[];
  loyaltyPoints: number;
}

import { customersApi } from "@/api/customers";
import { useEffect } from "react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  visits: number;
  lastVisit: string;
  birthday?: string;
  favoriteItems: string[];
  loyaltyPoints: number;
}

const getTierInfo = (points: number) => {
  if (points >= 400) return { tier: "Gold", icon: "👑", color: "bg-gold-soft text-chocolate border-gold-sparkle" };
  if (points >= 200) return { tier: "Silver", icon: "⭐", color: "bg-lavender-soft text-lavender-deep border-lavender-medium" };
  return { tier: "Bronze", icon: "🧁", color: "bg-pink-soft text-pink-deep border-pink-medium" };
};

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customersApi.getCustomers();
      // Since we updated API types, we might need simple mapping or direct usage
      // Backend returns: name, phone, totalSpent, visits, lastVisit etc as per schema
      setCustomers(data as unknown as Customer[]);
    } catch (e) {
      console.error("Failed to load customers", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  // Find customers with upcoming birthdays
  const birthdayCustomers = customers.filter((c) => c.birthday);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="gradient-hero px-4 pt-6 pb-4">
        <h1 className="font-playfair text-2xl font-bold text-foreground mb-4">Customer CRM</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-card/80 backdrop-blur border-0 shadow-soft"
          />
        </div>
      </header>

      {/* Birthday Reminders */}
      {birthdayCustomers.length > 0 && (
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-gold-sparkle" />
            <h2 className="font-semibold text-foreground">Birthday Reminders</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {birthdayCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex-shrink-0 w-40 p-4 bg-gold-soft/50 rounded-2xl border border-gold-sparkle/30"
              >
                <div className="text-2xl mb-2">🎂</div>
                <p className="font-semibold text-foreground text-sm">{customer.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {customer.birthday}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Stats */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-pink-soft rounded-2xl text-center">
            <p className="text-2xl font-bold text-pink-deep">{customers.length}</p>
            <p className="text-xs text-pink-deep/70">Total</p>
          </div>
          <div className="p-4 bg-lavender-soft rounded-2xl text-center">
            <p className="text-2xl font-bold text-lavender-deep">
              {customers.filter((c) => c.visits >= 5).length}
            </p>
            <p className="text-xs text-lavender-deep/70">Regulars</p>
          </div>
          <div className="p-4 bg-gold-soft rounded-2xl text-center">
            <p className="text-2xl font-bold text-chocolate">
              {customers.filter((c) => c.loyaltyPoints >= 400).length}
            </p>
            <p className="text-xs text-chocolate/70">VIPs</p>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <main className="px-4 py-4 space-y-3">
        {filteredCustomers.map((customer) => {
          const tierInfo = getTierInfo(customer.loyaltyPoints);
          return (
            <div
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className="bakery-card cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2",
                  tierInfo.color
                )}>
                  {tierInfo.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{customer.name}</p>
                    {customer.visits >= 10 && (
                      <Heart className="w-4 h-4 text-pink-deep" fill="currentColor" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {customer.visits} visits
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ₹{customer.totalSpent.toLocaleString()} spent
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-xs font-semibold",
                    tierInfo.color
                  )}>
                    {tierInfo.tier}
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">{customer.lastVisit}</p>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="w-full bg-card rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />

            {/* Customer Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2",
                getTierInfo(selectedCustomer.loyaltyPoints).color
              )}>
                {getTierInfo(selectedCustomer.loyaltyPoints).icon}
              </div>
              <div>
                <h2 className="font-playfair text-xl font-bold">{selectedCustomer.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                {selectedCustomer.birthday && (
                  <p className="text-sm text-gold-sparkle flex items-center gap-1 mt-1">
                    <Gift className="w-4 h-4" />
                    Birthday: {selectedCustomer.birthday}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-4 bg-pink-soft rounded-2xl text-center">
                <p className="text-xl font-bold text-pink-deep">{selectedCustomer.visits}</p>
                <p className="text-xs text-pink-deep/70">Visits</p>
              </div>
              <div className="p-4 bg-lavender-soft rounded-2xl text-center">
                <p className="text-xl font-bold text-lavender-deep">
                  ₹{(selectedCustomer.totalSpent / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-lavender-deep/70">Total Spent</p>
              </div>
              <div className="p-4 bg-gold-soft rounded-2xl text-center">
                <p className="text-xl font-bold text-chocolate">{selectedCustomer.loyaltyPoints}</p>
                <p className="text-xs text-chocolate/70">Points</p>
              </div>
            </div>

            {/* Favorite Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-gold-sparkle" />
                Favorite Items
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedCustomer.favoriteItems.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 bg-muted rounded-xl text-sm font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="bakery" className="flex-1">
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Promo
              </Button>
              <Button variant="soft" className="flex-1">
                <TrendingUp className="w-4 h-4 mr-2" />
                View History
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
