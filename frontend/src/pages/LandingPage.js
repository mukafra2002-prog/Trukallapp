import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Truck, Shield, MapPin, DollarSign, Clock, Fuel, Bell, TrendingUp, Award, Users, CheckCircle, Star, Zap, Target } from "lucide-react";

export default function LandingPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    name: "",
    role: "driver",
    phone: ""
  });
  
  // Password reset states
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState(1); // 1 = enter email, 2 = enter code + new password

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { email: resetEmail });
      toast.success("Reset code sent! Check your email.");
      // For testing, show the code (remove in production)
      if (response.data.reset_code) {
        toast.info(`Test mode - Your reset code: ${response.data.reset_code}`);
      }
      setResetStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, {
        email: resetEmail,
        reset_code: resetCode,
        new_password: newPassword
      });
      toast.success("Password reset successfully! Please login.");
      setIsForgotPassword(false);
      setResetStep(1);
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setIsLogin(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="hero-section relative">
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="w-7 h-7 text-blue-600" />
              </div>
              <span className="text-3xl font-black text-white">TrukAll</span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => { setIsLogin(true); setShowAuthModal(true); }}
                data-testid="login-nav-btn"
              >
                Login
              </Button>
              <Button 
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold"
                onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
                data-testid="signup-nav-btn"
              >
                Sign Up Free
              </Button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-white font-semibold text-sm">Trusted by 10,000+ Truck Drivers</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Never Drive to a <span className="text-yellow-300">Full Lot</span> Again
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Find safe parking in seconds, earn money with load board, track expenses, and join convoys. Everything a truck driver needs in one powerful app.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button 
                size="lg"
                className="btn-primary text-xl px-12 py-7 shadow-2xl"
                onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
                data-testid="hero-cta-btn"
              >
                <Target className="w-6 h-6 mr-2" />
                Start Free Today
              </Button>
              <Button 
                size="lg"
                className="btn-secondary text-xl px-8 py-7"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>100% Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Works on iPhone & Android</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="stat-number mb-2">10,000+</div>
              <div className="text-gray-600 font-semibold">Active Drivers</div>
            </div>
            <div>
              <div className="stat-number mb-2">$4,600</div>
              <div className="text-gray-600 font-semibold">Saved Per Year</div>
            </div>
            <div>
              <div className="stat-number mb-2">24/7</div>
              <div className="text-gray-600 font-semibold">Real-Time Updates</div>
            </div>
            <div>
              <div className="stat-number mb-2">5★</div>
              <div className="text-gray-600 font-semibold">Driver Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Problems Section */}
      <div className="section-light" id="features">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              We Solve <span className="gradient-text">Every Pain Point</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stop losing money, time, and sleep. TrukAll solves all 10 major problems truck drivers face daily.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="feature-card p-6">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <MapPin className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Reserve Parking 24hrs Ahead</h3>
              <p className="text-gray-600">Never drive to a full lot again. Book your spot before you leave.</p>
              <div className="mt-4 text-sm font-semibold text-blue-600">→ Save $4,600/year</div>
            </div>

            <div className="feature-card p-6">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <DollarSign className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Load Board + Profit Calculator</h3>
              <p className="text-gray-600">Find paying loads and know if they're profitable before you accept.</p>
              <div className="mt-4 text-sm font-semibold text-green-600">→ Earn more per mile</div>
            </div>

            <div className="feature-card p-6">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Convoy Finder + Live Chat</h3>
              <p className="text-gray-600">Find drivers on your route. Travel together for safety and company.</p>
              <div className="mt-4 text-sm font-semibold text-purple-600">→ Safer long hauls</div>
            </div>

            <div className="feature-card p-6">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Emergency SOS + GPS</h3>
              <p className="text-gray-600">One-tap emergency button sends your location to help instantly.</p>
              <div className="mt-4 text-sm font-semibold text-red-600">→ Life-saving feature</div>
            </div>

            <div className="feature-card p-6">
              <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4">
                <Star className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Verified Driver Reviews</h3>
              <p className="text-gray-600">Real reviews from real drivers. Know what's good before you go.</p>
              <div className="mt-4 text-sm font-semibold text-yellow-600">→ Community-powered trust</div>
            </div>

            <div className="feature-card p-6">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                <Award className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Rewards & Points System</h3>
              <p className="text-gray-600">Earn points for bookings, reviews, and safe driving. Redeem for rewards.</p>
              <div className="mt-4 text-sm font-semibold text-orange-600">→ Get paid to use it</div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 mb-6">Plus: Expense Tracker • Detention Pay • DOT Compliance • HOS Tracker • Weather Alerts • Fuel Prices</p>
            <Button 
              size="lg"
              className="btn-primary text-xl px-12"
              onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
              data-testid="features-cta-btn"
            >
              Get All Features Free →
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Everything You Need <span className="gradient-text">In One App</span>
            </h2>
            <p className="text-xl text-gray-600">Built by drivers, for drivers. 17+ powerful features.</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border-2 border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-semibold">🟢 LIVE Parking Updates</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-semibold">Reserve Parking Ahead</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-semibold">Broker Fraud Alerts</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-semibold">Shower Credits Tracker</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-semibold">Trip Profit Calculator</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-semibold">Convoy Finder</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-semibold">Retail Parking (Walmart+)</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-semibold">DOT Compliance Tracker</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-semibold">Fatigue Monitor</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-semibold">Works Offline</span>
                  </div>
                </div>
              </div>
              <div className="text-center mt-8">
                <p className="text-lg font-bold text-gray-700 mb-2">+ Rewards, Load Board, Expense Tracker & More!</p>
                <p className="text-gray-600">All included. Start free today.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Join 10,000+ Drivers Saving Money & Time
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Start finding safe parking, earning more per mile, and traveling safer today. No credit card required.
          </p>
          <Button 
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 text-2xl px-16 py-8 rounded-2xl shadow-2xl font-black"
            onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
            data-testid="final-cta-btn"
          >
            Start Free Now →
          </Button>
          <p className="text-white/80 mt-6 text-sm">Works on iPhone, Android, iPad, and Desktop</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Truck className="w-8 h-8" />
            <span className="text-2xl font-black">TrukAll</span>
          </div>
          <p className="text-gray-400 mb-4">The Complete Truck Driver Solution</p>
          <p className="text-gray-500 text-sm">© 2024 TrukAll. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAuthModal(false)}>
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()} data-testid="auth-modal">
            <CardHeader>
              <CardTitle className="text-2xl">
                {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Free Account'}
              </CardTitle>
              <CardDescription>
                {isForgotPassword ? 'We\'ll help you recover your account' : isLogin ? 'Login to your TrukAll account' : 'Join 10,000+ drivers today'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isForgotPassword ? (
                /* Forgot Password Form */
                <div className="space-y-4">
                  {resetStep === 1 ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold">Reset Your Password</h3>
                        <p className="text-sm text-gray-500">Enter your email to receive a reset code</p>
                      </div>
                      <div>
                        <Label htmlFor="reset-email">Email Address</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          className="h-12"
                          placeholder="your@email.com"
                          data-testid="reset-email-input"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12" disabled={loading} data-testid="send-reset-code-btn">
                        {loading ? 'Sending...' : 'Send Reset Code'}
                      </Button>
                      <p className="text-center text-sm text-gray-600">
                        Remember your password?{' '}
                        <button type="button" className="text-blue-600 font-semibold" onClick={() => { setIsForgotPassword(false); setResetStep(1); }}>
                          Back to Login
                        </button>
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold">Enter Reset Code</h3>
                        <p className="text-sm text-gray-500">We sent a 6-digit code to {resetEmail}</p>
                      </div>
                      <div>
                        <Label htmlFor="reset-code">Reset Code</Label>
                        <Input
                          id="reset-code"
                          type="text"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          required
                          className="h-12 text-center text-2xl tracking-widest"
                          placeholder="000000"
                          maxLength={6}
                          data-testid="reset-code-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="h-12"
                          placeholder="Enter new password"
                          minLength={6}
                          data-testid="new-password-input"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12" disabled={loading} data-testid="reset-password-btn">
                        {loading ? 'Resetting...' : 'Reset Password'}
                      </Button>
                      <p className="text-center text-sm text-gray-600">
                        <button type="button" className="text-blue-600 font-semibold" onClick={() => setResetStep(1)}>
                          Try different email
                        </button>
                      </p>
                    </form>
                  )}
                </div>
              ) : isLogin ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="h-12"
                      data-testid="modal-login-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="h-12"
                      data-testid="modal-login-password"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => setIsForgotPassword(true)} data-testid="forgot-password-link">
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12" disabled={loading} data-testid="modal-login-submit">
                    {loading ? 'Logging in...' : 'LOGIN'}
                  </Button>
                  <p className="text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button type="button" className="text-blue-600 font-semibold" onClick={() => setIsLogin(false)}>
                      Sign up free
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      required
                      className="h-12"
                      data-testid="modal-signup-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                      className="h-12"
                      data-testid="modal-signup-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                      className="h-12"
                      data-testid="modal-signup-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-role">I am a</Label>
                    <select
                      id="signup-role"
                      value={signupData.role}
                      onChange={(e) => setSignupData({ ...signupData, role: e.target.value })}
                      className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      data-testid="modal-signup-role"
                    >
                      <option value="driver">Truck Driver</option>
                      <option value="partner">Parking Lot Owner</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full btn-primary" disabled={loading} data-testid="modal-signup-submit">
                    {loading ? 'Creating Account...' : 'Create Free Account'}
                  </Button>
                  <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <button type="button" className="text-blue-600 font-semibold" onClick={() => setIsLogin(true)}>
                      Login
                    </button>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
