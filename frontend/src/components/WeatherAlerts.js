import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { CloudRain, AlertTriangle, Wind, Snowflake, CloudLightning, MapPin, Clock, Plus, ThermometerSun } from "lucide-react";

export default function WeatherAlerts() {
  const { user } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [newAlert, setNewAlert] = useState({
    alert_type: "severe_weather",
    severity: "medium",
    title: "",
    description: "",
    location: "",
    expires_hours: 24
  });

  useEffect(() => {
    fetchAlerts();
    // Refresh alerts every 2 minutes
    const interval = setInterval(fetchAlerts, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/weather/alerts`);
      setAlerts(response.data);
    } catch (error) {
      console.error("Failed to load weather alerts");
    } finally {
      setLoading(false);
    }
  };

  const reportAlert = async () => {
    if (!newAlert.title || !newAlert.location) {
      toast.error("Please fill in title and location");
      return;
    }

    try {
      await axios.post(`${API}/weather/alerts?driver_email=${user?.email}`, newAlert);
      toast.success("Weather alert reported! Thanks for keeping fellow drivers safe.");
      setShowReportDialog(false);
      setNewAlert({
        alert_type: "severe_weather",
        severity: "medium",
        title: "",
        description: "",
        location: "",
        expires_hours: 24
      });
      fetchAlerts();
    } catch (error) {
      toast.error("Failed to report alert");
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "ice_warning": return <Snowflake className="w-5 h-5" />;
      case "high_winds": return <Wind className="w-5 h-5" />;
      case "flood": return <CloudRain className="w-5 h-5" />;
      case "severe_weather": return <CloudLightning className="w-5 h-5" />;
      case "road_hazard": return <AlertTriangle className="w-5 h-5" />;
      default: return <ThermometerSun className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-black";
      case "low": return "bg-blue-500 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  const getAlertBorderColor = (severity) => {
    switch (severity) {
      case "critical": return "border-l-4 border-l-red-500";
      case "high": return "border-l-4 border-l-orange-500";
      case "medium": return "border-l-4 border-l-yellow-500";
      case "low": return "border-l-4 border-l-blue-500";
      default: return "border-l-4 border-l-slate-500";
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <CloudLightning className="w-6 h-6 text-yellow-500" />
            Weather & Road Alerts
          </h3>
          <p className="text-slate-600">Stay safe with real-time hazard warnings</p>
        </div>
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600" data-testid="report-alert-btn">
              <Plus className="w-4 h-4 mr-2" />
              Report Hazard
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="report-alert-dialog">
            <DialogHeader>
              <DialogTitle>Report Weather/Road Hazard</DialogTitle>
              <DialogDescription>Help fellow drivers by reporting hazardous conditions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Alert Type</Label>
                <select
                  value={newAlert.alert_type}
                  onChange={(e) => setNewAlert({ ...newAlert, alert_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  data-testid="alert-type-select"
                >
                  <option value="severe_weather">Severe Weather</option>
                  <option value="ice_warning">Ice/Snow Warning</option>
                  <option value="high_winds">High Winds</option>
                  <option value="flood">Flooding</option>
                  <option value="road_hazard">Road Hazard</option>
                </select>
              </div>
              
              <div>
                <Label>Severity</Label>
                <select
                  value={newAlert.severity}
                  onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  data-testid="alert-severity-select"
                >
                  <option value="low">Low - Minor inconvenience</option>
                  <option value="medium">Medium - Use caution</option>
                  <option value="high">High - Dangerous conditions</option>
                  <option value="critical">Critical - Avoid area</option>
                </select>
              </div>
              
              <div>
                <Label>Title *</Label>
                <Input
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                  placeholder="e.g., Black ice on I-40"
                  data-testid="alert-title"
                />
              </div>
              
              <div>
                <Label>Location *</Label>
                <Input
                  value={newAlert.location}
                  onChange={(e) => setNewAlert({ ...newAlert, location: e.target.value })}
                  placeholder="e.g., I-40 Mile Marker 245, TX"
                  data-testid="alert-location"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newAlert.description}
                  onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                  placeholder="Provide details about the hazard..."
                  data-testid="alert-description"
                />
              </div>
              
              <div>
                <Label>Alert Duration</Label>
                <select
                  value={newAlert.expires_hours}
                  onChange={(e) => setNewAlert({ ...newAlert, expires_hours: parseInt(e.target.value) })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                </select>
              </div>
              
              <Button onClick={reportAlert} className="w-full btn-primary" data-testid="submit-alert-btn">
                Submit Alert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Alerts */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-8 text-center">
            <ThermometerSun className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h4 className="text-lg font-semibold text-green-700">All Clear!</h4>
            <p className="text-green-600">No active weather or road alerts in your area.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`bg-white ${getAlertBorderColor(alert.severity)}`}
              data-testid={`alert-${alert.id}`}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                      {getAlertIcon(alert.alert_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg">{alert.title}</h4>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-600 mb-2">{alert.description}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {alert.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeAgo(alert.created_at)}
                        </span>
                        {alert.reported_by && (
                          <span className="text-blue-600">Driver reported</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {alert.latitude && alert.longitude && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, '_blank')}
                    >
                      View Map
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
