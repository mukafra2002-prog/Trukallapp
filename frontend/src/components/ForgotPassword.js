import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Mail, ArrowLeft, Check, Key } from "lucide-react";

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState("email"); // "email", "token", "success"
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const requestReset = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/forgot-password?email=${encodeURIComponent(email)}`);
      toast.success("Reset instructions sent! Check your email.");
      setStep("token");
      
      // In development, show the token (remove in production)
      if (response.data.debug_token) {
        console.log("Debug token:", response.data.debug_token);
        toast.info(`Dev mode: Token is ${response.data.debug_token}`);
      }
    } catch (error) {
      toast.error("Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!token.trim()) {
      toast.error("Please enter the reset token");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/auth/reset-password?token=${token}&new_password=${encodeURIComponent(newPassword)}`
      );
      toast.success("Password reset successfully!");
      setStep("success");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid or expired token");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Password Reset!</h3>
          <p className="text-slate-600 mb-6">Your password has been changed successfully.</p>
          <Button onClick={onBack} className="w-full bg-blue-600 hover:bg-blue-700">
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 hover:bg-slate-100 rounded">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <CardTitle>{step === "email" ? "Forgot Password" : "Reset Password"}</CardTitle>
            <CardDescription>
              {step === "email" 
                ? "Enter your email to receive a reset link" 
                : "Enter the token from your email"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "email" ? (
          <>
            <div>
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                />
              </div>
            </div>
            <Button 
              onClick={requestReset} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </>
        ) : (
          <>
            <div>
              <Label>Reset Token</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token from email"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button 
              onClick={resetPassword} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
            <p className="text-center">
              <button 
                onClick={() => setStep("email")}
                className="text-sm text-blue-600 hover:underline"
              >
                Didn't receive token? Try again
              </button>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
