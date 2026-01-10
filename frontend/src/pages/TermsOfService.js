import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfService() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Card>
          <CardHeader className="text-center border-b">
            <div className="flex items-center justify-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <CardTitle className="text-3xl">Terms of Service</CardTitle>
            </div>
            <p className="text-slate-600">Last updated: January 2026</p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none p-8">
            <h2 className="text-xl font-bold mt-6 mb-3">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using TrukAll ("Service"), you agree to be bound by these Terms of Service 
              ("Terms"). If you do not agree to these Terms, please do not use our Service.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">2. Description of Service</h2>
            <p className="mb-4">
              TrukAll provides a platform for commercial truck drivers to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Find and reserve truck parking spaces</li>
              <li>Access real-time parking availability</li>
              <li>Find loads and calculate trip profitability</li>
              <li>Connect with other drivers through convoy features</li>
              <li>Track compliance, expenses, and documentation</li>
              <li>Access emergency assistance features</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">3. User Accounts</h2>
            <p className="mb-2"><strong>Registration:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must be at least 18 years old to use the Service</li>
              <li>One person may not maintain multiple accounts</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">4. User Conduct</h2>
            <p className="mb-2">You agree NOT to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide false or misleading information</li>
              <li>Use the Service for any illegal purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Post false parking availability reports</li>
              <li>Misuse the emergency SOS feature</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">5. Parking Reservations</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Reservations are subject to availability and partner policies</li>
              <li>Cancellation policies vary by parking location</li>
              <li>We are not responsible for conditions at third-party parking facilities</li>
              <li>You must comply with all posted rules at parking locations</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">6. Payments and Subscriptions</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Payments are processed securely through Stripe</li>
              <li>Subscription fees are billed monthly in advance</li>
              <li>You may cancel your subscription at any time</li>
              <li>Refunds are subject to our refund policy</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">7. Load Board Disclaimer</h2>
            <p className="mb-4">
              TrukAll provides load information as a convenience. We do not:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Guarantee the accuracy of load information</li>
              <li>Verify the legitimacy of all brokers or shippers</li>
              <li>Act as a party to any transportation contract</li>
              <li>Assume liability for disputes between drivers and brokers</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">8. Emergency SOS Feature</h2>
            <p className="mb-4">
              The Emergency SOS feature is provided to assist drivers in emergencies. By using this feature:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You consent to sharing your location with emergency contacts</li>
              <li>You understand this is not a replacement for calling 911</li>
              <li>You agree not to misuse this feature for non-emergencies</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">9. Intellectual Property</h2>
            <p className="mb-4">
              All content, features, and functionality of the Service are owned by TrukAll and are 
              protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">10. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRUKALL SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO 
              LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">11. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify and hold harmless TrukAll and its officers, directors, employees, 
              and agents from any claims, damages, or expenses arising from your use of the Service 
              or violation of these Terms.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">12. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account at any time for violations of these Terms. 
              You may delete your account at any time through the app settings.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">13. Governing Law</h2>
            <p className="mb-4">
              These Terms shall be governed by the laws of the State of Texas, without regard to 
              its conflict of law provisions.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">14. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will provide notice of 
              significant changes through the app or by email. Continued use of the Service after 
              changes constitutes acceptance of the new Terms.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">15. Contact Information</h2>
            <p className="mb-4">
              For questions about these Terms, please contact us at:
            </p>
            <ul className="list-none mb-4">
              <li><strong>Email:</strong> legal@trukall.com</li>
              <li><strong>Address:</strong> TrukAll Inc., 123 Trucker Way, Dallas, TX 75001</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
