import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Edit2, MessageCircle, Receipt, Sparkles, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ordersApi } from "@/api/orders";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function BillPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { cart = [], customer = {} } = location.state || {};

  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'other'>('cash');
  const [isCreating, setIsCreating] = useState(false);

  const subtotal = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05); // 5% tax
  const total = subtotal + tax;

  const handleGenerateBill = async () => {
    if (!customer.name || !customer.phone) {
      toast({
        title: "Error",
        description: "Customer information is missing",
        variant: "destructive"
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);

      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      // Prepare order payload
      const orderPayload = {
        customer: {
          fullName: customer.name,
          phoneNumber: customer.phone,
          notes: customer.birthday ? `Birthday: ${customer.birthday}` : undefined
        },
        items: cart.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        paymentMethod: paymentMethod,
        totalAmount: total,
        staffId: user?.id,
        notes: notes || undefined
      };

      // Create order in database
      const result = await ordersApi.createOrder(orderPayload);

      toast({
        title: "Success!",
        description: "Order created successfully",
      });

      // Navigate to success page with order ID
      navigate("/bill-success", {
        state: { 
          cart, 
          customer, 
          subtotal, 
          tax, 
          total, 
          notes,
          orderId: result.orderId,
          orderNumber: result.orderNumber 
        },
      });
    } catch (error: any) {
      console.error("Failed to create order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleShareWhatsApp = () => {
    const itemsList = cart
      .map((item: any) => `• ${item.name} x${item.quantity} - ₹${item.price * item.quantity}`)
      .join("\n");
    
    const message = encodeURIComponent(
      `🧁 *Blissyy Bakes*\n\n` +
      `Hi ${customer.name}!\n\n` +
      `*Your Order:*\n${itemsList}\n\n` +
      `Subtotal: ₹${subtotal}\n` +
      `Tax (5%): ₹${tax}\n` +
      `*Total: ₹{total}*\n\n` +
      `Thank you for choosing Blissyy Bakes! 💖`
    );
    
    window.open(`https://wa.me/${customer.phone}?text=${message}`, "_blank");
  };

  const paymentMethods = [
    { value: 'cash' as const, label: 'Cash', icon: '💵' },
    { value: 'card' as const, label: 'Card', icon: '💳' },
    { value: 'upi' as const, label: 'UPI', icon: '📱' },
    { value: 'other' as const, label: 'Other', icon: '🔀' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero px-4 py-4 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-lavender-medium/20 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center shadow-soft"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-playfair text-xl font-bold text-foreground">Bill Preview</h1>
        </div>
      </header>

      {/* Bill Card */}
      <main className="px-4 -mt-14">
        <div className="glass-card rounded-3xl shadow-card overflow-hidden">
          {/* Bill Header */}
          <div className="gradient-button p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-card/20 mx-auto flex items-center justify-center mb-3">
              <span className="text-3xl">🎂</span>
            </div>
            <h2 className="font-playfair text-2xl font-bold text-card">Blissyy Bakes</h2>
            <p className="text-card/80 text-sm">Sweet Sales. Made Simple.</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-2xl">
              <div>
                <p className="font-semibold text-foreground">{customer.name}</p>
                <p className="text-sm text-muted-foreground">{customer.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                Order Items
              </h3>
              {cart.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {item.image && (item.image.startsWith('http') || item.image.startsWith('data:')) ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xl">{item.image || '🎂'}</span>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.price} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-foreground">
                    ₹{item.price * item.quantity}
                  </p>
                </div>
              ))}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all",
                      paymentMethod === method.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl block mb-1">{method.icon}</span>
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-primary" />
                  Special Notes
                </label>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-primary font-medium"
                >
                  {isEditing ? "Done" : "Edit"}
                </button>
              </div>
              {isEditing ? (
                <Textarea
                  placeholder="E.g., No candles, Less icing..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-2xl border-2 border-border focus:border-primary bg-card resize-none"
                  rows={2}
                />
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-2xl">
                  {notes || "No special notes"}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t border-border">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                <span className="text-foreground">Total</span>
                <span className="text-gradient">₹{total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3 pb-8">
          <Button
            onClick={handleGenerateBill}
            variant="bakery"
            size="xl"
            className="w-full"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Bill & Create Order
              </>
            )}
          </Button>
          <Button
            onClick={handleShareWhatsApp}
            variant="soft"
            size="lg"
            className="w-full"
            disabled={isCreating}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Share on WhatsApp
          </Button>
        </div>
      </main>
    </div>
  );
}
