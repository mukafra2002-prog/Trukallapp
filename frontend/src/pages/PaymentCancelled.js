import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentCancelled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full" data-testid="payment-cancelled-card">
        <CardHeader className="text-center">
          <XCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges have been made.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <Button
            onClick={() => navigate('/driver')}
            className="w-full btn-primary"
            data-testid="return-dashboard-btn"
          >
            Return to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-2)}
            className="w-full"
            data-testid="try-again-btn"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
