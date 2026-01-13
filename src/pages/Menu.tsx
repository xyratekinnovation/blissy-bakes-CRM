import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Edit2, Search, Loader2, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { productsApi, type Product } from "@/api/products";
import { useToast } from "@/hooks/use-toast";

const categories = ["All", "Cakes", "Pastries", "Breads", "Cookies", "Snacks", "Drinks"];

export default function Menu() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("Cakes");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string>("");
  const [formStock, setFormStock] = useState("");
  const [formMinStock, setFormMinStock] = useState("5");
  const [formIsAvailable, setFormIsAvailable] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [activeCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const category = activeCategory === "All" ? undefined : activeCategory;
      const data = await productsApi.getProducts(category);
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormPrice(product.price.toString());
    setFormCategory(product.category);
    setFormImageFile(null);
    setFormImagePreview(product.image);
    setFormStock(product.stock.toString());
    setFormMinStock("5");
    setFormIsAvailable(product.isAvailable);
    setShowAddModal(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await productsApi.deleteProduct(productId);
      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
      await loadProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image file is too large. Maximum size is 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setFormImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formName || !formPrice || !formCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingProduct) {
        // Update existing product
        await productsApi.updateProduct(editingProduct.id, {
          name: formName,
          price: parseFloat(formPrice),
          category: formCategory,
          imageFile: formImageFile || undefined,
          imageUrl: formImageFile ? undefined : (formImagePreview || undefined),
          isAvailable: formIsAvailable
        });
        toast({
          title: "Success",
          description: "Product updated successfully"
        });
      } else {
        // Create new product
        await productsApi.createProduct({
          name: formName,
          price: parseFloat(formPrice),
          category: formCategory,
          imageFile: formImageFile || undefined,
          imageUrl: formImageFile ? undefined : (formImagePreview || undefined),
          stock: parseInt(formStock) || 0,
          minStock: parseInt(formMinStock) || 5,
          isAvailable: formIsAvailable
        });
        toast({
          title: "Success",
          description: "Product created successfully"
        });
      }
      
      setShowAddModal(false);
      resetForm();
      await loadProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormName("");
    setFormPrice("");
    setFormCategory("Cakes");
    setFormImageFile(null);
    setFormImagePreview("");
    setFormStock("");
    setFormMinStock("5");
    setFormIsAvailable(true);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="font-playfair text-xl font-bold text-foreground">Menu & Pricing</h1>
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

      {/* Categories */}
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300",
                activeCategory === category
                  ? "gradient-button text-primary-foreground shadow-button"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <main className="px-4 space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="bakery-card">
                <div className="flex items-start gap-4">
                  {product.image && (product.image.startsWith('http') || product.image.startsWith('data:')) ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-pink-soft flex items-center justify-center text-2xl">
                      {product.image || "🎂"}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="font-bold text-primary">₹{product.price}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-muted">
                        {product.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Stock: {product.stock}
                      </span>
                      {!product.isAvailable && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="w-8 h-8 rounded-lg bg-lavender-soft flex items-center justify-center hover:bg-lavender-medium transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-lavender-deep" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      )}

      {/* Add Button */}
      <div className="fixed bottom-6 right-4">
        <Button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          variant="bakery"
          size="lg"
          className="shadow-glow"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end"
          onClick={() => {
            setShowAddModal(false);
            resetForm();
          }}
        >
          <div
            className="w-full bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <h2 className="font-playfair text-xl font-bold mb-6">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Product Name *</label>
                <Input 
                  placeholder="e.g., Red Velvet Cake" 
                  className="h-12 rounded-2xl"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Price (₹) *</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    className="h-12 rounded-2xl"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Category *</label>
                  <select
                    className="w-full h-12 px-4 rounded-2xl border-2 border-border focus:border-primary bg-card"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {categories.slice(1).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Product Image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="w-full h-12 px-4 rounded-2xl border-2 border-border focus:border-primary bg-card file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">Upload JPEG, PNG, GIF, or WebP (max 5MB). Leave empty to use emoji.</p>
                
                {/* Image Preview */}
                {formImagePreview && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-border">
                      {formImagePreview.startsWith('data:') || formImagePreview.startsWith('http') ? (
                        <img 
                          src={formImagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-pink-soft">
                          {formImagePreview}
                        </div>
                      )}
                    </div>
                    {formImageFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormImageFile(null);
                          setFormImagePreview(editingProduct?.image || "");
                        }}
                        className="mt-2 text-xs text-destructive hover:underline"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!editingProduct && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Initial Stock</label>
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
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formIsAvailable}
                  onChange={(e) => setFormIsAvailable(e.target.checked)}
                  className="w-5 h-5 rounded border-border"
                />
                <label htmlFor="isAvailable" className="text-sm font-medium">
                  Product is available
                </label>
              </div>

              <Button 
                variant="bakery" 
                size="lg" 
                className="w-full mt-4"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingProduct ? "Update Product" : "Create Product"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
