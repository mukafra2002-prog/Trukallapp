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
import { MapPin, DollarSign, Shield, Droplets, Utensils, Fuel, Wifi, LogOut, History, Search, Award, AlertTriangle, Clock, Bell, TrendingUp, ShowerHead, Building2, Star, ThumbsUp, ThumbsDown, AlertOctagon, Store, Users, Calculator, FileText, CreditCard, Crown, Check, Truck, Calendar } from "lucide-react";
import ConvoyFinder from "@/components/ConvoyFinder";

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
  
  // New state for additional features
  const [showerCredits, setShowerCredits] = useState([]);
  const [showerTotals, setShowerTotals] = useState({ total_available_showers: 0, total_points: 0, chains_tracked: 0 });
  const [brokerSearch, setBrokerSearch] = useState("");
  const [brokerRatings, setBrokerRatings] = useState([]);
  const [brokerSummary, setBrokerSummary] = useState(null);
  const [retailParking, setRetailParking] = useState([]);
  const [retailChains, setRetailChains] = useState([]);
  const [selectedChain, setSelectedChain] = useState("");
  
  // Additional feature states
  const [loads, setLoads] = useState([]);
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [tripCalculation, setTripCalculation] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [detentionClaims, setDetentionClaims] = useState([]);
  const [detentionTotals, setDetentionTotals] = useState({ total_pending: 0, total_paid: 0, total_claims: 0 });
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: '' // Will use mock data for MVP
  });

  useEffect(() => {
    fetchSpots();
    fetchBookings();
    fetchShowerCredits();
    fetchRetailChains();
    fetchRetailParking();
    fetchLoads();
    fetchCompliance();
    fetchDetentionClaims();
    fetchSubscription();
    
    // Calculate reward points based on bookings
    // 100 points per booking
    const calculatePoints = () => {
      const points = bookings.length * 100;
      setRewardPoints(points);
    };
    
    if (bookings.length > 0) {
      calculatePoints();
    }
    
    // Simulate fatigue monitoring based on time
    const monitorFatigue = () => {
      const hour = new Date().getHours();
      // Between 10 PM and 6 AM, increase fatigue warnings
      if (hour >= 22 || hour <= 6) {
        setFatigueLevel('warning');
        setShowFatigueAlert(true);
      } else {
        setFatigueLevel('good');
        setShowFatigueAlert(false);
      }
    };
    
    monitorFatigue();
    const fatigueInterval = setInterval(monitorFatigue, 60000); // Check every minute
    
    return () => clearInterval(fatigueInterval);
  }, [bookings]);

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
      
      // Calculate reward points based on actual bookings
      setRewardPoints(response.data.length * 100);
    } catch (error) {
      console.error("Failed to load bookings", error);
    }
  };

  const fetchShowerCredits = async () => {
    try {
      const [creditsRes, totalsRes] = await Promise.all([
        axios.get(`${API}/shower-credits/${user.email}`),
        axios.get(`${API}/shower-credits/${user.email}/total`)
      ]);
      setShowerCredits(creditsRes.data);
      setShowerTotals(totalsRes.data);
    } catch (error) {
      console.error("Failed to load shower credits", error);
    }
  };

  const fetchBrokerRatings = async (brokerName) => {
    try {
      if (!brokerName.trim()) return;
      const [ratingsRes, summaryRes] = await Promise.all([
        axios.get(`${API}/brokers/ratings/${encodeURIComponent(brokerName)}`),
        axios.get(`${API}/brokers/summary/${encodeURIComponent(brokerName)}`).catch(() => null)
      ]);
      setBrokerRatings(ratingsRes.data);
      if (summaryRes) {
        setBrokerSummary(summaryRes.data);
      }
    } catch (error) {
      setBrokerRatings([]);
      setBrokerSummary(null);
      if (error.response?.status === 404) {
        toast.info("No ratings found for this broker");
      }
    }
  };

  const fetchRetailParking = async (chain = "") => {
    try {
      const params = chain ? { chain } : {};
      const response = await axios.get(`${API}/retail-parking`, { params });
      setRetailParking(response.data);
    } catch (error) {
      console.error("Failed to load retail parking", error);
    }
  };

  const fetchRetailChains = async () => {
    try {
      const response = await axios.get(`${API}/retail-parking/chains`);
      setRetailChains(response.data.chains);
    } catch (error) {
      console.error("Failed to load retail chains", error);
    }
  };

  const fetchLoads = async () => {
    try {
      const response = await axios.get(`${API}/loads`);
      setLoads(response.data);
    } catch (error) {
      console.error("Failed to load loads", error);
    }
  };

  const calculateTripProfit = async (loadId) => {
    try {
      const response = await axios.post(`${API}/calculator/trip-profit?load_id=${loadId}&driver_email=${user.email}`);
      setTripCalculation(response.data);
      setSelectedLoad(loads.find(l => l.id === loadId));
    } catch (error) {
      toast.error("Failed to calculate trip profit");
    }
  };

  const fetchCompliance = async () => {
    try {
      const response = await axios.get(`${API}/compliance/${user.email}`);
      if (response.data.message !== "No compliance data found") {
        setCompliance(response.data);
      }
    } catch (error) {
      console.error("Failed to load compliance", error);
    }
  };

  const fetchDetentionClaims = async () => {
    try {
      const [claimsRes, totalsRes] = await Promise.all([
        axios.get(`${API}/detention/${user.email}`),
        axios.get(`${API}/detention/${user.email}/total`)
      ]);
      setDetentionClaims(claimsRes.data);
      setDetentionTotals(totalsRes.data);
    } catch (error) {
      console.error("Failed to load detention claims", error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        axios.get(`${API}/subscriptions/plans`),
        axios.get(`${API}/subscriptions/user/${user.email}`)
      ]);
      setSubscriptionPlans(plansRes.data.plans);
      setUserSubscription(subRes.data.subscription);
      setCurrentPlan(subRes.data.current_plan);
    } catch (error) {
      console.error("Failed to load subscription", error);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      const response = await axios.post(`${API}/subscriptions/create-checkout?plan_id=${planId}&user_email=${user.email}`);
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.success("Plan activated!");
        fetchSubscription();
      }
    } catch (error) {
      toast.error("Failed to start subscription");
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

  const getChainDisplayName = (chainId) => {
    const names = {
      'pilot_flying_j': 'Pilot Flying J',
      'loves': "Love's Travel Stops",
      'ta_petro': 'TA/Petro',
      'speedway': 'Speedway',
      'walmart': 'Walmart',
      'lowes': "Lowe's",
      'home_depot': 'Home Depot',
      'cracker_barrel': 'Cracker Barrel',
      'cabelas': "Cabela's",
      'bass_pro': 'Bass Pro Shops',
      'rest_area': 'Rest Area',
      'truck_stop': 'Independent Truck Stop'
    };
    return names[chainId] || chainId;
  };

  const getChainColor = (chainId) => {
    const colors = {
      'pilot_flying_j': 'bg-red-500',
      'loves': 'bg-yellow-500',
      'ta_petro': 'bg-blue-600',
      'speedway': 'bg-orange-500',
      'walmart': 'bg-blue-500',
      'lowes': 'bg-blue-700',
      'cracker_barrel': 'bg-amber-600',
      'cabelas': 'bg-green-700',
      'rest_area': 'bg-green-500'
    };
    return colors[chainId] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{user.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900" data-testid="driver-name">{user.name}</h2>
              <p className="text-sm text-slate-500">Truck Driver</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} data-testid="logout-btn" className="border-slate-300 text-slate-700 hover:bg-slate-100">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Alerts and Rewards Bar */}
      <div className="bg-white border-b border-slate-200 p-3">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Reward Points */}
          <Card className="bg-blue-50 border-blue-200" data-testid="rewards-card">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-slate-600">Your Points</p>
                  <p className="text-2xl font-bold mono text-blue-600">{rewardPoints}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => toast.info("Earn points by booking parking, reporting spots, and using TrukAll daily!")} className="text-slate-600 hover:text-blue-600">
                <span className="text-xs">How to earn?</span>
              </Button>
            </CardContent>
          </Card>

          {/* Fatigue Monitor */}
          <Card className={`${
            fatigueLevel === 'danger' ? 'bg-red-50 border-red-300' : 
            fatigueLevel === 'warning' ? 'bg-amber-50 border-amber-300' : 
            'bg-green-50 border-green-200'
          }`} data-testid="fatigue-card">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-6 h-6 ${
                  fatigueLevel === 'danger' ? 'text-red-600' :
                  fatigueLevel === 'warning' ? 'text-amber-600' :
                  'text-green-600'
                }`} />
                <div>
                  <p className="text-xs text-slate-600">Fatigue Status</p>
                  <p className={`font-bold ${
                    fatigueLevel === 'danger' ? 'text-red-600' :
                    fatigueLevel === 'warning' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    {fatigueLevel === 'danger' ? 'TAKE A BREAK!' : fatigueLevel === 'warning' ? 'TAKE BREAK SOON' : 'ALL GOOD'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => toast.info("Based on your driving hours and time of day. Rest when needed!")} className="text-slate-600">
                <span className="text-xs">Info</span>
              </Button>
            </CardContent>
          </Card>

          {/* Wake-up Alarm */}
          <Card className="bg-slate-50 border-slate-200" data-testid="wakeup-card">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-slate-600" />
                <div>
                  <p className="text-xs text-slate-600">Wake-up Alarm</p>
                  <p className="font-bold text-slate-900">{wakeUpTime || 'Not set'}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                const time = prompt("Set wake-up time (e.g., 6:00 AM):");
                if (time) {
                  setWakeUpTime(time);
                  toast.success(`Wake-up alarm set for ${time}`);
                }
              }} className="text-blue-600 hover:text-blue-700">
                <span className="text-xs">Set</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="max-w-7xl mx-auto flex gap-3">
          <Input
            type="text"
            placeholder="Search by city (e.g., Dallas, Atlanta)"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="touch-target border-slate-300"
            data-testid="search-city-input"
          />
          <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6" data-testid="search-btn">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={activeTab === "map" ? "default" : "outline"}
            onClick={() => setActiveTab("map")}
            className={`touch-target ${activeTab === "map" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-map"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Find Parking
          </Button>
          <Button
            variant={activeTab === "bookings" ? "default" : "outline"}
            onClick={() => setActiveTab("bookings")}
            className={`touch-target ${activeTab === "bookings" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-bookings"
          >
            <History className="w-4 h-4 mr-2" />
            My Bookings
          </Button>
          <Button
            variant={activeTab === "showers" ? "default" : "outline"}
            onClick={() => setActiveTab("showers")}
            className={`touch-target ${activeTab === "showers" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-showers"
          >
            <ShowerHead className="w-4 h-4 mr-2" />
            Shower Credits
          </Button>
          <Button
            variant={activeTab === "brokers" ? "default" : "outline"}
            onClick={() => setActiveTab("brokers")}
            className={`touch-target ${activeTab === "brokers" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-brokers"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Broker Ratings
          </Button>
          <Button
            variant={activeTab === "retail" ? "default" : "outline"}
            onClick={() => setActiveTab("retail")}
            className={`touch-target ${activeTab === "retail" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-retail"
          >
            <Store className="w-4 h-4 mr-2" />
            Retail Parking
          </Button>
          <Button
            variant={activeTab === "convoy" ? "default" : "outline"}
            onClick={() => setActiveTab("convoy")}
            className={`touch-target ${activeTab === "convoy" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-convoy"
          >
            <Users className="w-4 h-4 mr-2" />
            Convoy
          </Button>
          <Button
            variant={activeTab === "calculator" ? "default" : "outline"}
            onClick={() => setActiveTab("calculator")}
            className={`touch-target ${activeTab === "calculator" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-calculator"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Trip Calculator
          </Button>
          <Button
            variant={activeTab === "compliance" ? "default" : "outline"}
            onClick={() => setActiveTab("compliance")}
            className={`touch-target ${activeTab === "compliance" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-compliance"
          >
            <FileText className="w-4 h-4 mr-2" />
            DOT Compliance
          </Button>
          <Button
            variant={activeTab === "subscription" ? "default" : "outline"}
            onClick={() => setActiveTab("subscription")}
            className={`touch-target ${activeTab === "subscription" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-subscription"
          >
            <Crown className="w-4 h-4 mr-2" />
            Plans
          </Button>
        </div>

        {activeTab === "map" && (
          <div>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-blue-50 border-blue-200" data-testid="stat-available">
                <CardHeader>
                  <CardTitle className="text-2xl mono text-blue-600">{spots.filter(s => s.available_spaces > 0).length}</CardTitle>
                  <CardDescription className="text-slate-600">Available Now</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-green-50 border-green-200" data-testid="stat-free">
                <CardHeader>
                  <CardTitle className="text-2xl mono text-green-600">{spots.filter(s => s.is_free).length}</CardTitle>
                  <CardDescription className="text-slate-600">Free Parking</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-purple-50 border-purple-200" data-testid="stat-secure">
                <CardHeader>
                  <CardTitle className="text-2xl mono text-purple-600">{spots.filter(s => s.security_level === 'high').length}</CardTitle>
                  <CardDescription className="text-slate-600">High Security</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Map */}
            <Card className="mb-6 bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Parking Locations</CardTitle>
                <CardDescription className="text-slate-600">Click on any spot to view details and book</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="map-container bg-slate-800 rounded-lg flex items-center justify-center" data-testid="map-container">
                  <p className="text-slate-400">Map view with {spots.length} parking spots</p>
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

        {/* Shower Credits Tab */}
        {activeTab === "showers" && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShowerHead className="w-6 h-6 text-blue-500" />
                  Your Shower Credits
                </CardTitle>
                <CardDescription>Track your rewards across all truck stop chains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-blue-500">{showerTotals.total_available_showers}</p>
                    <p className="text-sm text-muted-foreground">Available Showers</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-cyan-500">{showerTotals.total_points.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-purple-500">{showerTotals.chains_tracked}</p>
                    <p className="text-sm text-muted-foreground">Chains Tracked</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Chain Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {showerCredits.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center">
                    <ShowerHead className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No shower credits tracked yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Add your rewards numbers to track your credits</p>
                  </CardContent>
                </Card>
              ) : (
                showerCredits.map((credit) => (
                  <Card key={credit.id} className="overflow-hidden" data-testid={`shower-credit-${credit.chain}`}>
                    <div className={`h-2 ${getChainColor(credit.chain)}`}></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{getChainDisplayName(credit.chain)}</CardTitle>
                      {credit.rewards_number && (
                        <CardDescription className="font-mono text-xs">{credit.rewards_number}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Available Showers</p>
                          <p className="text-2xl font-bold">{credit.available_showers}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Points</p>
                          <p className="text-xl font-bold text-blue-500">{credit.points_balance.toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Last updated: {new Date(credit.last_updated).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Broker Ratings Tab */}
        {activeTab === "brokers" && (
          <div className="space-y-6">
            {/* Search Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  Broker Ratings & Fraud Detection
                </CardTitle>
                <CardDescription>Check broker reputation before accepting loads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Enter broker name or MC number..."
                    value={brokerSearch}
                    onChange={(e) => setBrokerSearch(e.target.value)}
                    className="flex-1"
                    data-testid="broker-search-input"
                  />
                  <Button onClick={() => fetchBrokerRatings(brokerSearch)} className="btn-primary" data-testid="broker-search-btn">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Broker Summary */}
            {brokerSummary && (
              <Card className={`border-2 ${brokerSummary.fraud_reports > 0 ? 'border-red-500/50 bg-red-500/5' : 'border-green-500/50 bg-green-500/5'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{brokerSummary.broker_name}</CardTitle>
                      {brokerSummary.mc_number && (
                        <CardDescription className="font-mono">{brokerSummary.mc_number}</CardDescription>
                      )}
                    </div>
                    {brokerSummary.fraud_reports > 0 && (
                      <Badge className="bg-red-500 text-white">
                        <AlertOctagon className="w-3 h-3 mr-1" />
                        {brokerSummary.fraud_reports} Fraud Report{brokerSummary.fraud_reports > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-2xl font-bold">{brokerSummary.average_rating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Overall Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <span className="text-2xl font-bold">{brokerSummary.average_payment_rating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Payment Rating</p>
                    </div>
                    <div className="text-center">
                      <span className="text-2xl font-bold">{brokerSummary.average_payment_days.toFixed(0)}</span>
                      <p className="text-xs text-muted-foreground">Avg Days to Pay</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ThumbsUp className="w-5 h-5 text-blue-500" />
                        <span className="text-2xl font-bold">{brokerSummary.would_work_again_percentage.toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Would Work Again</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Based on {brokerSummary.total_reviews} reviews ({brokerSummary.verified_reviews} verified)
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Individual Reviews */}
            {brokerRatings.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Recent Reviews</h3>
                {brokerRatings.map((rating) => (
                  <Card key={rating.id} className={rating.fraud_reported ? 'border-red-500/30' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{rating.driver_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(rating.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {rating.verified_load && (
                            <Badge variant="outline" className="text-xs">Verified Load</Badge>
                          )}
                          {rating.fraud_reported && (
                            <Badge className="bg-red-500 text-white text-xs">
                              Fraud: {rating.fraud_type?.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < rating.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        {rating.would_work_again ? (
                          <span className="text-xs text-green-500 flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> Would work again
                          </span>
                        ) : (
                          <span className="text-xs text-red-500 flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" /> Would not work again
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{rating.comment}</p>
                      {rating.payment_days && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Paid in {rating.payment_days} days
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Retail Parking Tab */}
        {activeTab === "retail" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-6 h-6" />
                  Free Overnight Parking
                </CardTitle>
                <CardDescription>Find overnight parking at Walmart, Cracker Barrel, and more</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedChain === "" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedChain("");
                      fetchRetailParking("");
                    }}
                  >
                    All
                  </Button>
                  {retailChains.filter(c => c.overnight_friendly).map((chain) => (
                    <Button
                      key={chain.id}
                      variant={selectedChain === chain.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedChain(chain.id);
                        fetchRetailParking(chain.id);
                      }}
                    >
                      {chain.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {retailParking.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center">
                    <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No retail parking locations found</p>
                  </CardContent>
                </Card>
              ) : (
                retailParking.map((location) => (
                  <Card key={location.id} className="overflow-hidden" data-testid={`retail-${location.id}`}>
                    <div className={`h-2 ${getChainColor(location.chain)}`}></div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{location.name}</CardTitle>
                          <CardDescription>{location.city}, {location.state}</CardDescription>
                        </div>
                        {location.community_verified && (
                          <Badge className="bg-green-500/20 text-green-600 text-xs">Verified</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{location.address}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold">{location.average_rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({location.total_reviews} reviews)</span>
                        </div>
                        {location.truck_parking_spaces && (
                          <Badge variant="outline">{location.truck_parking_spaces} spots</Badge>
                        )}
                      </div>

                      {location.restrictions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {location.restrictions.map((restriction, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600">
                              {restriction.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {location.amenities.length > 0 && (
                        <div className="flex gap-2">
                          {location.amenities.map((amenity, i) => (
                            <span key={i} className="text-xs text-muted-foreground">
                              {getAmenityIcon(amenity)} {amenity}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Convoy Finder Tab */}
        {activeTab === "convoy" && (
          <ConvoyFinder />
        )}

        {/* Trip Calculator Tab */}
        {activeTab === "calculator" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-6 h-6" />
                  Trip Profit Calculator
                </CardTitle>
                <CardDescription>Calculate if a load is profitable before accepting</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Select a load from the list below to calculate estimated profit:</p>
                
                <div className="space-y-3">
                  {loads.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No loads available</p>
                  ) : (
                    loads.slice(0, 5).map((load) => (
                      <Card key={load.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => calculateTripProfit(load.id)}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{load.origin_city}, {load.origin_state} → {load.destination_city}, {load.destination_state}</p>
                              <p className="text-sm text-muted-foreground">{load.distance} miles • {load.equipment_type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-green-500">${load.rate.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">${(load.rate / load.distance).toFixed(2)}/mile</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Calculation Result */}
            {tripCalculation && selectedLoad && (
              <Card className={`border-2 ${tripCalculation.is_profitable ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {tripCalculation.is_profitable ? (
                      <Check className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    )}
                    {tripCalculation.is_profitable ? 'Profitable Trip!' : 'Not Profitable'}
                  </CardTitle>
                  <CardDescription>
                    {selectedLoad.origin_city}, {selectedLoad.origin_state} → {selectedLoad.destination_city}, {selectedLoad.destination_state}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-accent/30 rounded-lg">
                      <p className="text-2xl font-bold text-green-500">${tripCalculation.load_rate.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Load Rate</p>
                    </div>
                    <div className="text-center p-3 bg-accent/30 rounded-lg">
                      <p className="text-2xl font-bold text-red-500">-${tripCalculation.estimated_fuel_cost}</p>
                      <p className="text-xs text-muted-foreground">Fuel Cost</p>
                    </div>
                    <div className="text-center p-3 bg-accent/30 rounded-lg">
                      <p className="text-2xl font-bold text-red-500">-${tripCalculation.toll_cost}</p>
                      <p className="text-xs text-muted-foreground">Tolls</p>
                    </div>
                    <div className="text-center p-3 bg-accent/30 rounded-lg">
                      <p className="text-2xl font-bold text-red-500">-${tripCalculation.parking_cost}</p>
                      <p className="text-xs text-muted-foreground">Parking</p>
                    </div>
                  </div>
                  <div className="border-t pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                      <p className={`text-3xl font-bold ${tripCalculation.is_profitable ? 'text-green-500' : 'text-red-500'}`}>
                        ${tripCalculation.net_profit.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Profit per Mile</p>
                      <p className={`text-xl font-bold ${tripCalculation.profit_per_mile > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${tripCalculation.profit_per_mile}/mile
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* DOT Compliance Tab */}
        {activeTab === "compliance" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  DOT Compliance Tracker
                </CardTitle>
                <CardDescription>Track your licenses, certifications, and inspections</CardDescription>
              </CardHeader>
              <CardContent>
                {compliance ? (
                  <div className="space-y-4">
                    {/* Alerts */}
                    {compliance.alerts && compliance.alerts.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {compliance.alerts.map((alert, i) => (
                          <div key={i} className={`p-3 rounded-lg border ${alert.severity === 'high' ? 'bg-red-500/10 border-red-500/50' : 'bg-yellow-500/10 border-yellow-500/50'}`}>
                            <p className={`text-sm font-medium ${alert.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}`}>
                              ⚠️ {alert.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-accent/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">CDL Expiry</p>
                              <p className="font-bold">{new Date(compliance.cdl_expiry).toLocaleDateString()}</p>
                            </div>
                            <Truck className="w-8 h-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-accent/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Medical Card Expiry</p>
                              <p className="font-bold">{new Date(compliance.medical_card_expiry).toLocaleDateString()}</p>
                            </div>
                            <FileText className="w-8 h-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>
                      {compliance.hazmat_expiry && (
                        <Card className="bg-accent/30">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">HAZMAT Endorsement</p>
                                <p className="font-bold">{new Date(compliance.hazmat_expiry).toLocaleDateString()}</p>
                              </div>
                              <AlertOctagon className="w-8 h-8 text-orange-500" />
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      <Card className="bg-accent/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">CSA Score</p>
                              <p className="font-bold text-2xl">{compliance.csa_score}</p>
                            </div>
                            <Shield className="w-8 h-8 text-purple-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No compliance data added yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Add your CDL and medical card info to track expiration dates</p>
                    <Button className="mt-4" variant="outline">Add Compliance Info</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detention Claims */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  Detention Claims
                </CardTitle>
                <CardDescription>Track detention time and money owed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-500">${detentionTotals.total_pending.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-green-500">${detentionTotals.total_paid.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Collected</p>
                  </div>
                  <div className="text-center p-3 bg-accent/30 rounded-lg">
                    <p className="text-2xl font-bold">{detentionTotals.total_claims}</p>
                    <p className="text-xs text-muted-foreground">Total Claims</p>
                  </div>
                </div>

                {detentionClaims.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No detention claims yet</p>
                ) : (
                  <div className="space-y-2">
                    {detentionClaims.slice(0, 5).map((claim) => (
                      <Card key={claim.id} className="bg-accent/20">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{claim.broker_name}</p>
                              <p className="text-xs text-muted-foreground">{claim.location} • {claim.detention_hours}hrs</p>
                            </div>
                            <Badge className={claim.status === 'paid' ? 'bg-green-500' : claim.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}>
                              ${claim.total_amount}
                            </Badge>
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

        {/* Subscription Plans Tab */}
        {activeTab === "subscription" && (
          <div className="space-y-6">
            {currentPlan && (
              <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Crown className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Current Plan</p>
                        <p className="text-xl font-bold">{currentPlan.name}</p>
                      </div>
                    </div>
                    {currentPlan.price > 0 && (
                      <Badge className="bg-purple-500">${currentPlan.price}/mo</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`relative overflow-hidden ${plan.is_popular ? 'border-2 border-blue-500 shadow-lg' : ''} ${currentPlan?.id === plan.id ? 'bg-accent/30' : ''}`}
                >
                  {plan.is_popular && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-3 py-1 rounded-bl-lg font-semibold">
                      MOST POPULAR
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {plan.id === 'premium' && <Crown className="w-5 h-5 text-yellow-500" />}
                      {plan.name}
                    </CardTitle>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/{plan.interval}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.is_popular ? 'btn-primary' : ''}`}
                      variant={plan.is_popular ? 'default' : 'outline'}
                      disabled={currentPlan?.id === plan.id}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {currentPlan?.id === plan.id ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Subscribe'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
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
          <MapPin className="w-5 h-5" />
          <span className="text-xs">Find</span>
        </button>
        <button
          onClick={() => setActiveTab("showers")}
          className={`flex flex-col items-center gap-1 ${activeTab === 'showers' ? 'text-primary' : 'text-muted-foreground'}`}
          data-testid="mobile-nav-showers"
        >
          <ShowerHead className="w-5 h-5" />
          <span className="text-xs">Showers</span>
        </button>
        <button
          onClick={() => setActiveTab("brokers")}
          className={`flex flex-col items-center gap-1 ${activeTab === 'brokers' ? 'text-primary' : 'text-muted-foreground'}`}
          data-testid="mobile-nav-brokers"
        >
          <Building2 className="w-5 h-5" />
          <span className="text-xs">Brokers</span>
        </button>
        <button
          onClick={() => setActiveTab("retail")}
          className={`flex flex-col items-center gap-1 ${activeTab === 'retail' ? 'text-primary' : 'text-muted-foreground'}`}
          data-testid="mobile-nav-retail"
        >
          <Store className="w-5 h-5" />
          <span className="text-xs">Retail</span>
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex flex-col items-center gap-1 ${activeTab === 'bookings' ? 'text-primary' : 'text-muted-foreground'}`}
          data-testid="mobile-nav-bookings"
        >
          <History className="w-5 h-5" />
          <span className="text-xs">Bookings</span>
        </button>
      </div>
    </div>
  );
}
