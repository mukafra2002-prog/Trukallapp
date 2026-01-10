import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle } from "lucide-react";

export default function Contact() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "general",
    message: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    
    // Create mailto link with form data
    const mailtoSubject = encodeURIComponent(`[TrukAll ${formData.subject}] from ${formData.name}`);
    const mailtoBody = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`
    );
    
    // Open email client
    window.location.href = `mailto:support@yourdomain.com?subject=${mailtoSubject}&body=${mailtoBody}`;
    
    setLoading(false);
    setSubmitted(true);
    toast.success("Opening your email client...");
  };

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6 text-blue-600" />,
      title: "Email Support",
      value: "support@yourdomain.com",
      description: "We respond within 24 hours",
      action: () => window.location.href = "mailto:support@yourdomain.com"
    },
    {
      icon: <Phone className="w-6 h-6 text-green-600" />,
      title: "Phone Support",
      value: "1-800-TRUKALL",
      description: "Mon-Fri, 8am-6pm CST",
      action: () => window.location.href = "tel:1-800-878-5255"
    },
    {
      icon: <MapPin className="w-6 h-6 text-red-600" />,
      title: "Headquarters",
      value: "Dallas, TX",
      description: "123 Trucker Way, 75001",
      action: null
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-slate-900 mb-4">Contact Us</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Have questions or need help? We're here for you 24/7. Reach out and our team will get back to you as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="space-y-4">
            {contactInfo.map((info, index) => (
              <Card 
                key={index} 
                className={`${info.action ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                onClick={info.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-100 rounded-lg">
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{info.title}</h3>
                      <p className="text-blue-600 font-medium">{info.value}</p>
                      <p className="text-sm text-slate-500">{info.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Response Time */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold">Average Response Time</h3>
                </div>
                <p className="text-3xl font-black text-blue-600">Under 24 hours</p>
                <p className="text-sm text-slate-600 mt-1">For all support inquiries</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  Send Us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you shortly
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-700 mb-2">Email Client Opened!</h3>
                    <p className="text-slate-600 mb-6">
                      Please send the email from your email client. We'll respond within 24 hours.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Your Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Driver"
                          required
                          data-testid="contact-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Your Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@example.com"
                          required
                          data-testid="contact-email"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <select
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        data-testid="contact-subject"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="billing">Billing Question</option>
                        <option value="partnership">Partnership Opportunity</option>
                        <option value="feedback">Feedback / Suggestion</option>
                        <option value="bug">Report a Bug</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="How can we help you?"
                        rows={6}
                        required
                        className="bg-white border-slate-300"
                        data-testid="contact-message"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                      data-testid="contact-submit"
                    >
                      {loading ? (
                        "Opening Email..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-slate-500 text-center">
                      By submitting this form, you agree to our{' '}
                      <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "How do I reset my password?",
                a: "Click 'Forgot Password' on the login screen and enter your email. You'll receive a reset code."
              },
              {
                q: "How do I cancel my subscription?",
                a: "Go to Plans tab in your dashboard and click 'Manage Subscription' to cancel anytime."
              },
              {
                q: "Is my data secure?",
                a: "Yes! We use industry-standard encryption and never sell your personal information."
              },
              {
                q: "How does the Emergency SOS work?",
                a: "Press the SOS button to instantly alert your emergency contacts with your location."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-2">{faq.q}</h3>
                  <p className="text-slate-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
