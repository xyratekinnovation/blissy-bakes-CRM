import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Key, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { staffApi } from "@/api/staff";

export default function Security() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  
  // Get current user from localStorage
  const [user, setUser] = useState<any>(null);
  
  // Form state
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  useEffect(() => {
    // Load user data
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
    }
  }, []);

  const handleChangePin = async () => {
    if (!currentPin || !newPin || !confirmPin) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin) || !/^\d{4}$/.test(confirmPin)) {
      toast({
        title: "Error",
        description: "PIN must be 4 digits",
        variant: "destructive"
      });
      return;
    }

    // Check if new PIN matches confirmation
    if (newPin !== confirmPin) {
      toast({
        title: "Error",
        description: "New PIN and confirmation do not match",
        variant: "destructive"
      });
      return;
    }

    // Check if new PIN is different from current
    if (currentPin === newPin) {
      toast({
        title: "Error",
        description: "New PIN must be different from current PIN",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsChangingPin(true);
      
      // Get phone number from user object
      const phoneNumber = user.phoneNumber || user.phone;
      
      if (!phoneNumber) {
        toast({
          title: "Error",
          description: "Phone number not found. Please contact administrator.",
          variant: "destructive"
        });
        return;
      }

      // Verify current PIN by attempting login
      const loginResponse = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          pin: currentPin
        })
      });

      if (!loginResponse.ok) {
        toast({
          title: "Error",
          description: "Current PIN is incorrect",
          variant: "destructive"
        });
        return;
      }

      // Update PIN using staff API
      if (user.id) {
        await staffApi.updateStaff(user.id, {
          pin: newPin
        });
        
        toast({
          title: "Success",
          description: "PIN changed successfully. Please login again with your new PIN."
        });
        
        // Clear form
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        
        // Optionally logout user
        setTimeout(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          navigate("/");
        }, 2000);
      } else {
        throw new Error("User ID not found");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change PIN",
        variant: "destructive"
      });
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleRequestOTP = () => {
    // Placeholder for OTP functionality
    toast({
      title: "Coming Soon",
      description: "OTP-based PIN change will be available soon. Please use the manual PIN change option.",
    });
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
          <h1 className="font-playfair text-xl font-bold text-foreground">Security</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Current User Info */}
        {user && (
          <section className="bakery-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-lavender-soft flex items-center justify-center">
                <Shield className="w-6 h-6 text-lavender-deep" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{user.fullName || "User"}</p>
                <p className="text-sm text-muted-foreground">{user.phoneNumber || "No phone"}</p>
                <p className="text-xs text-muted-foreground mt-1">Role: {user.role || "employee"}</p>
              </div>
            </div>
          </section>
        )}

        {/* Change PIN Section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Change PIN
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                <Key className="w-4 h-4" />
                Current PIN *
              </label>
              <div className="relative">
                <Input 
                  type={showCurrentPin ? "text" : "password"}
                  placeholder="Enter current 4-digit PIN" 
                  className="h-12 rounded-2xl pr-12"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                <Lock className="w-4 h-4" />
                New PIN *
              </label>
              <div className="relative">
                <Input 
                  type={showNewPin ? "text" : "password"}
                  placeholder="Enter new 4-digit PIN" 
                  className="h-12 rounded-2xl pr-12"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirm New PIN *
              </label>
              <div className="relative">
                <Input 
                  type={showConfirmPin ? "text" : "password"}
                  placeholder="Confirm new 4-digit PIN" 
                  className="h-12 rounded-2xl pr-12"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button 
              variant="bakery" 
              size="lg" 
              className="w-full"
              onClick={handleChangePin}
              disabled={isChangingPin}
            >
              {isChangingPin ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing PIN...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Change PIN
                </>
              )}
            </Button>
          </div>
        </section>

        {/* OTP Option */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Alternative: Change via OTP
          </h2>
          <div className="bakery-card p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Forgot your PIN? Request an OTP to your registered phone number to reset it.
            </p>
            <Button 
              variant="soft" 
              size="lg" 
              className="w-full"
              onClick={handleRequestOTP}
            >
              Request OTP
            </Button>
          </div>
        </section>

        {/* Security Tips */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Security Tips
          </h2>
          <div className="space-y-2">
            <div className="bakery-card p-3">
              <p className="text-sm text-foreground">🔒 Use a unique 4-digit PIN</p>
            </div>
            <div className="bakery-card p-3">
              <p className="text-sm text-foreground">🔐 Don't share your PIN with anyone</p>
            </div>
            <div className="bakery-card p-3">
              <p className="text-sm text-foreground">🛡️ Change your PIN regularly</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
