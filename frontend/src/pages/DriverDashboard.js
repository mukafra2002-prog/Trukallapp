import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { MapPin, DollarSign, Shield, Droplets, Utensils, Fuel, Wifi, LogOut, History, Search, Award, AlertTriangle, Clock, Bell, TrendingUp } from "lucide-react";

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795
};

export default function DriverDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [searchCity, setSearchCity] = useState("");
  const [activeTab, setActiveTab] = useState("map");
  const [loading, setLoading] = useState(true);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [fatigueLevel, setFatigueLevel] = useState("good"); // good, warning, danger
  const [wakeUpTime, setWakeUpTime] = useState("");
  const [showFatigueAlert, setShowFatigueAlert] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: '' // Will use mock data for MVP
  });

  useEffect(() => {
    fetchSpots();
    fetchBookings();
  }, []);

  const fetchSpots = async () => {
    try {
      const response = await axios.get(`${API}/spots`);
      setSpots(response.data);
    } catch (error) {
      toast.error("Failed to load parking spots");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings/driver/${user.email}`);
      setBookings(response.data);
    } catch (error) {
      console.error("Failed to load bookings", error);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/spots`, {
        params: { city: searchCity }
      });
      setSpots(response.data);
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case 'shower': return <Droplets className="w-4 h-4" />;
      case 'restroom': return <Droplets className="w-4 h-4" />;
      case 'food': return <Utensils className="w-4 h-4" />;
      case 'fuel': return <Fuel className="w-4 h-4" />;
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{user.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold" data-testid="driver-name">{user.name}</h2>
              <p className="text-sm text-muted-foreground">Truck Driver</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} data-testid="logout-btn">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Alerts and Rewards Bar */}
      <div className=\"bg-card border-b border-white/10 p-3\">\n        <div className=\"max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3\">\n          {/* Reward Points */}\n          <Card className=\"bg-accent/50 border-secondary/30\" data-testid=\"rewards-card\">\n            <CardContent className=\"p-3 flex items-center justify-between\">\n              <div className=\"flex items-center gap-2\">\n                <Award className=\"w-6 h-6 text-secondary\" />\n                <div>\n                  <p className=\"text-xs text-muted-foreground\">Your Points</p>\n                  <p className=\"text-2xl font-bold mono text-secondary\">{rewardPoints}</p>\n                </div>\n              </div>\n              <Button variant=\"ghost\" size=\"sm\" onClick={() => toast.info(\"Earn points by booking parking, reporting spots, and using TrukAll daily!\")}>\n                <span className=\"text-xs\">How to earn?</span>\n              </Button>\n            </CardContent>\n          </Card>\n\n          {/* Fatigue Monitor */}\n          <Card className={`bg-accent/50 ${\n            fatigueLevel === 'danger' ? 'border-destructive/50' : \n            fatigueLevel === 'warning' ? 'border-yellow-500/50' : \n            'border-secondary/30'\n          }`} data-testid=\"fatigue-card\">\n            <CardContent className=\"p-3 flex items-center justify-between\">\n              <div className=\"flex items-center gap-2\">\n                <AlertTriangle className={`w-6 h-6 ${\n                  fatigueLevel === 'danger' ? 'text-destructive' :\n                  fatigueLevel === 'warning' ? 'text-yellow-500' :\n                  'text-secondary'\n                }`} />\n                <div>\n                  <p className=\"text-xs text-muted-foreground\">Fatigue Status</p>\n                  <p className=\"text-sm font-bold uppercase\">{fatigueLevel === 'good' ? 'All Good' : fatigueLevel === 'warning' ? 'Take Break Soon' : 'REST NOW!'}</p>\n                </div>\n              </div>\n              <Button variant=\"ghost\" size=\"sm\" onClick={() => toast.info(\"We monitor your activity to help you stay safe. Take breaks when needed!\")}>\n                <span className=\"text-xs\">Info</span>\n              </Button>\n            </CardContent>\n          </Card>\n\n          {/* Wake-Up Timer */}\n          <Card className=\"bg-accent/50 border-primary/30\" data-testid=\"wakeup-card\">\n            <CardContent className=\"p-3 flex items-center justify-between\">\n              <div className=\"flex items-center gap-2\">\n                <Clock className=\"w-6 h-6 text-primary\" />\n                <div>\n                  <p className=\"text-xs text-muted-foreground\">Wake-Up Alert</p>\n                  {wakeUpTime ? (\n                    <p className=\"text-sm font-bold mono\">{wakeUpTime}</p>\n                  ) : (\n                    <p className=\"text-xs text-muted-foreground\">Not set</p>\n                  )}\n                </div>\n              </div>\n              <Button variant=\"ghost\" size=\"sm\" onClick={() => {\n                const time = prompt('Set wake-up time (HH:MM format, e.g., 14:30):')\n                if (time) {\n                  setWakeUpTime(time)\n                  toast.success(`Wake-up alert set for ${time}`)\n                }\n              }}>\n                <span className=\"text-xs\">Set</span>\n              </Button>\n            </CardContent>\n          </Card>\n        </div>\n      </div>

      {/* Search Bar */}
      <div className="bg-card border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex gap-3">
          <Input
            type="text"
            placeholder="Search by city (e.g., Dallas, Atlanta)"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="touch-target"
            data-testid="search-city-input"
          />
          <Button onClick={handleSearch} className="btn-primary" data-testid="search-btn">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "map" ? "default" : "outline"}
            onClick={() => setActiveTab("map")}
            className="touch-target"
            data-testid="tab-map"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Find Parking
          </Button>
          <Button
            variant={activeTab === "bookings" ? "default" : "outline"}
            onClick={() => setActiveTab("bookings")}
            className="touch-target"
            data-testid="tab-bookings"
          >
            <History className="w-4 h-4 mr-2" />
            My Bookings
          </Button>
        </div>

        {activeTab === "map" && (
          <div>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card data-testid="stat-available">
                <CardHeader>
                  <CardTitle className="text-2xl mono">{spots.filter(s => s.available_spaces > 0).length}</CardTitle>
                  <CardDescription>Available Now</CardDescription>
                </CardHeader>
              </Card>
              <Card data-testid="stat-free">
                <CardHeader>
                  <CardTitle className="text-2xl mono">{spots.filter(s => s.is_free).length}</CardTitle>
                  <CardDescription>Free Parking</CardDescription>
                </CardHeader>
              </Card>
              <Card data-testid="stat-secure">
                <CardHeader>
                  <CardTitle className="text-2xl mono">{spots.filter(s => s.security_level === 'high').length}</CardTitle>
                  <CardDescription>High Security</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Map */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Parking Locations</CardTitle>
                <CardDescription>Click on any spot to view details and book</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="map-container bg-zinc-900 rounded-lg flex items-center justify-center" data-testid="map-container">
                  <p className="text-muted-foreground">Map view with {spots.length} parking spots</p>
                </div>
              </CardContent>
            </Card>

            {/* Spots List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <p className="col-span-full text-center text-muted-foreground">Loading parking spots...</p>
              ) : spots.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground">No parking spots found</p>
              ) : (
                spots.map((spot) => (
                  <Card key={spot.id} className="card-hover cursor-pointer" onClick={() => navigate(`/spot/${spot.id}`)} data-testid={`spot-card-${spot.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{spot.name}</CardTitle>
                          <CardDescription>{spot.city}, {spot.state}</CardDescription>
                        </div>
                        <div className="flex flex-col gap-1">
                          {spot.available_spaces > 0 ? (
                            <Badge className="status-available">Available</Badge>
                          ) : (
                            <Badge className="status-full">Full</Badge>
                          )}
                          {/* Predictive Badge */}
                          {spot.available_spaces > 0 && spot.available_spaces <= spot.total_spaces * 0.5 && (
                            <Badge className="bg-secondary/20 text-secondary text-xs" data-testid="trend-filling">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Filling
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Spaces</span>
                          <span className="font-bold mono">{spot.available_spaces}/{spot.total_spaces}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Price</span>
                          <span className="font-bold mono text-primary">
                            {spot.is_free ? "FREE" : `$${spot.price_per_night}/night`}
                          </span>
                        </div>
                        {/* Predicted availability for next few hours */}
                        {spot.available_spaces > 0 && spot.available_spaces < 10 && (
                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-2">
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Likely to fill in 2-3 hours</span>
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-1 flex-wrap">
                          {spot.amenities.slice(0, 4).map((amenity) => (
                            <div key={amenity} className="amenity-badge bg-accent" title={amenity}>
                              {getAmenityIcon(amenity)}
                            </div>
                          ))}
                        </div>
                        {spot.fuel_price_diesel && (
                          <div className="text-sm text-muted-foreground">
                            Diesel: <span className="fuel-price text-primary">${spot.fuel_price_diesel}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>Your parking history and upcoming reservations</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No bookings yet</p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id} data-testid={`booking-${booking.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{booking.spot_name}</CardTitle>
                              <CardDescription>{booking.spot_address}</CardDescription>
                            </div>
                            <Badge className={booking.payment_status === 'paid' ? 'bg-secondary' : 'bg-yellow-500'}>
                              {booking.payment_status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Check-in</p>
                              <p className="font-bold mono">{new Date(booking.check_in_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Check-out</p>
                              <p className="font-bold mono">{new Date(booking.check_out_date).toLocaleDateString()}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Total Paid</p>
                              <p className="font-bold mono text-primary text-2xl">${booking.total_price}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="mobile-nav md:hidden">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center gap-1 ${activeTab === 'map' ? 'text-primary' : 'text-muted-foreground'}`}
          data-testid="mobile-nav-map"
        >
          <MapPin className="w-6 h-6" />
          <span className="text-xs">Find</span>
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex flex-col items-center gap-1 ${activeTab === 'bookings' ? 'text-primary' : 'text-muted-foreground'}`}
          data-testid="mobile-nav-bookings"
        >
          <History className="w-6 h-6" />
          <span className="text-xs">Bookings</span>
        </button>
      </div>
    </div>
  );
}
