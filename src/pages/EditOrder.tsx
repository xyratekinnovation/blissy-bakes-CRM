import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2, CreditCard, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ordersApi } from "@/api/orders";
import { productsApi, type Product } from "@/api/products";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EditItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function EditOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const orderId = (location.state as { orderId?: string })?.orderId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'other'>('cash');
  const [items, setItems] = useState<EditItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    if (!orderId) {
      toast({ title: "Error", description: "Order not found", variant: "destructive" });
      navigate("/orders");
      return;
    }
    loadOrder();
    productsApi.getProducts().then(setProducts);
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const order = await ordersApi.getOrder(orderId);
      setCustomerName(order.customer_name || "");
      setCustomerPhone(order.customer_phone || "");
      setNotes(order.notes || "");
      setPaymentMethod((order.payment_method || "cash") as any);
      setItems(
        (order.items || []).map((i: any) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        }))
      );
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load order", variant: "destructive" });
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const updateQuantity = (productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const addProduct = (p: Product) => {
    const existing = items.find((i) => i.productId === p.id);
    if (existing) {
      updateQuantity(p.id, 1);
    } else {
      setItems((prev) => [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1 }]);
    }
    setShowAddProduct(false);
  };

  const handleSave = async () => {
    if (!orderId || !customerName.trim() || !customerPhone.trim()) {
      toast({ title: "Error", description: "Customer name and phone are required", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Error", description: "Add at least one item", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      await ordersApi.updateOrder(orderId, {
        customer: { fullName: customerName.trim(), phoneNumber: customerPhone.trim(), notes: notes || undefined },
        items: items.map((i) => ({ id: i.productId, quantity: i.quantity, price: i.price })),
        paymentMethod,
        totalAmount: total,
        staffId: user?.id,
        notes: notes || undefined,
      });
      toast({ title: "Saved", description: "Order updated successfully." });
      navigate("/orders");
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update order", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const paymentMethods = [
    { value: 'cash' as const, label: 'Cash', icon: '💵' },
    { value: 'card' as const, label: 'Card', icon: '💳' },
    { value: 'upi' as const, label: 'UPI', icon: '📱' },
    { value: 'other' as const, label: 'Other', icon: '🔀' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="gradient-hero px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/orders")}
            className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center shadow-soft"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-playfair text-xl font-bold text-foreground">Edit Order</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Customer</label>
          <Input
            placeholder="Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="rounded-xl"
          />
          <Input
            placeholder="Phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">Items</label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add item
            </Button>
          </div>
          {showAddProduct && (
            <div className="p-3 bg-muted rounded-xl max-h-48 overflow-y-auto space-y-1">
              {products.filter((p) => p.isAvailable).map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-background text-left"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">₹{p.price}</span>
                </button>
              ))}
            </div>
          )}
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-2 p-3 bg-muted rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground">₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="w-8 h-8 rounded-lg bg-background flex items-center justify-center font-bold"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="w-8 h-8 rounded-lg bg-background flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

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

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Notes</label>
          <Textarea
            placeholder="Optional notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-xl resize-none"
            rows={2}
          />
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border">
          <span className="text-lg font-bold text-foreground">Total</span>
          <span className="text-xl font-bold text-gradient">₹{total}</span>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          variant="bakery"
          size="xl"
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </main>
    </div>
  );
}
