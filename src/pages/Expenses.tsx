import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Receipt, TrendingDown, Calendar, Tag, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { expensesApi, type Expense } from "@/api/expenses";
import { useToast } from "@/hooks/use-toast";

const categories = ["All", "Ingredients", "Utilities", "Supplies", "Payroll", "Transport", "Maintenance"];

const categoryColors: Record<string, string> = {
  Ingredients: "bg-pink-soft text-pink-deep",
  Utilities: "bg-lavender-soft text-lavender-deep",
  Supplies: "bg-gold-soft text-chocolate",
  Payroll: "bg-green-100 text-green-700",
  Transport: "bg-blue-100 text-blue-700",
  Maintenance: "bg-orange-100 text-orange-700",
};

export default function Expenses() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ monthTotal: 0, todayTotal: 0 });

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("Ingredients");
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadExpenses();
    loadStats();
  }, [activeCategory]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expensesApi.getExpenses(activeCategory === "All" ? undefined : activeCategory);
      setExpenses(data);
    } catch (error) {
      console.error("Failed to load expenses:", error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await expensesApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleSubmitExpense = async () => {
    if (!formTitle || !formAmount || !formCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await expensesApi.createExpense({
        title: formTitle,
        amount: parseFloat(formAmount),
        category: formCategory,
        date: formDate,
        description: formNotes
      });
      
      toast({
        title: "Success",
        description: "Expense added successfully"
      });
      
      setShowAddModal(false);
      setFormTitle("");
      setFormAmount("");
      setFormCategory("Ingredients");
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormNotes("");
      await loadExpenses();
      await loadStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExpenses = expenses;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

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
          <h1 className="font-playfair text-xl font-bold text-foreground">Expenses</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              <span className="text-sm text-muted-foreground">This Month</span>
            </div>
            <p className="text-2xl font-bold text-foreground">₹{(stats.monthTotal / 1000).toFixed(1)}K</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
            <p className="text-2xl font-bold text-foreground">₹{stats.todayTotal.toLocaleString()}</p>
          </div>
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

      {/* Expenses List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <main className="px-4 space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No expenses found</p>
            </div>
          ) : (
            filteredExpenses.map((expense) => (
              <div key={expense.id} className="bakery-card">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    categoryColors[expense.category] || "bg-muted text-foreground"
                  )}>
                    <Receipt className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-foreground">{expense.title}</p>
                      <p className="font-bold text-destructive">-₹{expense.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-xs font-medium",
                        categoryColors[expense.category] || "bg-muted"
                      )}>
                        {expense.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(expense.date)}</span>
                    </div>
                    {expense.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{expense.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to delete "${expense.title}"?`)) return;
                      try {
                        await expensesApi.deleteExpense(expense.id);
                        toast({
                          title: "Success",
                          description: "Expense deleted successfully"
                        });
                        await loadExpenses();
                        await loadStats();
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to delete expense",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))
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
          Add Expense
        </Button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full bg-card rounded-t-3xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <h2 className="font-playfair text-xl font-bold mb-6">Add New Expense</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Title *</label>
                <Input 
                  placeholder="What was this expense for?" 
                  className="h-12 rounded-2xl"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Amount *</label>
                <Input 
                  type="number" 
                  placeholder="₹0" 
                  className="h-12 rounded-2xl"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Category *</label>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(1).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFormCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-colors",
                        formCategory === cat
                          ? categoryColors[cat] + " border-primary"
                          : "border-border bg-muted"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Date</label>
                <Input 
                  type="date"
                  className="h-12 rounded-2xl"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Notes (Optional)</label>
                <Input 
                  placeholder="Any additional details..." 
                  className="h-12 rounded-2xl"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <Button 
                variant="bakery" 
                size="lg" 
                className="w-full mt-4"
                onClick={handleSubmitExpense}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Expense"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
