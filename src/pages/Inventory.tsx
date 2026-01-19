import { useState, useEffect } from "react";
import { ArrowLeft, Search, Plus, AlertTriangle, Package, TrendingDown, History, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { inventoryApi, type InventoryItem } from "@/api/inventory";
import { productsApi } from "@/api/products";
import { useToast } from "@/hooks/use-toast";

export default function Inventory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState("10");
  const [products, setProducts] = useState<any[]>([]);
  const [formProductId, setFormProductId] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formMinStock, setFormMinStock] = useState("5");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get unique categories from inventory items
  const categories = ["All", ...Array.from(new Set(inventoryItems.map(item => item.category)))];

  useEffect(() => {
    loadInventory();
    if (showAddModal) {
      loadProducts();
    }
  }, [activeCategory, showAddModal]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const items = await inventoryApi.getInventory(activeCategory === "All" ? undefined : activeCategory);
      setInventoryItems(items);
    } catch (error) {
      console.error("Failed to load inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productsApi.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const handleRestockClick = (item: InventoryItem) => {
    setRestockItem(item);
    setRestockQuantity("10");
    setShowRestockModal(true);
  };

  const handleRestock = async () => {
    if (!restockItem || !restockQuantity || parseInt(restockQuantity) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity to add",
        variant: "destructive"
      });
      return;
    }

    try {
      setRestockingId(restockItem.id);
      const quantityToAdd = parseInt(restockQuantity);
      const newStock = restockItem.stock + quantityToAdd;
      await inventoryApi.restockItem(restockItem.id, newStock);
      toast({
        title: "Success",
        description: `${restockItem.name} restocked by ${quantityToAdd} ${restockItem.unit} (new total: ${newStock})`
      });
      setShowRestockModal(false);
      setRestockItem(null);
      setRestockQuantity("10");
      await loadInventory();
    } catch (error) {
      console.error("Failed to restock:", error);
      toast({
        title: "Error",
        description: "Failed to restock item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRestockingId(null);
    }
  };

  const handleDelete = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete inventory for ${itemName}?`)) return;

    try {
      await inventoryApi.deleteInventoryItem(itemId);
      toast({
        title: "Success",
        description: "Inventory item deleted successfully"
      });
      await loadInventory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete inventory item",
        variant: "destructive"
      });
    }
  };

  const handleAddInventory = async () => {
    if (!formProductId || !formStock) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryApi.createInventoryItem({
        productId: formProductId,
        stock: parseInt(formStock),
        minStock: parseInt(formMinStock) || 5
      });
      toast({
        title: "Success",
        description: "Inventory item added successfully"
      });
      setShowAddModal(false);
      setFormProductId("");
      setFormStock("");
      setFormMinStock("5");
      await loadInventory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add inventory item",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventoryItems.filter((item) => item.stock <= item.minStock);
  const getStockPercentage = (item: InventoryItem) => 
    Math.min((item.stock / (item.minStock * 2)) * 100, 100);

  const formatDate = (dateStr: string) => {
    if (dateStr === "Never") return "Never";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="gradient-hero px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center shadow-soft"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-playfair text-xl font-bold text-foreground">Inventory</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-card/80 backdrop-blur border-0 shadow-soft"
          />
        </div>
      </header>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="mx-4 mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <span className="font-semibold text-destructive">Low Stock Alert</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} running low: 
            <span className="font-medium text-foreground"> {lowStockItems.slice(0, 3).map(i => i.name).join(", ")}</span>
            {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more`}
          </p>
        </div>
      )}

      {/* Categories */}
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300",
                activeCategory === category
                  ? "bg-lavender-medium text-lavender-deep"
                  : "bg-muted text-muted-foreground"
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

      {/* Inventory List */}
      {!loading && (
        <main className="px-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No inventory items found</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const percentage = getStockPercentage(item);
              const isLow = item.stock <= item.minStock;
              
              return (
                <div key={item.id} className="bakery-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        isLow ? "bg-destructive/10" : "bg-lavender-soft"
                      )}>
                        <Package className={cn(
                          "w-6 h-6",
                          isLow ? "text-destructive" : "text-lavender-deep"
                        )} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-xl font-bold",
                        isLow ? "text-destructive" : "text-foreground"
                      )}>
                        {item.stock} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span>
                      </p>
                      {isLow && (
                        <span className="flex items-center gap-1 text-xs text-destructive">
                          <TrendingDown className="w-3 h-3" />
                          Below min ({item.minStock})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "absolute left-0 top-0 h-full rounded-full transition-all duration-500",
                        isLow ? "bg-destructive" : percentage > 70 ? "bg-green-400" : "bg-lavender-deep"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <History className="w-3 h-3" />
                      Restocked {formatDate(item.lastRestock)}
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary h-8"
                        onClick={() => handleRestockClick(item)}
                        disabled={restockingId === item.id}
                      >
                        {restockingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Restock"
                        )}
                      </Button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
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
          onClick={() => setShowAddModal(true)}
          variant="bakery"
          size="lg"
          className="shadow-glow"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Inventory
        </Button>
      </div>

      {/* Add Inventory Modal */}
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
            <h2 className="font-playfair text-xl font-bold mb-6">Add Inventory Item</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Product *</label>
                <select
                  className="w-full h-12 px-4 rounded-2xl border-2 border-border focus:border-primary bg-card"
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Stock Quantity *</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    className="h-12 rounded-2xl"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Min Stock</label>
                  <Input 
                    type="number" 
                    placeholder="5" 
                    className="h-12 rounded-2xl"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                variant="bakery" 
                size="lg" 
                className="w-full mt-4"
                onClick={handleAddInventory}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Inventory Item"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && restockItem && (
        <div
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end"
          onClick={() => {
            setShowRestockModal(false);
            setRestockItem(null);
            setRestockQuantity("10");
          }}
        >
          <div
            className="w-full bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <h2 className="font-playfair text-xl font-bold mb-6">Restock {restockItem.name}</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Stock</span>
                  <span className="text-lg font-bold text-foreground">{restockItem.stock} {restockItem.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Minimum Stock</span>
                  <span className="text-sm text-foreground">{restockItem.minStock} {restockItem.unit}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Quantity to Add *</label>
                <Input 
                  type="number" 
                  placeholder="10" 
                  className="h-12 rounded-2xl"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  min="1"
                />
                <p className="text-xs text-muted-foreground mt-1">New total will be: {restockItem.stock + (parseInt(restockQuantity) || 0)} {restockItem.unit}</p>
              </div>

              <Button 
                variant="bakery" 
                size="lg" 
                className="w-full mt-4"
                onClick={handleRestock}
                disabled={isSubmitting || restockingId === restockItem.id}
              >
                {isSubmitting || restockingId === restockItem.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Restocking...
                  </>
                ) : (
                  "Restock Item"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
