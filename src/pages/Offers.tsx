import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Gift, Calendar, Percent, Tag, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { offersApi, type Offer } from "@/api/offers";
import { useToast } from "@/hooks/use-toast";

const typeIcons = {
  percent: Percent,
  combo: Tag,
  festival: Sparkles,
};

const typeColors = {
  percent: "bg-pink-soft text-pink-deep border-pink-medium",
  combo: "bg-lavender-soft text-lavender-deep border-lavender-medium",
  festival: "bg-gold-soft text-chocolate border-gold-sparkle",
};

export default function Offers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, redeemed: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"percent" | "fixed">("percent");
  const [formValue, setFormValue] = useState("");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadOffers();
    loadStats();
  }, [filter]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const data = await offersApi.getOffers(filter);
      setOffers(data);
    } catch (error) {
      console.error("Failed to load offers:", error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await offersApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleCreateOffer = async () => {
    if (!formTitle || !formValue) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await offersApi.createOffer({
        title: formTitle,
        code: formCode || undefined,
        type: formType,
        discountValue: parseFloat(formValue),
        startDate: formStartDate || undefined,
        endDate: formEndDate || undefined,
        isActive: formIsActive
      });
      
      toast({
        title: "Success",
        description: "Offer created successfully"
      });
      
      setShowAddModal(false);
      setFormTitle("");
      setFormCode("");
      setFormType("percent");
      setFormValue("");
      setFormStartDate(new Date().toISOString().split('T')[0]);
      setFormEndDate("");
      setFormIsActive(true);
      await loadOffers();
      await loadStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create offer",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="gradient-hero px-4 pt-4 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gold-sparkle/10 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center shadow-soft"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-playfair text-xl font-bold text-foreground">Offers & Coupons</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 relative z-10">
          <div className="glass-card rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-gradient">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="glass-card rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-lavender-deep">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="glass-card rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-gold-sparkle">{stats.redeemed}</p>
            <p className="text-xs text-muted-foreground">Redeemed</p>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="px-4 py-4">
        <div className="flex gap-2 p-1 bg-muted rounded-2xl">
          {(["all", "active", "expired"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-300",
                filter === f
                  ? "bg-card shadow-soft text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Offers List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <main className="px-4 space-y-3">
          {offers.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No offers found</p>
            </div>
          ) : (
            offers.map((offer) => {
              const Icon = typeIcons[offer.type] || Percent;
              return (
                <div
                  key={offer.id}
                  className={cn(
                    "relative rounded-2xl border-2 p-4 transition-all duration-300",
                    typeColors[offer.type] || typeColors.percent,
                    !offer.isActive && "opacity-60"
                  )}
                >
                  {/* Candy-like decorative circles */}
                  <div className="absolute top-1/2 -left-2 w-4 h-4 bg-background rounded-full" />
                  <div className="absolute top-1/2 -right-2 w-4 h-4 bg-background rounded-full" />

                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center",
                      offer.type === "percent" && "bg-pink-medium/30",
                      offer.type === "combo" && "bg-lavender-medium/30",
                      offer.type === "festival" && "bg-gold-sparkle/30"
                    )}>
                      <Icon className="w-7 h-7" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{offer.title}</h3>
                        {!offer.isActive && (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                            Expired
                          </span>
                        )}
                      </div>
                      <p className="text-sm opacity-80 mb-2">{offer.description}</p>
                      
                      <div className="flex items-center gap-3">
                        {offer.code && (
                          <span className="px-2 py-1 bg-card/50 rounded-lg text-xs font-mono font-bold">
                            {offer.code}
                          </span>
                        )}
                        <span className="text-xs opacity-70 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {offer.validUntil}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-bold">{offer.value}</span>
                      <p className="text-xs opacity-70">OFF</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>
      )}

      {/* Add Button */}
      <div className="fixed bottom-6 right-4">
        <Button 
          variant="gold" 
          size="lg" 
          className="shadow-gold"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Offer
        </Button>
      </div>

      {/* Create Offer Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <h2 className="font-playfair text-xl font-bold mb-6">Create New Offer</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Offer Title *</label>
                <Input 
                  placeholder="e.g., Summer Sale" 
                  className="h-12 rounded-2xl"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Coupon Code (Optional)</label>
                <Input 
                  placeholder="e.g., SUMMER20" 
                  className="h-12 rounded-2xl"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Discount Type *</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormType("percent")}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors",
                      formType === "percent"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted"
                    )}
                  >
                    Percentage (%)
                  </button>
                  <button
                    onClick={() => setFormType("fixed")}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors",
                      formType === "fixed"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted"
                    )}
                  >
                    Fixed (₹)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Discount Value *</label>
                <Input 
                  type="number" 
                  placeholder={formType === "percent" ? "20" : "100"} 
                  className="h-12 rounded-2xl"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formType === "percent" ? "Enter percentage (e.g., 20 for 20%)" : "Enter amount in ₹"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Start Date</label>
                  <Input 
                    type="date"
                    className="h-12 rounded-2xl"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">End Date</label>
                  <Input 
                    type="date"
                    className="h-12 rounded-2xl"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-border"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Offer is active
                </label>
              </div>

              <Button 
                variant="gold" 
                size="lg" 
                className="w-full mt-4"
                onClick={handleCreateOffer}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Offer"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
