import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Truck, Shield, MapPin, DollarSign, Clock, Fuel, Bell, TrendingUp, Award } from "lucide-react";

export default function LandingPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    name: "",
    role: "driver",
    phone: ""
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      login(response.data.user);
      toast.success("Welcome back!");
      navigate(`/${response.data.user.role}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, signupData);
      login(response.data);
      toast.success("Account created successfully!");
      navigate(`/${response.data.role}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero-section min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Truck className="w-16 h-16 text-primary" />
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
                TrukAll
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Complete Truck Driver Solution • Safe Parking • Real-Time Alerts • Rewards
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="glassmorphism border-white/10 card-hover" data-testid="feature-realtime">
              <CardHeader>
                <MapPin className="w-10 h-10 text-primary mb-2" />
                <CardTitle className="text-xl">Smart Parking Finder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Real-time + predictive parking with hidden spot discovery</p>
              </CardContent>
            </Card>

            <Card className="glassmorphism border-white/10 card-hover" data-testid="feature-alerts">
              <CardHeader>
                <Bell className="w-10 h-10 text-primary mb-2" />
                <CardTitle className="text-xl">Safety Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Wake-up alerts, fatigue monitoring, unsafe zone warnings</p>
              </CardContent>
            </Card>

            <Card className="glassmorphism border-white/10 card-hover" data-testid="feature-rewards">
              <CardHeader>
                <Award className="w-10 h-10 text-secondary mb-2" />
                <CardTitle className="text-xl">Community Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Earn points, get rewards, join the driver community</p>
              </CardContent>
            </Card>
          </div>

          {/* Auth Card */}
          <Card className="glassmorphism border-white/10 max-w-md mx-auto" data-testid="auth-card">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Get Started</CardTitle>
              <CardDescription className="text-center">Join thousands of drivers solving daily problems</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                  <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        data-testid="login-email"
                        type="email"
                        placeholder="driver@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                        className="touch-target"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        data-testid="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        className="touch-target"
                      />
                    </div>
                    <Button type="submit" className="w-full btn-primary" disabled={loading} data-testid="login-submit">
                      {loading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        data-testid="signup-name"
                        type="text"
                        placeholder="John Smith"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        required
                        className="touch-target"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        data-testid="signup-email"
                        type="email"
                        placeholder="driver@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                        className="touch-target"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-phone">Phone (Optional)</Label>
                      <Input
                        id="signup-phone"
                        data-testid="signup-phone"
                        type="tel"
                        placeholder="555-123-4567"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        className="touch-target"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        data-testid="signup-password"
                        type="password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        className="touch-target"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-role">I am a</Label>
                      <select
                        id="signup-role"
                        data-testid="signup-role"
                        value={signupData.role}
                        onChange={(e) => setSignupData({ ...signupData, role: e.target.value })}
                        className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="driver">Truck Driver</option>
                        <option value="partner">Parking Lot Owner</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full btn-primary" disabled={loading} data-testid="signup-submit">
                      {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">Solving 10 critical truck driver problems</p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium">Predictive Parking</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Safety Alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium">Rewards System</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
