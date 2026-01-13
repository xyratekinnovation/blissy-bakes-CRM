import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Edit2, Trash2, UserCheck, UserX, Loader2, Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { staffApi, type Staff } from "@/api/staff";
import { useToast } from "@/hooks/use-toast";

export default function StaffManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "employee">("employee");
  const [formPin, setFormPin] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await staffApi.getStaff();
      setStaff(data);
    } catch (error) {
      console.error("Failed to load staff:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormName(staffMember.fullName);
    setFormPhone(staffMember.phoneNumber);
    setFormRole(staffMember.role as "admin" | "employee");
    setFormIsActive(staffMember.isActive);
    setFormPin(""); // Don't show existing PIN
    setShowAddModal(true);
  };

  const handleDelete = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to delete ${staffName}?`)) return;

    try {
      await staffApi.deleteStaff(staffId);
      toast({
        title: "Success",
        description: "Staff member deleted successfully"
      });
      await loadStaff();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete staff member",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!formName || !formPhone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate phone number (should be 10 digits)
    if (!/^\d{10}$/.test(formPhone)) {
      toast({
        title: "Error",
        description: "Phone number must be 10 digits",
        variant: "destructive"
      });
      return;
    }

    // Validate PIN if provided (should be 4 digits)
    if (formPin && !/^\d{4}$/.test(formPin)) {
      toast({
        title: "Error",
        description: "PIN must be 4 digits",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingStaff) {
        // Update existing staff
        const updateData: any = {
          fullName: formName,
          phoneNumber: formPhone,
          role: formRole,
          isActive: formIsActive
        };
        
        // Only include PIN if it was changed
        if (formPin) {
          updateData.pin = formPin;
        }
        
        await staffApi.updateStaff(editingStaff.id, updateData);
        toast({
          title: "Success",
          description: "Staff member updated successfully"
        });
      } else {
        // Create new staff
        await staffApi.createStaff({
          fullName: formName,
          phoneNumber: formPhone,
          role: formRole,
          pin: formPin || undefined // Defaults to "1234" on backend if not provided
        });
        toast({
          title: "Success",
          description: "Staff member created successfully"
        });
      }
      
      setShowAddModal(false);
      resetForm();
      await loadStaff();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save staff member",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingStaff(null);
    setFormName("");
    setFormPhone("");
    setFormRole("employee");
    setFormPin("");
    setFormIsActive(true);
  };

  const toggleActive = async (staffMember: Staff) => {
    try {
      await staffApi.updateStaff(staffMember.id, {
        isActive: !staffMember.isActive
      });
      toast({
        title: "Success",
        description: `Staff member ${!staffMember.isActive ? 'activated' : 'deactivated'} successfully`
      });
      await loadStaff();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff status",
        variant: "destructive"
      });
    }
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
          <h1 className="font-playfair text-xl font-bold text-foreground">Staff Management</h1>
        </div>
      </header>

      {/* Staff List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <main className="px-4 space-y-3">
          {staff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No staff members found</p>
            </div>
          ) : (
            staff.map((staffMember) => (
              <div key={staffMember.id} className="bakery-card">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    staffMember.role === "admin" 
                      ? "bg-gold-soft" 
                      : "bg-lavender-soft"
                  )}>
                    {staffMember.role === "admin" ? (
                      <Shield className="w-6 h-6 text-chocolate" />
                    ) : (
                      <User className="w-6 h-6 text-lavender-deep" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-foreground">{staffMember.fullName}</p>
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-xs font-semibold",
                        staffMember.isActive 
                          ? "bg-green-100 text-green-700" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {staffMember.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{staffMember.phoneNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-xs font-medium",
                        staffMember.role === "admin"
                          ? "bg-gold-soft text-chocolate"
                          : "bg-pink-soft text-pink-deep"
                      )}>
                        {staffMember.role === "admin" ? "Admin" : "Employee"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(staffMember)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        staffMember.isActive
                          ? "bg-muted hover:bg-destructive/10"
                          : "bg-green-100 hover:bg-green-200"
                      )}
                    >
                      {staffMember.isActive ? (
                        <UserX className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(staffMember)}
                      className="w-8 h-8 rounded-lg bg-lavender-soft flex items-center justify-center hover:bg-lavender-medium transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-lavender-deep" />
                    </button>
                    <button
                      onClick={() => handleDelete(staffMember.id, staffMember.fullName)}
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
          Add Staff
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
              {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Full Name *</label>
                <Input 
                  placeholder="e.g., John Doe" 
                  className="h-12 rounded-2xl"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Phone Number *</label>
                <Input 
                  type="tel"
                  placeholder="10 digits" 
                  className="h-12 rounded-2xl"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground mt-1">10 digits only</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Role *</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormRole("employee")}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors",
                      formRole === "employee"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted"
                    )}
                  >
                    Employee
                  </button>
                  <button
                    onClick={() => setFormRole("admin")}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors",
                      formRole === "admin"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted"
                    )}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  PIN {editingStaff ? "(Leave empty to keep current)" : "(Leave empty for default: 1234)"}
                </label>
                <Input 
                  type="password"
                  placeholder="4 digits" 
                  className="h-12 rounded-2xl"
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
                <p className="text-xs text-muted-foreground mt-1">4 digits only. Can be changed later via OTP.</p>
              </div>

              {editingStaff && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-5 h-5 rounded border-border"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Staff member is active
                  </label>
                </div>
              )}

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
                  editingStaff ? "Update Staff Member" : "Create Staff Member"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
