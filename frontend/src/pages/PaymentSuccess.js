import { useEffect, useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState("checking");
  const [paymentData, setPaymentData] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/driver');
      return;
    }

    checkPaymentStatus();
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    let attempts = 0;
    const maxAttempts = 5;
    const pollInterval = 2000;

    const poll = async () => {
      try {
        const response = await axios.get(`${API}/payments/status/${sessionId}`);
        setPaymentData(response.data);

        if (response.data.payment_status === 'paid') {
          setStatus('success');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          setStatus('timeout');
        }
      } catch (error) {
        console.error('Payment status check failed:', error);
        setStatus('error');
      }
    };

    poll();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full" data-testid="payment-status-card">
        <CardHeader className="text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <CardTitle className="text-2xl">Processing Payment...</CardTitle>
              <CardDescription>Please wait while we confirm your payment</CardDescription>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 text-secondary mx-auto mb-4" />
              <CardTitle className="text-2xl text-secondary">Payment Successful!</CardTitle>
              <CardDescription>Your parking spot has been reserved</CardDescription>
            </>
          )}
          {status === 'timeout' && (
            <>
              <CardTitle className="text-2xl">Payment Processing</CardTitle>
              <CardDescription>Your payment is still being processed. Please check your bookings shortly.</CardDescription>
            </>
          )}
          {status === 'error' && (
            <>
              <CardTitle className="text-2xl text-destructive">Error</CardTitle>
              <CardDescription>There was an issue checking your payment status</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center">
          {paymentData && status === 'success' && (
            <div className="mb-6 text-left bg-accent p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Amount Paid</p>
                  <p className="font-bold text-2xl mono text-primary">
                    ${(paymentData.amount_total / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-bold text-secondary uppercase">{paymentData.payment_status}</p>
                </div>
              </div>
            </div>
          )}
          <Button
            onClick={() => navigate('/driver')}
            className="w-full btn-primary"
            data-testid="return-dashboard-btn"
          >
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
