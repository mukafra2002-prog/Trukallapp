import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MessageCircle, Send, Facebook, FileText, MapPin, Phone, Mail, Globe } from "lucide-react";

export default function SocialLinks() {
  const socialLinks = [
    {
      name: "Facebook Group",
      description: "Connect with fellow drivers",
      icon: Facebook,
      color: "bg-blue-700 hover:bg-blue-800",
      url: "https://facebook.com/groups/trukall", // Replace with actual
      badge: "Join Free"
    },
    {
      name: "Google My Business",
      description: "See reviews & location",
      icon: MapPin,
      color: "bg-red-500 hover:bg-red-600",
      url: "https://g.page/trukall", // Replace with actual
      badge: "4.8 Rating"
    },
    {
      name: "Documentation",
      description: "Help center & guides",
      icon: FileText,
      color: "bg-slate-700 hover:bg-slate-800",
      url: "https://trukall.notion.site", // Replace with actual
      badge: "Notion"
    }
  ];

  const contactInfo = [
    { icon: Mail, label: "support@trukall.app", type: "email" },
    { icon: Phone, label: "1-800-TRUKALL", type: "phone" },
    { icon: Globe, label: "www.trukall.app", type: "website" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-600" />
          Connect With Us
        </h3>
        <p className="text-slate-600">Join our community across platforms</p>
      </div>

      {/* Social Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {socialLinks.map((link) => (
          <Card 
            key={link.name}
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => window.open(link.url, '_blank')}
          >
            <CardContent className="p-0">
              <div className={`${link.color} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <link.icon className="w-8 h-8" />
                  <Badge className="bg-white/20 text-white border-0">
                    {link.badge}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-slate-800">{link.name}</h4>
                <p className="text-sm text-slate-600">{link.description}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 p-0 h-auto text-blue-600"
                >
                  Open <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
          <CardDescription>Get in touch with our support team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactInfo.map((info, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <info.icon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">{info.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-blue-800">TrukAll v2.0</h4>
              <p className="text-sm text-blue-600">Your complete trucking companion</p>
            </div>
            <div className="text-right">
              <Badge className="bg-green-500">PWA Ready</Badge>
              <p className="text-xs text-slate-500 mt-1">Install on any device</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
