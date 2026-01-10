import { useEffect, useState, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    const activateSubscription = async () => {
      const sessionId = searchParams.get("session_id");
      const planId = searchParams.get("plan_id");
      const userEmail = searchParams.get("user_email") || user?.email;

      if (!sessionId || !planId || !userEmail) {
        setStatus("error");
        return;
      }

      try {
        const response = await axios.post(
          `${API}/subscriptions/activate?plan_id=${planId}&user_email=${userEmail}&session_id=${sessionId}`
        );
        setPlanName(response.data.plan_name || planId);
        setStatus("success");
      } catch (error) {
        console.error("Activation error:", error);
        setStatus("error");
      }
    };

    activateSubscription();
  }, [searchParams, user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        {status === "loading" && (
          <>
            <CardHeader className="text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
              <CardTitle className="text-2xl">Processing Your Subscription</CardTitle>
              <CardDescription>Please wait while we activate your plan...</CardDescription>
            </CardHeader>
          </>
        )}

        {status === "success" && (
          <>
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <CardTitle className="text-2xl text-green-700">Subscription Activated!</CardTitle>
              <CardDescription>
                Welcome to <strong>{planName}</strong>! Your account has been upgraded.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-slate-600">
                You now have access to all premium features. Start exploring your new benefits!
              </p>
              <Button 
                onClick={() => navigate("/driver")} 
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="go-to-dashboard"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </>
        )}

        {status === "error" && (
          <>
            <CardHeader className="text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <CardTitle className="text-2xl text-red-700">Something Went Wrong</CardTitle>
              <CardDescription>
                We couldn't activate your subscription. Please try again or contact support.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Button 
                onClick={() => navigate("/driver")} 
                variant="outline"
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
