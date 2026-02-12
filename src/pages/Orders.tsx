import { useState } from "react";
import { Search, Filter, Calendar, Star, Phone, Loader2, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  orderId: string; // UUID for API calls (edit/delete)
  customer: string;
  phone: string;
  items: string;
  itemsDetail?: Array<{
    id: string;
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  total: number;
  date: string;
  time: string;
  visits: number;
}

import { ordersApi } from "@/api/orders";
import { useEffect } from "react";
import { isToday, isYesterday, format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const dateFilters = ["All", "Today", "Yesterday", "This Week", "This Month"];

export default function Orders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadOrders();

    const handleFocus = () => loadOrders();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Lock background scroll when order modal is open
  useEffect(() => {
    if (selectedOrder) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selectedOrder]);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getOrders();
      // Map API response to UI model
      const mapped = data.map((o: any) => {
        const dateObj = new Date(o.created_at);
        let dateLabel = format(dateObj, "MMM dd");
        if (isToday(dateObj)) dateLabel = "Today";
        if (isYesterday(dateObj)) dateLabel = "Yesterday";

        const rawId = o.id != null ? (typeof o.id === "string" ? o.id : String(o.id)) : "";
        return {
          id: o.order_number ? `#${o.order_number}` : (rawId ? `#${rawId.slice(0, 8).toUpperCase()}` : "—"),
          orderId: rawId,
          customer: o.customer_name || "Unknown",
          phone: o.customer_phone || "",
          items: o.items_summary || "Items",
          itemsDetail: o.items || [],
          total: o.total_amount,
          date: dateLabel,
          time: format(dateObj, "h:mm a"),
          visits: 1
        };
      });
      setOrders(mapped);
    } catch (e) {
      console.error("Failed to load orders", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order.orderId) {
      toast({ title: "Cannot delete", description: "Order ID is missing. Please refresh the list.", variant: "destructive" });
      return;
    }
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    try {
      setDeleting(true);
      await ordersApi.deleteOrder(orderToDelete.orderId);
      toast({ title: "Order deleted", description: "Order has been removed." });
      setSelectedOrder(null);
      setOrderToDelete(null);
      setDeleteDialogOpen(false);
      loadOrders();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to delete order", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClick = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order.orderId) {
      toast({ title: "Cannot edit", description: "Order ID is missing. Please refresh the list.", variant: "destructive" });
      return;
    }
    setSelectedOrder(null);
    navigate("/edit-order", { state: { orderId: order.orderId } });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.id.includes(searchQuery);

    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Today" && order.date === "Today") ||
      (activeFilter === "Yesterday" && order.date === "Yesterday");

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="gradient-hero px-4 pt-6 pb-4">
        <h1 className="font-playfair text-2xl font-bold text-foreground mb-1">Order History</h1>
        <p className="text-sm text-muted-foreground mb-4">Tap an order to view details, edit or delete</p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-card/80 backdrop-blur border-0 shadow-soft"
          />
        </div>
      </header>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {dateFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300",
                activeFilter === filter
                  ? "gradient-button text-primary-foreground shadow-button"
                  : "bg-muted text-muted-foreground hover:bg-pink-soft hover:text-pink-deep"
              )}
            >
              {filter === "All" ? <Filter className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <main className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔍</span>
            <p className="text-muted-foreground">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
          <div
            key={order.orderId || order.id}
            onClick={() => setSelectedOrder(order)}
            className="bakery-card cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-foreground">{order.id}</span>
                  {order.visits >= 5 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-soft text-xs font-semibold text-chocolate">
                      <Star className="w-3 h-3 text-gold-sparkle" fill="currentColor" />
                      VIP
                    </span>
                  )}
                </div>
                <p className="font-semibold text-foreground">{order.customer}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {order.phone}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary text-lg">₹{order.total}</p>
                <p className="text-xs text-muted-foreground">{order.date}</p>
                <p className="text-xs text-muted-foreground">{order.time}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex-1 mr-2">
                {order.itemsDetail && order.itemsDetail.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {order.itemsDetail.map((item) => (
                      <div key={item.id} className="flex items-center gap-1">
                        {item.image && item.image.startsWith('http') ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-6 h-6 rounded object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs">{item.image || '🎂'}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {item.quantity}x {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground truncate">{order.items}</p>
                )}
              </div>
              {order.visits > 1 && (
                <span className="px-2 py-1 rounded-lg bg-lavender-soft text-xs font-semibold text-lavender-deep whitespace-nowrap">
                  Visited {order.visits}x
                </span>
              )}
            </div>
          </div>
        ))
        )}
      </main>

      {/* Order Detail Modal - above bottom nav (z-[60]), scrollable content */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[60] bg-foreground/20 backdrop-blur-sm flex flex-col items-end overflow-hidden"
          onClick={() => setSelectedOrder(null)}
        >
          <button
            type="button"
            className="flex-1 w-full min-h-[20%] shrink-0"
            onClick={() => setSelectedOrder(null)}
            aria-label="Close"
          />
          <div
            className="w-full bg-card rounded-t-3xl flex flex-col max-h-[85vh] animate-slide-up shrink-0 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 p-4 pt-3 pb-0">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-playfair text-xl font-bold">{selectedOrder.id}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.date} at {selectedOrder.time}
                  </p>
                </div>
                <span className="text-2xl font-bold text-gradient">₹{selectedOrder.total}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-8 min-h-0 -webkit-overflow-scrolling-touch">
              <div className="space-y-4 pb-6">
                <div className="p-4 bg-muted rounded-2xl">
                  <p className="text-sm text-muted-foreground mb-1">Customer</p>
                  <p className="font-semibold">{selectedOrder.customer}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.phone}</p>
                </div>

                <div className="p-4 bg-muted rounded-2xl">
                  <p className="text-sm text-muted-foreground mb-2">Items</p>
                  {selectedOrder.itemsDetail && selectedOrder.itemsDetail.length > 0 ? (
                    <div className="space-y-2">
                      {selectedOrder.itemsDetail.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          {item.image && (item.image.startsWith('http') || item.image.startsWith('data:')) ? (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-xl">{item.image || '🎂'}</span>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × ₹{item.price} = ₹{item.quantity * item.price}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-medium">{selectedOrder.items}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-border pb-8">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Order actions</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleEditClick(selectedOrder, e)}
                      disabled={!selectedOrder.orderId}
                      className="flex-1 p-3 bg-pink-soft text-pink-deep rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit order
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(selectedOrder, e)}
                      disabled={!selectedOrder.orderId}
                      className="flex-1 p-3 bg-red-100 text-red-700 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the order and restore inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}
