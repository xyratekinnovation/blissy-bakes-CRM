import { useState, useEffect } from "react";
import { ArrowLeft, Save, Building2, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AccountSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get current user from localStorage
  const [user, setUser] = useState<any>(null);
  
  // Form state
  const [formBusinessName, setFormBusinessName] = useState("Blissyy Bakes");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formPincode, setFormPincode] = useState("");

  useEffect(() => {
    // Load user data
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setFormOwnerName(userData.fullName || "");
      setFormPhone(userData.phoneNumber || "");
    }
    
    // Load business info from localStorage (if exists)
    const businessInfo = localStorage.getItem('businessInfo');
    if (businessInfo) {
      const info = JSON.parse(businessInfo);
      setFormBusinessName(info.businessName || "Blissyy Bakes");
      setFormEmail(info.email || "");
      setFormAddress(info.address || "");
      setFormCity(info.city || "");
      setFormState(info.state || "");
      setFormPincode(info.pincode || "");
    }
  }, []);

  const handleSave = async () => {
    if (!formBusinessName || !formOwnerName || !formPhone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate phone number
    if (!/^\d{10}$/.test(formPhone)) {
      toast({
        title: "Error",
        description: "Phone number must be 10 digits",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Save business info to localStorage
      const businessInfo = {
        businessName: formBusinessName,
        email: formEmail,
        address: formAddress,
        city: formCity,
        state: formState,
        pincode: formPincode
      };
      localStorage.setItem('businessInfo', JSON.stringify(businessInfo));
      
      // Update user info in localStorage
      if (user) {
        const updatedUser = {
          ...user,
          fullName: formOwnerName,
          phoneNumber: formPhone
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      
      toast({
        title: "Success",
        description: "Account settings saved successfully"
      });
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate("/settings");
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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
          <h1 className="font-playfair text-xl font-bold text-foreground">Account Settings</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Business Information */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Business Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Business Name *
              </label>
              <Input 
                placeholder="Blissyy Bakes" 
                className="h-12 rounded-2xl"
                value={formBusinessName}
                onChange={(e) => setFormBusinessName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Owner Phone Number *
              </label>
              <Input 
                type="tel"
                placeholder="10 digits" 
                className="h-12 rounded-2xl"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <Input 
                type="email"
                placeholder="business@example.com" 
                className="h-12 rounded-2xl"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Address Information */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Address Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Street Address
              </label>
              <Input 
                placeholder="Street address" 
                className="h-12 rounded-2xl"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">City</label>
                <Input 
                  placeholder="City" 
                  className="h-12 rounded-2xl"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">State</label>
                <Input 
                  placeholder="State" 
                  className="h-12 rounded-2xl"
                  value={formState}
                  onChange={(e) => setFormState(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Pincode</label>
              <Input 
                type="tel"
                placeholder="6 digits" 
                className="h-12 rounded-2xl"
                value={formPincode}
                onChange={(e) => setFormPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
            </div>
          </div>
        </section>

        {/* Owner Information */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Owner Information
          </h2>
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Owner Name *</label>
            <Input 
              placeholder="Owner full name" 
              className="h-12 rounded-2xl"
              value={formOwnerName}
              onChange={(e) => setFormOwnerName(e.target.value)}
            />
          </div>
        </section>

        {/* Save Button */}
        <Button 
          variant="bakery" 
          size="lg" 
          className="w-full"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </main>
    </div>
  );
}
