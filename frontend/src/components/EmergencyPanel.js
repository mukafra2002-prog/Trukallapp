import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDeviceFeatures } from "@/hooks/useDeviceFeatures";
import { API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { AlertTriangle, MapPin, Phone, Camera, FileText } from "lucide-react";

export default function EmergencyPanel({ user }) {
  const [showSOSDialog, setShowSOSDialog] = useState(false);
  const [showDocScanner, setShowDocScanner] = useState(false);
  const [sosData, setSosData] = useState({
    emergency_type: "breakdown",
    description: ""
  });
  const [capturedDoc, setCapturedDoc] = useState(null);
  
  const { 
    getCurrentLocation, 
    pickFile, 
    vibrate, 
    showNotification,
    isOnline 
  } = useDeviceFeatures();

  const handleEmergencySOS = async () => {
    try {
      vibrate([200, 100, 200, 100, 200]); // Emergency vibration pattern
      
      toast.loading('Getting your location...');
      const location = await getCurrentLocation();
      
      const response = await axios.post(
        `${API}/emergency/sos?driver_email=${user.email}`,
        {
          ...sosData,
          latitude: location.latitude,
          longitude: location.longitude
        }
      );

      vibrate([400]);
      showNotification('🚨 Emergency SOS Sent', {
        body: 'Help is on the way. Stay safe!',
        requireInteraction: true
      });
      
      toast.success('Emergency SOS sent! Help is on the way.');
      setShowSOSDialog(false);
      setSosData({ emergency_type: "breakdown", description: "" });
    } catch (error) {
      toast.error('Failed to send SOS. Try calling 911 directly.');
      console.error(error);
    }
  };

  const handleDocumentScan = async () => {
    try {
      const doc = await pickFile();
      if (doc) {
        setCapturedDoc(doc);
        toast.success(`Document captured: ${doc.name}`);
        // In real app, upload to server
        console.log('Document captured:', doc);
      }
    } catch (error) {
      toast.error('Failed to capture document');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Emergency SOS Button */}
      <Dialog open={showSOSDialog} onOpenChange={setShowSOSDialog}>
        <DialogTrigger asChild>
          <Card 
            className="bg-destructive/10 border-destructive/50 cursor-pointer hover:bg-destructive/20 transition-all" 
            data-testid="emergency-sos-card"
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-destructive">EMERGENCY SOS</h3>
                  <p className="text-sm text-muted-foreground">Tap for immediate help</p>
                </div>
              </div>
              <Phone className="w-6 h-6 text-destructive" />
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="border-destructive/50" data-testid="sos-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl text-destructive flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Emergency SOS
            </DialogTitle>
            <DialogDescription>
              Your location will be sent to emergency services and your fleet manager
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="emergency-type">Emergency Type</Label>
              <select
                id="emergency-type"
                value={sosData.emergency_type}
                onChange={(e) => setSosData({ ...sosData, emergency_type: e.target.value })}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="emergency-type-select"
              >
                <option value="breakdown">Vehicle Breakdown</option>
                <option value="accident">Accident</option>
                <option value="medical">Medical Emergency</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="sos-description">Describe the situation</Label>
              <Textarea
                id="sos-description"
                value={sosData.description}
                onChange={(e) => setSosData({ ...sosData, description: e.target.value })}
                placeholder="e.g., Engine overheating, need tow truck"
                rows={4}
                required
                data-testid="sos-description"
              />
            </div>
            {!isOnline && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ You are offline. SOS will be sent when connection is restored.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button 
                onClick={handleEmergencySOS}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white h-14 text-lg font-bold"
                disabled={!sosData.description}
                data-testid="send-sos-btn"
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                SEND SOS NOW
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSOSDialog(false)}
                className="h-14"
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              For life-threatening emergencies, call 911 immediately
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Scanner */}
      <Card 
        className="bg-accent/50 border-primary/30 cursor-pointer hover:bg-accent transition-all" 
        onClick={handleDocumentScan}
        data-testid="doc-scanner-card"
      >
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Document Scanner</h3>
              <p className="text-sm text-muted-foreground">Scan BOL, receipts, permits</p>
            </div>
          </div>
          <FileText className="w-6 h-6 text-primary" />
        </CardContent>
      </Card>

      {capturedDoc && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-sm">Last Scanned Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{capturedDoc.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(capturedDoc.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
