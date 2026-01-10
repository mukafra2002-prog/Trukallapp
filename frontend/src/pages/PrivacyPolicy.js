import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
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
              <Shield className="w-8 h-8 text-blue-600" />
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            </div>
            <p className="text-slate-600">Last updated: January 2026</p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none p-8">
            <h2 className="text-xl font-bold mt-6 mb-3">1. Introduction</h2>
            <p className="mb-4">
              Welcome to TrukAll ("we," "our," or "us"). We are committed to protecting your personal information 
              and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you use our mobile application and website (collectively, the "Service").
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">2. Information We Collect</h2>
            <p className="mb-2"><strong>Personal Information:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li>Name, email address, and phone number</li>
              <li>Commercial Driver's License (CDL) information</li>
              <li>Payment and billing information</li>
              <li>Profile information and preferences</li>
            </ul>
            
            <p className="mb-2"><strong>Location Information:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li>GPS location data when you use our parking finder or share location features</li>
              <li>Location history for trip planning and route optimization</li>
            </ul>
            
            <p className="mb-2"><strong>Usage Information:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li>App usage patterns and feature interactions</li>
              <li>Search history and booking records</li>
              <li>Device information and IP address</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide and maintain our Service</li>
              <li>Process parking reservations and payments</li>
              <li>Send you important updates and notifications</li>
              <li>Improve our Service and develop new features</li>
              <li>Ensure safety through emergency SOS features</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">4. Information Sharing</h2>
            <p className="mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Parking Partners:</strong> To facilitate reservations</li>
              <li><strong>Payment Processors:</strong> To process transactions securely</li>
              <li><strong>Emergency Services:</strong> When you use the SOS feature</li>
              <li><strong>Legal Authorities:</strong> When required by law</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">5. Data Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures including encryption, secure servers, 
              and regular security audits. However, no method of transmission over the Internet is 
              100% secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">6. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">7. Data Retention</h2>
            <p className="mb-4">
              We retain your information for as long as your account is active or as needed to provide 
              services. We may retain certain information for legal compliance, dispute resolution, 
              and enforcement of our agreements.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">8. Children's Privacy</h2>
            <p className="mb-4">
              Our Service is not intended for users under 18 years of age. We do not knowingly collect 
              information from children under 18.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">9. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">10. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <ul className="list-none mb-4">
              <li><strong>Email:</strong> support@yourdomain.com</li>
              <li><strong>Address:</strong> TrukAll Inc., 123 Trucker Way, Dallas, TX 75001</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
