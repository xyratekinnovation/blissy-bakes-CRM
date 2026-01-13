import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "@/components/Sparkles";
import { Cake, Phone, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-config";

export default function Login() {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<"otp" | "pin">("otp");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"phone" | "verify">("phone");

  const handleSendOTP = () => {
    if (phone.length >= 10) {
      setStep("verify");
    }
  };

  const handleVerify = () => {
    navigate("/home");
  };

  const handlePinLogin = async () => {
    if (pin.length >= 4 && phone.length >= 10) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone, pin: pin })
        });

        if (response.ok) {
          const data = await response.json();
          // Store token
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate("/home");
        } else {
          const errorData = await response.json().catch(() => ({ detail: 'Invalid credentials' }));
          alert(errorData.detail || "Invalid Login! Please check your phone number and PIN.");
        }
      } catch (e) {
        console.error("Login error:", e);
        alert(`Connection error! Please make sure the backend server is running on ${API_BASE_URL}`);
      }
    }
  };

  return (
    <div className="min-h-screen gradient-hero relative overflow-hidden flex flex-col">
      <Sparkles count={30} />

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-lavender-medium/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-medium/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        {/* Logo Section */}
        <div className="animate-bounce-soft mb-8">
          <div className="relative">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-pink-soft via-lavender-soft to-gold-soft shadow-glow flex items-center justify-center overflow-hidden border-2 border-gold-sparkle/40 ring-2 ring-gold-sparkle/20">
              <img 
                src="/icon-192x192.png" 
                alt="Blissyy Bakes Logo" 
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  // Fallback to Cake icon if logo not found
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-soft to-lavender-soft" style={{ display: 'none' }}>
                <Cake className="w-14 h-14 text-pink-deep" />
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold-sparkle animate-sparkle" />
          </div>
        </div>

        {/* Brand */}
        <h1 className="font-playfair text-4xl font-bold text-gradient mb-2">
          THE BLISSY BAKES
        </h1>
        <p className="text-muted-foreground text-lg mb-10 font-medium">
          Sweet Sales. Made Simple.
        </p>

        {/* Login Card */}
        <div className="w-full max-w-sm glass-card rounded-3xl p-6 shadow-card animate-slide-up">
          {/* Login Method Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-2xl">
            <button
              onClick={() => setLoginMethod("otp")}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300",
                loginMethod === "otp"
                  ? "bg-card shadow-soft text-primary"
                  : "text-muted-foreground"
              )}
            >
              Mobile OTP
            </button>
            <button
              onClick={() => setLoginMethod("pin")}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300",
                loginMethod === "pin"
                  ? "bg-card shadow-soft text-primary"
                  : "text-muted-foreground"
              )}
            >
              Staff PIN
            </button>
          </div>

          {loginMethod === "otp" ? (
            <div className="space-y-4">
              {step === "phone" ? (
                <>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-12 h-14 rounded-2xl border-2 border-border focus:border-primary bg-card text-lg"
                    />
                  </div>
                  <Button
                    onClick={handleSendOTP}
                    variant="bakery"
                    size="lg"
                    className="w-full"
                    disabled={phone.length < 10}
                  >
                    Send OTP
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-center text-muted-foreground text-sm mb-2">
                    Enter the OTP sent to {phone}
                  </p>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="h-14 rounded-2xl border-2 border-border focus:border-primary bg-card text-lg text-center tracking-widest"
                  />
                  <Button
                    onClick={handleVerify}
                    variant="bakery"
                    size="lg"
                    className="w-full"
                    disabled={otp.length < 6}
                  >
                    Verify & Login
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <button
                    onClick={() => setStep("phone")}
                    className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Change number
                  </button>
                </>
              )}
            </div>
          ) : (

            <div className="space-y-4">
              {/* Phone Input for PIN Mode too */}
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-2 border-border focus:border-primary bg-card text-lg"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className="pl-12 h-14 rounded-2xl border-2 border-border focus:border-primary bg-card text-lg text-center tracking-widest"
                />
              </div>
              <Button
                onClick={handlePinLogin}
                variant="bakery"
                size="lg"
                className="w-full"
                disabled={pin.length < 4 || phone.length < 10}
              >
                Login with PIN
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-muted-foreground">
          Powered by XYRATEK INNOVATION
        </p>
      </div>
    </div >
  );
}
