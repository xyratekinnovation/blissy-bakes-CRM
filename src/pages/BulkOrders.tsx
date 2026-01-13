import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Calendar, Upload, CreditCard, Clock, CheckCircle, AlertCircle, Loader2, Edit2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { bulkOrdersApi, type BulkOrder } from "@/api/bulkOrders";
import { useToast } from "@/hooks/use-toast";

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-700", icon: AlertCircle, label: "Pending Confirmation" },
  confirmed: { color: "bg-blue-100 text-blue-700", icon: CheckCircle, label: "Confirmed" },
  "in-progress": { color: "bg-lavender-soft text-lavender-deep", icon: Clock, label: "In Progress" },
  ready: { color: "bg-green-100 text-green-700", icon: CheckCircle, label: "Ready for Pickup" },
  delivered: { color: "bg-muted text-muted-foreground", icon: CheckCircle, label: "Delivered" },
};

const eventTypeColors: Record<string, string> = {
  Wedding: "🎊",
  Corporate: "🏢",
  Birthday: "🎂",
  School: "🎓",
  Anniversary: "💕",
};

export default function BulkOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<BulkOrder | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Form state
  const [formCustomer, setFormCustomer] = useState("");
  const [formEventType, setFormEventType] = useState("Wedding");
  const [formDate, setFormDate] = useState("");
  const [formItems, setFormItems] = useState("");
  const [formTotal, setFormTotal] = useState("");
  const [formAdvance, setFormAdvance] = useState("");
  const [formStatus, setFormStatus] = useState("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBulkOrders();
  }, []);

  const loadBulkOrders = async () => {
    try {
      setLoading(true);
      const data = await bulkOrdersApi.getBulkOrders();
      setBulkOrders(data);
    } catch (error) {
      console.error("Failed to load bulk orders:", error);
      toast({
        title: "Error",
        description: "Failed to load bulk orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!formCustomer || !formDate || !formItems || !formTotal) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await bulkOrdersApi.createBulkOrder({
        customer: formCustomer,
        eventType: formEventType,
        deliveryDate: formDate,
        items: formItems,
        total: parseFloat(formTotal),
        advance: parseFloat(formAdvance) || 0
      });
      
      toast({
        title: "Success",
        description: "Bulk order created successfully"
      });
      
      setShowNewOrder(false);
      setFormCustomer("");
      setFormEventType("Wedding");
      setFormDate("");
      setFormItems("");
      setFormTotal("");
      setFormAdvance("");
      await loadBulkOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create bulk order",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await bulkOrdersApi.updateStatus(orderId, newStatus);
      toast({
        title: "Success",
        description: "Status updated successfully"
      });
      await loadBulkOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (order: BulkOrder) => {
    setEditingOrder(order);
    setFormCustomer(order.customer);
    setFormEventType(order.eventType);
    setFormDate(order.date);
    setFormItems(order.items);
    setFormTotal(order.total.toString());
    setFormAdvance(order.advance.toString());
    setFormStatus(order.status);
    setShowUpdateModal(true);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    try {
      setIsSubmitting(true);
      await bulkOrdersApi.updateBulkOrder(editingOrder.id, {
        status: formStatus,
        advance: parseFloat(formAdvance) || 0,
        total: parseFloat(formTotal) || 0,
        items: formItems,
        deliveryDate: formDate ? new Date(formDate).toISOString() : undefined
      });
      
      toast({
        title: "Success",
        description: "Bulk order updated successfully"
      });
      
      setShowUpdateModal(false);
      setEditingOrder(null);
      await loadBulkOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update bulk order",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFullyPaid = async (orderId: string, total: number) => {
    try {
      await bulkOrdersApi.updateBulkOrder(orderId, {
        advance: total
      });
      toast({
        title: "Success",
        description: "Order marked as fully paid"
      });
      await loadBulkOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this bulk order?")) return;

    try {
      await bulkOrdersApi.deleteBulkOrder(orderId);
      toast({
        title: "Success",
        description: "Bulk order deleted successfully"
      });
      await loadBulkOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bulk order",
        variant: "destructive"
      });
    }
  };

  const totalRevenue = bulkOrders.reduce((sum, o) => sum + o.total, 0);
  const activeOrders = bulkOrders.filter(o => o.status === "in-progress" || o.status === "confirmed").length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="gradient-hero px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center shadow-soft"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-playfair text-xl font-bold text-foreground">Bulk Orders</h1>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-gradient">{bulkOrders.length}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </div>
          <div className="glass-card rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-lavender-deep">{activeOrders}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="glass-card rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-gold-sparkle">₹{(totalRevenue / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
        </div>
      </header>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <main className="px-4 py-4 space-y-4">
          {bulkOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No bulk orders found</p>
            </div>
          ) : (
            bulkOrders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = status.icon;
              
              return (
                <div key={order.id} className="bakery-card">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{eventTypeColors[order.eventType] || "📦"}</span>
                      <div>
                        <p className="font-semibold text-foreground">{order.customer}</p>
                        <p className="text-sm text-muted-foreground">{order.id}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1",
                      status.color
                    )}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Event Date:</span>
                      <span className="font-medium">{order.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.items}</p>
                  </div>

                  {/* Payment Progress */}
                  <div className="p-3 bg-muted rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Payment</span>
                      <span className="font-semibold text-foreground">
                        ₹{order.advance.toLocaleString()} / ₹{order.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-card rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-button rounded-full transition-all duration-500"
                        style={{ width: `${(order.advance / order.total) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">Advance Paid</span>
                      <span className="text-xs font-medium text-primary">
                        {((order.advance / order.total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <Button 
                      variant="soft" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(order)}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Update
                    </Button>
                    {order.advance < order.total && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleFullyPaid(order.id, order.total)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Fully Paid
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
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
          onClick={() => setShowNewOrder(true)}
          variant="bakery"
          size="lg"
          className="shadow-glow"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Bulk Order
        </Button>
      </div>

      {/* New Order Modal */}
      {showNewOrder && (
        <div
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end"
          onClick={() => setShowNewOrder(false)}
        >
          <div
            className="w-full bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <h2 className="font-playfair text-xl font-bold mb-6">New Bulk Order</h2>
            
            <div className="space-y-4">
              {/* Event Type */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Event Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(eventTypeColors).map(([type, emoji]) => (
                    <button
                      key={type}
                      onClick={() => setFormEventType(type)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-colors text-center",
                        formEventType === type
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted hover:border-primary/50"
                      )}
                    >
                      <span className="text-2xl block mb-1">{emoji}</span>
                      <span className="text-xs font-medium">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Customer / Event Name *"
                  className="w-full h-12 px-4 rounded-2xl border-2 border-border focus:border-primary bg-card"
                  value={formCustomer}
                  onChange={(e) => setFormCustomer(e.target.value)}
                />
                <input
                  type="date"
                  className="w-full h-12 px-4 rounded-2xl border-2 border-border focus:border-primary bg-card"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
                <textarea
                  placeholder="Cake/Pastry selections and details... *"
                  className="w-full p-4 rounded-2xl border-2 border-border focus:border-primary bg-card resize-none"
                  rows={3}
                  value={formItems}
                  onChange={(e) => setFormItems(e.target.value)}
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Total Amount ₹ *"
                  className="h-12 px-4 rounded-2xl border-2 border-border focus:border-primary bg-card"
                  value={formTotal}
                  onChange={(e) => setFormTotal(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Advance ₹"
                  className="h-12 px-4 rounded-2xl border-2 border-border focus:border-primary bg-card"
                  value={formAdvance}
                  onChange={(e) => setFormAdvance(e.target.value)}
                />
              </div>

              <Button 
                variant="bakery" 
                size="lg" 
                className="w-full"
                onClick={handleCreateOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Order"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Update Order Modal */}
      {showUpdateModal && editingOrder && (
        <div
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end"
          onClick={() => {
            setShowUpdateModal(false);
            setEditingOrder(null);
          }}
        >
          <div
            className="w-full bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <h2 className="font-playfair text-xl font-bold mb-6">Update Bulk Order</h2>
            
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Status</label>
                <select
                  className="w-full h-12 px-4 rounded-2xl border-2 border-border focus:border-primary bg-card"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <Input
                  placeholder="Customer / Event Name"
                  className="h-12 rounded-2xl"
                  value={formCustomer}
                  onChange={(e) => setFormCustomer(e.target.value)}
                />
                <Input
                  type="date"
                  className="h-12 rounded-2xl"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
                <textarea
                  placeholder="Items and details..."
                  className="w-full p-4 rounded-2xl border-2 border-border focus:border-primary bg-card resize-none"
                  rows={3}
                  value={formItems}
                  onChange={(e) => setFormItems(e.target.value)}
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Total Amount</label>
                  <Input
                    type="number"
                    placeholder="₹0"
                    className="h-12 rounded-2xl"
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Advance Paid</label>
                  <Input
                    type="number"
                    placeholder="₹0"
                    className="h-12 rounded-2xl"
                    value={formAdvance}
                    onChange={(e) => setFormAdvance(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="bakery" 
                  size="lg" 
                  className="flex-1"
                  onClick={handleUpdateOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Order"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    if (editingOrder) {
                      handleFullyPaid(editingOrder.id, parseFloat(formTotal) || editingOrder.total);
                    }
                  }}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Fully Paid
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
