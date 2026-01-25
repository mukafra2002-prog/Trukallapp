import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { MapPin, DollarSign, Shield, Droplets, Utensils, Fuel, Wifi, LogOut, History, Search, Award, AlertTriangle, Clock, Bell, TrendingUp, ShowerHead, Building2, Star, ThumbsUp, ThumbsDown, AlertOctagon, Store, Users, Calculator, FileText, CreditCard, Crown, Check, Truck, Calendar, Radio, Eye, Send, Zap, Phone, AlertCircle, Camera, FolderOpen, Trash2, Plus, CloudRain, ArrowRight, Mic, MessageCircle, BarChart3, Route, Image, Gift, MessageSquare, Globe, Trophy, Wrench, GraduationCap, ShoppingBag, Scale, QrCode, Download, Target, ClipboardCheck, Timer, Moon, Sun } from "lucide-react";
import ConvoyFinder from "@/components/ConvoyFinder";
import NotificationBell from "@/components/NotificationBell";
import WeatherAlerts from "@/components/WeatherAlerts";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import RoutePlanner from "@/components/RoutePlanner";
import VoiceCommands from "@/components/VoiceCommands";
import PhotoReviews from "@/components/PhotoReviews";
import InAppMessaging from "@/components/InAppMessaging";
import FeedbackForm from "@/components/FeedbackForm";
import CommunityBoard from "@/components/CommunityBoard";
import ReferralSystem from "@/components/ReferralSystem";
import SocialLinks from "@/components/SocialLinks";
import Gamification from "@/components/Gamification";
import MentorSystem from "@/components/MentorSystem";
import MaintenanceTracker from "@/components/MaintenanceTracker";
import RewardsStore from "@/components/RewardsStore";
import DriverSpotlight from "@/components/DriverSpotlight";
import TruckWeight from "@/components/TruckWeight";
import HOSTracker from "@/components/HOSTracker";
import QRScanner from "@/components/QRScanner";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import SmartLoadBoard from "@/components/SmartLoadBoard";
import BrokerCreditScore from "@/components/BrokerCreditScore";
import RateComparison from "@/components/RateComparison";
import LoadProfitCalculator from "@/components/LoadProfitCalculator";
import CarrierVerification from "@/components/CarrierVerification";
import PreTripChecklist from "@/components/PreTripChecklist";
import ExpenseTracker from "@/components/ExpenseTracker";
import BreakTimer from "@/components/BreakTimer";
import FuelEfficiencyTracker from "@/components/FuelEfficiencyTracker";
import DriverForums from "@/components/DriverForums";
import HazardAlerts from "@/components/HazardAlerts";
import EarningsDashboard from "@/components/EarningsDashboard";
import LanguageSelector from "@/components/LanguageSelector";


const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795
};

export default function DriverDashboard() {
  const { t } = useTranslation();
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
  
  // Real-time parking report states
  const [liveSpots, setLiveSpots] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSpotForReport, setSelectedSpotForReport] = useState(null);
  const [reportData, setReportData] = useState({
    reported_spaces: 0,
    fill_rate: "filling",
    conditions: [],
    notes: ""
  });
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Emergency SOS states
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "family" });
  
  // Documents states
  const [documents, setDocuments] = useState([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ doc_type: "bol", title: "", notes: "" });
  
  // Fuel prices states
  const [fuelPrices, setFuelPrices] = useState([]);
  const [fuelAverages, setFuelAverages] = useState([]);
  const [showFuelReportModal, setShowFuelReportModal] = useState(false);
  const [newFuelReport, setNewFuelReport] = useState({ station_name: "", chain: "pilot", city: "", state: "", diesel_price: "" });
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('trukall_dark_mode');
    return saved === 'true';
  });
  
  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark', 'bg-slate-900');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark', 'bg-slate-900');
    }
    localStorage.setItem('trukall_dark_mode', darkMode);
  }, [darkMode]);
  
  // Check if user needs onboarding on first load
  useEffect(() => {
    const onboardingComplete = localStorage.getItem('trukall_onboarding_complete');
    if (!onboardingComplete && user) {
      setShowOnboarding(true);
    }
  }, [user]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyAcI3b6EZ-4MHb03_8NyLSP2TKLcsQDEbI'
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
    fetchLiveSpots();
    fetchLeaderboard();
    fetchEmergencyContacts();
    fetchDocuments();
    fetchFuelPrices();
    fetchFuelAverages();
    
    // Set up polling for live updates every 30 seconds
    const liveInterval = setInterval(fetchLiveSpots, 30000);
    
    // Calculate reward points based on bookings
    // 100 points per booking
    const calculatePoints = () => {
      const points = bookings.length * 100;
      setRewardPoints(points);
    };
    
    if (bookings.length > 0) {
      calculatePoints();
    }
    
    return () => clearInterval(liveInterval);
    
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
      setLoads(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load loads", error);
      setLoads([]);
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

  const fetchLiveSpots = async () => {
    try {
      const response = await axios.get(`${API}/spots/live-updates`, {
        params: searchCity ? { city: searchCity } : {}
      });
      setLiveSpots(response.data);
    } catch (error) {
      console.error("Failed to load live spots", error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/reports/leaderboard`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Failed to load leaderboard", error);
    }
  };

  const submitParkingReport = async () => {
    if (!selectedSpotForReport) return;
    
    try {
      const response = await axios.post(
        `${API}/spots/${selectedSpotForReport.id}/report?driver_email=${user.email}`,
        reportData
      );
      toast.success(`${response.data.message} +${response.data.points_earned} points!`);
      setShowReportModal(false);
      setSelectedSpotForReport(null);
      setReportData({ reported_spaces: 0, fill_rate: "filling", conditions: [], notes: "" });
      fetchLiveSpots();
      fetchSpots();
      // Refresh user points
      setRewardPoints(prev => prev + response.data.points_earned);
    } catch (error) {
      toast.error("Failed to submit report");
    }
  };

  const voteOnReport = async (reportId, vote) => {
    try {
      await axios.post(`${API}/reports/${reportId}/vote?vote=${vote}&driver_email=${user.email}`);
      toast.success("Thanks for your feedback!");
      fetchLiveSpots();
    } catch (error) {
      toast.error("Failed to submit vote");
    }
  };

  const openReportModal = (spot) => {
    setSelectedSpotForReport(spot);
    setReportData({
      reported_spaces: spot.available_spaces || 0,
      fill_rate: "filling",
      conditions: [],
      notes: ""
    });
    setShowReportModal(true);
  };

  const toggleCondition = (condition) => {
    setReportData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition]
    }));
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

  // Emergency SOS Functions
  const fetchEmergencyContacts = async () => {
    try {
      const response = await axios.get(`${API}/emergency/contacts/${user.email}`);
      setEmergencyContacts(response.data);
    } catch (error) {
      console.error("Failed to load emergency contacts", error);
    }
  };

  const sendSOS = async (emergencyType) => {
    try {
      const response = await axios.post(`${API}/emergency/sos`, null, {
        params: {
          driver_email: user.email,
          emergency_type: emergencyType,
          location_address: "Current Location" // In production, use actual GPS
        }
      });
      toast.success(response.data.message);
      setShowSOSModal(false);
    } catch (error) {
      toast.error("Failed to send SOS");
    }
  };

  const addEmergencyContact = async () => {
    try {
      await axios.post(`${API}/emergency/contacts`, null, {
        params: {
          driver_email: user.email,
          name: newContact.name,
          phone: newContact.phone,
          relationship: newContact.relationship
        }
      });
      toast.success("Emergency contact added");
      setShowAddContactModal(false);
      setNewContact({ name: "", phone: "", relationship: "family" });
      fetchEmergencyContacts();
    } catch (error) {
      toast.error("Failed to add contact");
    }
  };

  const deleteEmergencyContact = async (contactId) => {
    try {
      await axios.delete(`${API}/emergency/contacts/${contactId}`);
      toast.success("Contact deleted");
      fetchEmergencyContacts();
    } catch (error) {
      toast.error("Failed to delete contact");
    }
  };

  // Document Functions
  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/documents/${user.email}`);
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to load documents", error);
    }
  };

  const saveDocument = async () => {
    try {
      const response = await axios.post(`${API}/documents/scan`, null, {
        params: {
          driver_email: user.email,
          doc_type: newDoc.doc_type,
          title: newDoc.title,
          notes: newDoc.notes
        }
      });
      toast.success(`Document saved! +${response.data.points_earned} points`);
      setShowDocModal(false);
      setNewDoc({ doc_type: "bol", title: "", notes: "" });
      fetchDocuments();
    } catch (error) {
      toast.error("Failed to save document");
    }
  };

  const deleteDocument = async (docId) => {
    try {
      await axios.delete(`${API}/documents/${docId}`);
      toast.success("Document deleted");
      fetchDocuments();
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const downloadDocument = async (doc) => {
    try {
      // Fetch full document with file_data
      const response = await axios.get(`${API}/documents/detail/${doc.id}`);
      const fullDoc = response.data;
      
      if (fullDoc.file_data) {
        // Create download link for base64 data
        const link = document.createElement('a');
        link.href = fullDoc.file_data;
        link.download = `${fullDoc.title || 'document'}.${fullDoc.file_type || 'png'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Document downloaded!");
      } else if (fullDoc.file_url) {
        // Open URL in new tab
        window.open(fullDoc.file_url, '_blank');
        toast.success("Opening document...");
      } else {
        toast.error("No file data available for download");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  // Fuel Functions
  const fetchFuelPrices = async () => {
    try {
      const response = await axios.get(`${API}/fuel/prices/cheapest`, { params: { limit: 20 } });
      setFuelPrices(response.data);
    } catch (error) {
      console.error("Failed to load fuel prices", error);
    }
  };

  const fetchFuelAverages = async () => {
    try {
      const response = await axios.get(`${API}/fuel/average`);
      setFuelAverages(response.data);
    } catch (error) {
      console.error("Failed to load fuel averages", error);
    }
  };

  const reportFuelPrice = async () => {
    try {
      const response = await axios.post(`${API}/fuel/prices/report`, null, {
        params: {
          station_name: newFuelReport.station_name,
          chain: newFuelReport.chain,
          city: newFuelReport.city,
          state: newFuelReport.state,
          diesel_price: parseFloat(newFuelReport.diesel_price),
          driver_email: user.email
        }
      });
      toast.success(`${response.data.message}! +${response.data.points_earned} points`);
      setShowFuelReportModal(false);
      setNewFuelReport({ station_name: "", chain: "pilot", city: "", state: "", diesel_price: "" });
      fetchFuelPrices();
    } catch (error) {
      toast.error("Failed to report fuel price");
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
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`} data-testid="driver-name">{user.name}</h2>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('dashboard.truckDriver')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className={darkMode ? 'text-yellow-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}
              data-testid="dark-mode-toggle"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <NotificationBell />
            <Button variant="outline" onClick={logout} data-testid="logout-btn" className={darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}>
              <LogOut className="w-4 h-4 mr-2" />
              {t('nav.logout')}
            </Button>
          </div>
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
                  <p className="text-xs text-slate-600">{t('dashboard.points')}</p>
                  <p className="text-2xl font-bold mono text-blue-600">{rewardPoints}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => toast.info("Earn points by booking parking, reporting spots, and using TrukAll daily!")} className="text-slate-600 hover:text-blue-600">
                <span className="text-xs">{t('dashboard.howToEarn')}</span>
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
                  <p className="text-xs text-slate-600">{t('dashboard.fatigue')}</p>
                  <p className={`font-bold ${
                    fatigueLevel === 'danger' ? 'text-red-600' :
                    fatigueLevel === 'warning' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    {fatigueLevel === 'danger' ? t('dashboard.takeBreak') : fatigueLevel === 'warning' ? t('dashboard.takeBreakSoon') : t('dashboard.allGood')}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => toast.info("Based on your driving hours and time of day. Rest when needed!")} className="text-slate-600">
                <span className="text-xs">{t('common.info')}</span>
              </Button>
            </CardContent>
          </Card>

          {/* Wake-up Alarm */}
          <Card className="bg-slate-50 border-slate-200" data-testid="wakeup-card">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-slate-600" />
                <div>
                  <p className="text-xs text-slate-600">{t('dashboard.wakeUp')}</p>
                  <p className="font-bold text-slate-900">{wakeUpTime || t('dashboard.notSet')}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                const time = prompt("Set wake-up time (e.g., 6:00 AM):");
                if (time) {
                  setWakeUpTime(time);
                  toast.success(`Wake-up alarm set for ${time}`);
                }
              }} className="text-blue-600 hover:text-blue-700">
                <span className="text-xs">{t('common.set')}</span>
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
            placeholder={t('dashboard.searchPlaceholder')}
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
            variant={activeTab === "live" ? "default" : "outline"}
            onClick={() => { setActiveTab("live"); fetchLiveSpots(); }}
            className={`touch-target ${activeTab === "live" ? "bg-green-600 hover:bg-green-700" : "border-green-300 text-green-700"}`}
            data-testid="tab-live"
          >
            <Radio className="w-4 h-4 mr-2 animate-pulse" />
            {t('tabs.live')}
          </Button>
          <Button
            variant={activeTab === "map" ? "default" : "outline"}
            onClick={() => setActiveTab("map")}
            className={`touch-target ${activeTab === "map" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-map"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {t('tabs.map')}
          </Button>
          <Button
            variant={activeTab === "bookings" ? "default" : "outline"}
            onClick={() => setActiveTab("bookings")}
            className={`touch-target ${activeTab === "bookings" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-bookings"
          >
            <History className="w-4 h-4 mr-2" />
            {t('tabs.bookings')}
          </Button>
          <Button
            variant={activeTab === "showers" ? "default" : "outline"}
            onClick={() => setActiveTab("showers")}
            className={`touch-target ${activeTab === "showers" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-showers"
          >
            <ShowerHead className="w-4 h-4 mr-2" />
            {t('tabs.showers')}
          </Button>
          <Button
            variant={activeTab === "brokers" ? "default" : "outline"}
            onClick={() => setActiveTab("brokers")}
            className={`touch-target ${activeTab === "brokers" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-brokers"
          >
            <Building2 className="w-4 h-4 mr-2" />
            {t('tabs.brokers')}
          </Button>
          <Button
            variant={activeTab === "retail" ? "default" : "outline"}
            onClick={() => setActiveTab("retail")}
            className={`touch-target ${activeTab === "retail" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-retail"
          >
            <Store className="w-4 h-4 mr-2" />
            {t('tabs.retail')}
          </Button>
          <Button
            variant={activeTab === "convoy" ? "default" : "outline"}
            onClick={() => setActiveTab("convoy")}
            className={`touch-target ${activeTab === "convoy" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-convoy"
          >
            <Users className="w-4 h-4 mr-2" />
            {t('tabs.convoy')}
          </Button>
          <Button
            variant={activeTab === "loads" ? "default" : "outline"}
            onClick={() => setActiveTab("loads")}
            className={`touch-target ${activeTab === "loads" ? "bg-green-600 hover:bg-green-700" : "border-green-300 text-green-700"}`}
            data-testid="tab-loads"
          >
            <Truck className="w-4 h-4 mr-2" />
            {t('tabs.loads')}
          </Button>
          <Button
            variant={activeTab === "calculator" ? "default" : "outline"}
            onClick={() => setActiveTab("calculator")}
            className={`touch-target ${activeTab === "calculator" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-calculator"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {t('tabs.calculator')}
          </Button>
          <Button
            variant={activeTab === "compliance" ? "default" : "outline"}
            onClick={() => setActiveTab("compliance")}
            className={`touch-target ${activeTab === "compliance" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-compliance"
          >
            <FileText className="w-4 h-4 mr-2" />
            {t('tabs.compliance')}
          </Button>
          <Button
            variant={activeTab === "subscription" ? "default" : "outline"}
            onClick={() => setActiveTab("subscription")}
            className={`touch-target ${activeTab === "subscription" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-subscription"
          >
            <Crown className="w-4 h-4 mr-2" />
            {t('tabs.subscription')}
          </Button>
          <Button
            variant={activeTab === "emergency" ? "default" : "outline"}
            onClick={() => setActiveTab("emergency")}
            className={`touch-target ${activeTab === "emergency" ? "bg-red-600 hover:bg-red-700" : "border-red-300 text-red-700"}`}
            data-testid="tab-emergency"
          >
            <Phone className="w-4 h-4 mr-2" />
            {t('tabs.emergency')}
          </Button>
          <Button
            variant={activeTab === "documents" ? "default" : "outline"}
            onClick={() => setActiveTab("documents")}
            className={`touch-target ${activeTab === "documents" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-documents"
          >
            <Camera className="w-4 h-4 mr-2" />
            {t('tabs.documents')}
          </Button>
          <Button
            variant={activeTab === "fuel" ? "default" : "outline"}
            onClick={() => setActiveTab("fuel")}
            className={`touch-target ${activeTab === "fuel" ? "bg-amber-600 hover:bg-amber-700" : "border-amber-300 text-amber-700"}`}
            data-testid="tab-fuel"
          >
            <Fuel className="w-4 h-4 mr-2" />
            {t('tabs.fuel')}
          </Button>
          <Button
            variant={activeTab === "weather" ? "default" : "outline"}
            onClick={() => setActiveTab("weather")}
            className={`touch-target ${activeTab === "weather" ? "bg-cyan-600 hover:bg-cyan-700" : "border-cyan-300 text-cyan-700"}`}
            data-testid="tab-weather"
          >
            <CloudRain className="w-4 h-4 mr-2" />
            {t('tabs.weather')}
          </Button>
          <Button
            variant={activeTab === "analytics" ? "default" : "outline"}
            onClick={() => setActiveTab("analytics")}
            className={`touch-target ${activeTab === "analytics" ? "bg-indigo-600 hover:bg-indigo-700" : "border-indigo-300 text-indigo-700"}`}
            data-testid="tab-analytics"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {t('tabs.analytics')}
          </Button>
          <Button
            variant={activeTab === "route" ? "default" : "outline"}
            onClick={() => setActiveTab("route")}
            className={`touch-target ${activeTab === "route" ? "bg-purple-600 hover:bg-purple-700" : "border-purple-300 text-purple-700"}`}
            data-testid="tab-route"
          >
            <Route className="w-4 h-4 mr-2" />
            {t('tabs.route')}
          </Button>
          <Button
            variant={activeTab === "voice" ? "default" : "outline"}
            onClick={() => setActiveTab("voice")}
            className={`touch-target ${activeTab === "voice" ? "bg-teal-600 hover:bg-teal-700" : "border-teal-300 text-teal-700"}`}
            data-testid="tab-voice"
          >
            <Mic className="w-4 h-4 mr-2" />
            {t('tabs.voice')}
          </Button>
          <Button
            variant={activeTab === "photos" ? "default" : "outline"}
            onClick={() => setActiveTab("photos")}
            className={`touch-target ${activeTab === "photos" ? "bg-pink-600 hover:bg-pink-700" : "border-pink-300 text-pink-700"}`}
            data-testid="tab-photos"
          >
            <Image className="w-4 h-4 mr-2" />
            {t('tabs.photos')}
          </Button>
          <Button
            variant={activeTab === "messages" ? "default" : "outline"}
            onClick={() => setActiveTab("messages")}
            className={`touch-target ${activeTab === "messages" ? "bg-rose-600 hover:bg-rose-700" : "border-rose-300 text-rose-700"}`}
            data-testid="tab-messages"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {t('tabs.messages')}
          </Button>
          <Button
            variant={activeTab === "community" ? "default" : "outline"}
            onClick={() => setActiveTab("community")}
            className={`touch-target ${activeTab === "community" ? "bg-violet-600 hover:bg-violet-700" : "border-violet-300 text-violet-700"}`}
            data-testid="tab-community"
          >
            <Users className="w-4 h-4 mr-2" />
            {t('tabs.community')}
          </Button>
          <Button
            variant={activeTab === "referral" ? "default" : "outline"}
            onClick={() => setActiveTab("referral")}
            className={`touch-target ${activeTab === "referral" ? "bg-amber-600 hover:bg-amber-700" : "border-amber-300 text-amber-700"}`}
            data-testid="tab-referral"
          >
            <Gift className="w-4 h-4 mr-2" />
            {t('tabs.referral')}
          </Button>
          <Button
            variant={activeTab === "feedback" ? "default" : "outline"}
            onClick={() => setActiveTab("feedback")}
            className={`touch-target ${activeTab === "feedback" ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-300 text-emerald-700"}`}
            data-testid="tab-feedback"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {t('tabs.feedback')}
          </Button>
          <Button
            variant={activeTab === "connect" ? "default" : "outline"}
            onClick={() => setActiveTab("connect")}
            className={`touch-target ${activeTab === "connect" ? "bg-sky-600 hover:bg-sky-700" : "border-sky-300 text-sky-700"}`}
            data-testid="tab-connect"
          >
            <Globe className="w-4 h-4 mr-2" />
            {t('tabs.connect')}
          </Button>
          <Button
            variant={activeTab === "achievements" ? "default" : "outline"}
            onClick={() => setActiveTab("achievements")}
            className={`touch-target ${activeTab === "achievements" ? "bg-amber-600 hover:bg-amber-700" : "border-amber-300 text-amber-700"}`}
            data-testid="tab-achievements"
          >
            <Trophy className="w-4 h-4 mr-2" />
            {t('tabs.achievements')}
          </Button>
          <Button
            variant={activeTab === "rewards" ? "default" : "outline"}
            onClick={() => setActiveTab("rewards")}
            className={`touch-target ${activeTab === "rewards" ? "bg-purple-600 hover:bg-purple-700" : "border-purple-300 text-purple-700"}`}
            data-testid="tab-rewards"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            {t('tabs.rewards')}
          </Button>
          <Button
            variant={activeTab === "maintenance" ? "default" : "outline"}
            onClick={() => setActiveTab("maintenance")}
            className={`touch-target ${activeTab === "maintenance" ? "bg-slate-600 hover:bg-slate-700" : "border-slate-300 text-slate-700"}`}
            data-testid="tab-maintenance"
          >
            <Wrench className="w-4 h-4 mr-2" />
            {t('tabs.maintenance')}
          </Button>
          <Button
            variant={activeTab === "mentors" ? "default" : "outline"}
            onClick={() => setActiveTab("mentors")}
            className={`touch-target ${activeTab === "mentors" ? "bg-cyan-600 hover:bg-cyan-700" : "border-cyan-300 text-cyan-700"}`}
            data-testid="tab-mentors"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            {t('tabs.mentors')}
          </Button>
          <Button
            variant={activeTab === "weight" ? "default" : "outline"}
            onClick={() => setActiveTab("weight")}
            className={`touch-target ${activeTab === "weight" ? "bg-orange-600 hover:bg-orange-700" : "border-orange-300 text-orange-700"}`}
            data-testid="tab-weight"
          >
            <Scale className="w-4 h-4 mr-2" />
            {t('tabs.weight')}
          </Button>
          <Button
            variant={activeTab === "hos" ? "default" : "outline"}
            onClick={() => setActiveTab("hos")}
            className={`touch-target ${activeTab === "hos" ? "bg-red-600 hover:bg-red-700" : "border-red-300 text-red-700"}`}
            data-testid="tab-hos"
          >
            <Clock className="w-4 h-4 mr-2" />
            {t('tabs.hos')}
          </Button>
          <Button
            variant={activeTab === "qr" ? "default" : "outline"}
            onClick={() => setActiveTab("qr")}
            className={`touch-target ${activeTab === "qr" ? "bg-indigo-600 hover:bg-indigo-700" : "border-indigo-300 text-indigo-700"}`}
            data-testid="tab-qr"
          >
            <QrCode className="w-4 h-4 mr-2" />
            {t('tabs.qr')}
          </Button>
          <Button
            variant={activeTab === "smartloads" ? "default" : "outline"}
            onClick={() => setActiveTab("smartloads")}
            className={`touch-target ${activeTab === "smartloads" ? "bg-purple-600 hover:bg-purple-700" : "border-purple-300 text-purple-700"}`}
            data-testid="tab-smartloads"
          >
            <Target className="w-4 h-4 mr-2" />
            {t('tabs.smartLoads')}
          </Button>
          <Button
            variant={activeTab === "brokerscore" ? "default" : "outline"}
            onClick={() => setActiveTab("brokerscore")}
            className={`touch-target ${activeTab === "brokerscore" ? "bg-cyan-600 hover:bg-cyan-700" : "border-cyan-300 text-cyan-700"}`}
            data-testid="tab-brokerscore"
          >
            <Shield className="w-4 h-4 mr-2" />
            {t('tabs.brokerScore')}
          </Button>
          <Button
            variant={activeTab === "ratecompare" ? "default" : "outline"}
            onClick={() => setActiveTab("ratecompare")}
            className={`touch-target ${activeTab === "ratecompare" ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-300 text-emerald-700"}`}
            data-testid="tab-ratecompare"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {t('tabs.rateCompare')}
          </Button>
          <Button
            variant={activeTab === "profitcalc" ? "default" : "outline"}
            onClick={() => setActiveTab("profitcalc")}
            className={`touch-target ${activeTab === "profitcalc" ? "bg-orange-600 hover:bg-orange-700" : "border-orange-300 text-orange-700"}`}
            data-testid="tab-profitcalc"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {t('tabs.profitCalc')}
          </Button>
          <Button
            variant={activeTab === "fmcsa" ? "default" : "outline"}
            onClick={() => setActiveTab("fmcsa")}
            className={`touch-target ${activeTab === "fmcsa" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-300 text-blue-700"}`}
            data-testid="tab-fmcsa"
          >
            <FileText className="w-4 h-4 mr-2" />
            {t('tabs.fmcsa')}
          </Button>
          <Button
            variant={activeTab === "pretrip" ? "default" : "outline"}
            onClick={() => setActiveTab("pretrip")}
            className={`touch-target ${activeTab === "pretrip" ? "bg-green-600 hover:bg-green-700" : "border-green-300 text-green-700"}`}
            data-testid="tab-pretrip"
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            {t('tabs.preTrip')}
          </Button>
          <Button
            variant={activeTab === "expenses" ? "default" : "outline"}
            onClick={() => setActiveTab("expenses")}
            className={`touch-target ${activeTab === "expenses" ? "bg-teal-600 hover:bg-teal-700" : "border-teal-300 text-teal-700"}`}
            data-testid="tab-expenses"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {t('tabs.expenses')}
          </Button>
          <Button
            variant={activeTab === "breaktimer" ? "default" : "outline"}
            onClick={() => setActiveTab("breaktimer")}
            className={`touch-target ${activeTab === "breaktimer" ? "bg-purple-600 hover:bg-purple-700" : "border-purple-300 text-purple-700"}`}
            data-testid="tab-breaktimer"
          >
            <Timer className="w-4 h-4 mr-2" />
            {t('tabs.breakTimer')}
          </Button>
          <Button
            variant={activeTab === "fueltrack" ? "default" : "outline"}
            onClick={() => setActiveTab("fueltrack")}
            className={`touch-target ${activeTab === "fueltrack" ? "bg-yellow-600 hover:bg-yellow-700" : "border-yellow-300 text-yellow-700"}`}
            data-testid="tab-fueltrack"
          >
            <Fuel className="w-4 h-4 mr-2" />
            {t('tabs.fuelTracker')}
          </Button>
          <Button
            variant={activeTab === "forums" ? "default" : "outline"}
            onClick={() => setActiveTab("forums")}
            className={`touch-target ${activeTab === "forums" ? "bg-indigo-600 hover:bg-indigo-700" : "border-indigo-300 text-indigo-700"}`}
            data-testid="tab-forums"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {t('tabs.forums')}
          </Button>
          <Button
            variant={activeTab === "hazards" ? "default" : "outline"}
            onClick={() => setActiveTab("hazards")}
            className={`touch-target ${activeTab === "hazards" ? "bg-red-600 hover:bg-red-700" : "border-red-300 text-red-700"}`}
            data-testid="tab-hazards"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {t('tabs.hazards')}
          </Button>
          <Button
            variant={activeTab === "earnings" ? "default" : "outline"}
            onClick={() => setActiveTab("earnings")}
            className={`touch-target ${activeTab === "earnings" ? "bg-green-600 hover:bg-green-700" : "border-green-300 text-green-700"}`}
            data-testid="tab-earnings"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('tabs.earnings')}
          </Button>
        </div>

        {/* Onboarding Tutorial */}
        {showOnboarding && (
          <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />
        )}

        {/* Driver Spotlight - Shows on Dashboard tab */}
        {activeTab === "dashboard" && (
          <DriverSpotlight />
        )}

        {/* Weather Alerts Tab */}
        {activeTab === "weather" && (
          <WeatherAlerts />
        )}

        {/* Analytics Dashboard Tab */}
        {activeTab === "analytics" && (
          <AnalyticsDashboard />
        )}

        {/* Route Planner Tab */}
        {activeTab === "route" && (
          <RoutePlanner />
        )}

        {/* Voice Commands Tab */}
        {activeTab === "voice" && (
          <VoiceCommands />
        )}

        {/* Photo Reviews Tab */}
        {activeTab === "photos" && (
          <PhotoReviews />
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <InAppMessaging />
        )}

        {/* Community Board Tab */}
        {activeTab === "community" && (
          <CommunityBoard />
        )}

        {/* Referral System Tab */}
        {activeTab === "referral" && (
          <ReferralSystem />
        )}

        {/* Feedback Tab */}
        {activeTab === "feedback" && (
          <FeedbackForm />
        )}

        {/* Social Links Tab */}
        {activeTab === "connect" && (
          <SocialLinks />
        )}

        {/* Achievements/Gamification Tab */}
        {activeTab === "achievements" && (
          <Gamification />
        )}

        {/* Rewards Store Tab */}
        {activeTab === "rewards" && (
          <RewardsStore />
        )}

        {/* Maintenance Tracker Tab */}
        {activeTab === "maintenance" && (
          <MaintenanceTracker />
        )}

        {/* Mentor System Tab */}
        {activeTab === "mentors" && (
          <MentorSystem />
        )}

        {/* Truck Weight Tab */}
        {activeTab === "weight" && (
          <TruckWeight />
        )}

        {/* HOS Tracker Tab */}
        {activeTab === "hos" && (
          <HOSTracker />
        )}

        {/* QR Scanner Tab */}
        {activeTab === "qr" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-indigo-600" />
                  QR Code Scanner
                </CardTitle>
                <CardDescription>
                  Scan QR codes at truck stops or share your referral code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QRScanner 
                  referralCode={user?.referral_code || `TRUK${user?.email?.slice(0,4).toUpperCase() || 'USER'}`}
                  onScan={(result) => {
                    toast.success(`Scanned: ${result}`);
                    // Handle different QR code types
                    if (result.includes('ref=')) {
                      toast.info("Referral code detected!");
                    } else if (result.includes('spot=')) {
                      toast.info("Parking spot QR detected!");
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Smart Load Board Tab */}
        {activeTab === "smartloads" && (
          <SmartLoadBoard 
            driverEmail={user?.email} 
            driverLocation={null}
          />
        )}

        {/* Broker Credit Score Tab */}
        {activeTab === "brokerscore" && (
          <BrokerCreditScore />
        )}

        {/* Rate Comparison Tab */}
        {activeTab === "ratecompare" && (
          <RateComparison />
        )}

        {/* Load Profit Calculator Tab */}
        {activeTab === "profitcalc" && (
          <LoadProfitCalculator />
        )}

        {/* FMCSA Carrier Verification Tab */}
        {activeTab === "fmcsa" && (
          <CarrierVerification />
        )}

        {/* Pre-Trip Inspection Checklist Tab */}
        {activeTab === "pretrip" && (
          <PreTripChecklist />
        )}

        {/* Expense Tracker Tab */}
        {activeTab === "expenses" && (
          <ExpenseTracker />
        )}

        {/* Break Timer Tab */}
        {activeTab === "breaktimer" && (
          <BreakTimer />
        )}

        {/* Fuel Efficiency Tracker Tab */}
        {activeTab === "fueltrack" && (
          <FuelEfficiencyTracker />
        )}

        {/* Driver Forums Tab */}
        {activeTab === "forums" && (
          <DriverForums />
        )}

        {/* Hazard Alerts Tab */}
        {activeTab === "hazards" && (
          <HazardAlerts />
        )}

        {/* Earnings Dashboard Tab */}
        {activeTab === "earnings" && (
          <EarningsDashboard />
        )}

        {/* LIVE Updates Tab */}
        {activeTab === "live" && (
          <div className="space-y-6">
            {/* Live Header */}
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <CardTitle className="text-green-700">Real-Time Driver Reports</CardTitle>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    {liveSpots.filter(s => s.has_live_report).length} Live Updates
                  </Badge>
                </div>
                <CardDescription>Live parking availability reported by fellow drivers. Help the community by reporting what you see!</CardDescription>
              </CardHeader>
            </Card>

            {/* How It Works - Feature Explanation */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-700">How Live Availability Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Live Availability */}
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h4 className="font-bold text-slate-800">Live Availability</h4>
                    </div>
                    <ul className="text-sm text-slate-600 space-y-2">
                      <li>• Drivers tap:</li>
                      <li className="pl-3 flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>"Spots Available"</span>
                      </li>
                      <li className="pl-3 flex items-center gap-2">
                        <span className="text-red-500 font-bold">✕</span>
                        <span>"Full"</span>
                      </li>
                      <li>• Updates visible instantly</li>
                    </ul>
                  </div>

                  {/* Time-Stamped Accuracy */}
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h4 className="font-bold text-slate-800">Time-Stamped Accuracy</h4>
                    </div>
                    <ul className="text-sm text-slate-600 space-y-2">
                      <li>• "Last confirmed 8 minutes ago"</li>
                      <li>• Trust score per location</li>
                      <li>• Fresh data highlighted</li>
                    </ul>
                  </div>

                  {/* Driver Trust Score */}
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h4 className="font-bold text-slate-800">Driver Trust Score</h4>
                    </div>
                    <ul className="text-sm text-slate-600 space-y-2">
                      <li>• Reliable drivers' updates count more</li>
                      <li>• Reduces fake data</li>
                      <li>• Earn points for accuracy</li>
                    </ul>
                  </div>

                  {/* Smart Alerts */}
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h4 className="font-bold text-slate-800">Smart Alerts</h4>
                    </div>
                    <ul className="text-sm text-slate-600 space-y-2">
                      <li>• Notify when a spot opens nearby</li>
                      <li>• Geo-based push notifications</li>
                      <li>• Never miss parking again</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Top Contributors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {leaderboard.slice(0, 5).map((leader, i) => (
                      <div key={leader.email} className="flex items-center gap-2 min-w-fit">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200'}`}>
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium">{leader.driver_name}</span>
                        <Badge variant="outline" className="text-xs">{leader.total_reports} reports</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Spots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveSpots.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center">
                    <Radio className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600">No parking spots found</p>
                  </CardContent>
                </Card>
              ) : (
                liveSpots.map((spot) => (
                  <Card 
                    key={spot.id} 
                    className={`overflow-hidden ${spot.has_live_report ? 'border-green-300 bg-green-50/30' : ''}`}
                    data-testid={`live-spot-${spot.id}`}
                  >
                    {spot.has_live_report && (
                      <div className={`h-1 ${spot.live_report.freshness === 'fresh' ? 'bg-green-500' : spot.live_report.freshness === 'recent' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{spot.name}</CardTitle>
                          <CardDescription>{spot.city}, {spot.state}</CardDescription>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {spot.has_live_report ? (
                            <Badge className={`${spot.live_report.freshness === 'fresh' ? 'bg-green-500' : spot.live_report.freshness === 'recent' ? 'bg-amber-500' : 'bg-slate-500'} text-white`}>
                              <Radio className="w-3 h-3 mr-1" />
                              {spot.live_report.minutes_ago}m ago
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500">No recent report</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {spot.has_live_report ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-600">Reported Spaces</p>
                              <p className="text-3xl font-bold text-green-600">{spot.live_report.reported_spaces}</p>
                            </div>
                            <Badge className={`
                              ${spot.live_report.fill_rate === 'empty' ? 'bg-green-500' : 
                                spot.live_report.fill_rate === 'filling' ? 'bg-amber-500' : 
                                spot.live_report.fill_rate === 'almost_full' ? 'bg-orange-500' : 'bg-red-500'} text-white`}>
                              {spot.live_report.fill_rate.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          {spot.live_report.conditions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {spot.live_report.conditions.map((cond, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {cond.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <p className="text-xs text-slate-500">
                            Reported by {spot.live_report.reported_by}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-slate-500 mb-2">Official capacity: {spot.total_spaces} spaces</p>
                          <p className="text-xs text-slate-400">Be the first to report!</p>
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => openReportModal(spot)} 
                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                        data-testid={`report-btn-${spot.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Report What You See
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

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
                <div className="map-container rounded-lg overflow-hidden" data-testid="map-container">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={defaultCenter}
                      zoom={4}
                      options={{
                        styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
                        streetViewControl: false,
                        mapTypeControl: false
                      }}
                    >
                      {spots.map((spot) => (
                        <Marker
                          key={spot.id}
                          position={{ lat: spot.latitude, lng: spot.longitude }}
                          title={spot.name}
                          onClick={() => navigate(`/spot/${spot.id}`)}
                        />
                      ))}
                    </GoogleMap>
                  ) : (
                    <div className="bg-slate-800 flex items-center justify-center" style={mapContainerStyle}>
                      <p className="text-slate-400">Loading map...</p>
                    </div>
                  )}
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

        {/* Load Board Tab */}
        {activeTab === "loads" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-6 h-6 text-green-600" />
                      Load Board
                    </CardTitle>
                    <CardDescription>Find and accept loads to maximize your earnings</CardDescription>
                  </div>
                  <Badge className="bg-green-500 text-white">{loads.length} Available Loads</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-green-600">{loads.length}</p>
                    <p className="text-xs text-slate-600">Available Loads</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-2xl font-bold text-blue-600">
                      ${loads.length > 0 ? Math.round(loads.reduce((a, b) => a + b.rate, 0) / loads.length).toLocaleString() : 0}
                    </p>
                    <p className="text-xs text-slate-600">Avg Rate</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-2xl font-bold text-purple-600">
                      {loads.length > 0 ? Math.round(loads.reduce((a, b) => a + b.distance, 0) / loads.length) : 0}
                    </p>
                    <p className="text-xs text-slate-600">Avg Miles</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-2xl font-bold text-amber-600">
                      ${loads.length > 0 ? (loads.reduce((a, b) => a + (b.rate / b.distance), 0) / loads.length).toFixed(2) : '0.00'}
                    </p>
                    <p className="text-xs text-slate-600">Avg $/Mile</p>
                  </div>
                </div>

                {/* Load List */}
                <div className="space-y-4">
                  {loads.length === 0 ? (
                    <div className="text-center py-8">
                      <Truck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-500">No loads available right now. Check back soon!</p>
                    </div>
                  ) : (
                    loads.map((load) => (
                      <Card key={load.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500" data-testid={`load-${load.id}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">{load.equipment_type}</Badge>
                                <Badge className={load.status === 'available' ? 'bg-green-500' : 'bg-slate-500'}>
                                  {load.status}
                                </Badge>
                              </div>
                              <h4 className="font-bold text-lg">
                                {load.origin_city}, {load.origin_state} 
                                <ArrowRight className="w-4 h-4 inline mx-2" />
                                {load.destination_city}, {load.destination_state}
                              </h4>
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {load.distance} miles
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Pickup: {new Date(load.pickup_date).toLocaleDateString()}
                                </span>
                                <span>Weight: {load.weight?.toLocaleString() || 'N/A'} lbs</span>
                              </div>
                              <p className="text-sm text-slate-500 mt-1">
                                Contact: {load.contact_name} • {load.contact_phone}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-black text-green-600">${load.rate.toLocaleString()}</p>
                              <p className="text-sm text-slate-600">${(load.rate / load.distance).toFixed(2)}/mile</p>
                              <div className="flex gap-2 mt-3">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setActiveTab("calculator");
                                    calculateTripProfit(load.id);
                                  }}
                                >
                                  <Calculator className="w-4 h-4 mr-1" />
                                  Calculate
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    toast.success(`Load accepted! Contact ${load.contact_name} at ${load.contact_phone}`);
                                  }}
                                  data-testid={`accept-load-${load.id}`}
                                >
                                  Accept Load
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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

        {/* Emergency SOS Tab */}
        {activeTab === "emergency" && (
          <div className="space-y-6">
            {/* SOS Button */}
            <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30">
              <CardContent className="p-6 text-center">
                <Button 
                  onClick={() => setShowSOSModal(true)}
                  className="w-48 h-48 rounded-full bg-red-600 hover:bg-red-700 text-white text-2xl font-bold shadow-lg animate-pulse"
                >
                  <div className="flex flex-col items-center">
                    <Phone className="w-16 h-16 mb-2" />
                    <span>SOS</span>
                    <span className="text-sm font-normal">Tap for Emergency</span>
                  </div>
                </Button>
                <p className="mt-4 text-slate-600">Press the SOS button to alert your emergency contacts and get help</p>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Emergency Contacts
                  </CardTitle>
                  <Button onClick={() => setShowAddContactModal(true)} size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Contact
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {emergencyContacts.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">No emergency contacts. Add one now!</p>
                ) : (
                  <div className="space-y-3">
                    {emergencyContacts.map(contact => (
                      <div key={contact.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-semibold">{contact.name}</p>
                          <p className="text-sm text-slate-500">{contact.phone} • {contact.relationship}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {contact.is_primary && <Badge className="bg-green-500">Primary</Badge>}
                          <Button variant="ghost" size="sm" onClick={() => deleteEmergencyContact(contact.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Numbers */}
            <Card>
              <CardHeader>
                <CardTitle>Important Numbers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-600">911</p>
                    <p className="text-sm text-slate-600">Emergency Services</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-blue-600">1-800-TRUCKERS</p>
                    <p className="text-sm text-slate-600">Roadside Assistance</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-green-600">FMCSA Hotline</p>
                    <p className="text-sm text-slate-600">1-888-368-7238</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Document Scanner
                    </CardTitle>
                    <CardDescription>Scan and organize BOLs, receipts, and paperwork</CardDescription>
                  </div>
                  <Button onClick={() => setShowDocModal(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Camera className="w-4 h-4 mr-2" /> New Document
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Document Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { type: "bol", label: "Bills of Lading", icon: "📄", color: "bg-blue-50 border-blue-200" },
                { type: "receipt", label: "Receipts", icon: "🧾", color: "bg-green-50 border-green-200" },
                { type: "lumper", label: "Lumper Receipts", icon: "📦", color: "bg-purple-50 border-purple-200" },
                { type: "scale_ticket", label: "Scale Tickets", icon: "⚖️", color: "bg-amber-50 border-amber-200" }
              ].map(cat => (
                <Card key={cat.type} className={`${cat.color} cursor-pointer hover:shadow-md`}>
                  <CardContent className="p-4 text-center">
                    <span className="text-3xl">{cat.icon}</span>
                    <p className="font-semibold mt-2">{cat.label}</p>
                    <p className="text-sm text-slate-500">{documents.filter(d => d.doc_type === cat.type).length} docs</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No documents yet. Scan your first document!</p>
                ) : (
                  <div className="space-y-3">
                    {documents.slice(0, 10).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FolderOpen className="w-8 h-8 text-blue-500" />
                          <div>
                            <p className="font-semibold">{doc.title}</p>
                            <p className="text-xs text-slate-500">{doc.doc_type.toUpperCase()} • {new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => downloadDocument(doc)} title="Download">
                            <Download className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc.id)} title="Delete">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fuel Prices Tab */}
        {activeTab === "fuel" && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Fuel className="w-5 h-5 text-amber-600" />
                      Fuel Price Tracker
                    </CardTitle>
                    <CardDescription>Find the cheapest diesel prices & earn points for reporting</CardDescription>
                  </div>
                  <Button onClick={() => setShowFuelReportModal(true)} className="bg-amber-600 hover:bg-amber-700">
                    <Plus className="w-4 h-4 mr-2" /> Report Price
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* State Averages */}
            {fuelAverages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>State Averages (Diesel)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {fuelAverages.slice(0, 10).map(avg => (
                      <Badge key={avg.state} variant="outline" className="px-3 py-1">
                        <span className="font-bold">{avg.state}</span>
                        <span className="ml-2 text-green-600">${avg.avg_diesel?.toFixed(2) || 'N/A'}</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cheapest Prices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Cheapest Diesel Prices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fuelPrices.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No fuel prices reported yet. Be the first!</p>
                ) : (
                  <div className="space-y-3">
                    {fuelPrices.map((price, i) => (
                      <div key={price.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-green-400' : i === 2 ? 'bg-green-300' : 'bg-slate-300'}`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-semibold">{price.station_name}</p>
                            <p className="text-xs text-slate-500">{price.city}, {price.state} • {price.chain}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">${price.diesel_price?.toFixed(3)}</p>
                          <p className="text-xs text-slate-500">per gallon</p>
                        </div>
                      </div>
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

      {/* Report Parking Modal */}
      {showReportModal && selectedSpotForReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="bg-green-50 border-b border-green-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <CardTitle className="text-green-700">Report Live Availability</CardTitle>
              </div>
              <CardDescription>{selectedSpotForReport.name} - {selectedSpotForReport.city}, {selectedSpotForReport.state}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Spaces Available */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  How many spaces do you see available?
                </label>
                <div className="flex items-center gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setReportData(prev => ({ ...prev, reported_spaces: Math.max(0, prev.reported_spaces - 1) }))}
                    className="h-12 w-12"
                  >-</Button>
                  <span className="text-4xl font-bold text-green-600 min-w-[80px] text-center">{reportData.reported_spaces}</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setReportData(prev => ({ ...prev, reported_spaces: prev.reported_spaces + 1 }))}
                    className="h-12 w-12"
                  >+</Button>
                </div>
              </div>

              {/* Fill Rate */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Overall fill status
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: "empty", label: "Empty", color: "bg-green-500" },
                    { value: "filling", label: "Filling", color: "bg-amber-500" },
                    { value: "almost_full", label: "Almost Full", color: "bg-orange-500" },
                    { value: "full", label: "Full", color: "bg-red-500" }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setReportData(prev => ({ ...prev, fill_rate: opt.value }))}
                      className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                        reportData.fill_rate === opt.value 
                          ? `${opt.color} text-white border-transparent` 
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What conditions did you notice? (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "well_lit", label: "Well Lit" },
                    { value: "clean", label: "Clean" },
                    { value: "security_present", label: "Security Present" },
                    { value: "crowded", label: "Crowded" },
                    { value: "dark", label: "Dark" },
                    { value: "sketchy", label: "Sketchy" },
                    { value: "truck_friendly", label: "Truck Friendly" },
                    { value: "easy_access", label: "Easy Access" }
                  ].map(cond => (
                    <button
                      key={cond.value}
                      type="button"
                      onClick={() => toggleCondition(cond.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        reportData.conditions.includes(cond.value)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-slate-300 hover:border-blue-500'
                      }`}
                    >
                      {cond.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional notes (optional)
                </label>
                <Textarea
                  value={reportData.notes}
                  onChange={(e) => setReportData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g., Construction near entrance, good fuel prices, busy but moving..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Points Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">Earn up to 50+ points for detailed reports!</span>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowReportModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitParkingReport}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SOS Emergency Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSOSModal(false)}>
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="bg-red-50 border-b border-red-200">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Emergency SOS
              </CardTitle>
              <CardDescription>Select the type of emergency</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                { type: "medical", label: "Medical Emergency", icon: "🏥", color: "bg-red-500" },
                { type: "accident", label: "Accident", icon: "💥", color: "bg-orange-500" },
                { type: "breakdown", label: "Vehicle Breakdown", icon: "🚛", color: "bg-amber-500" },
                { type: "threat", label: "Safety Threat", icon: "⚠️", color: "bg-purple-500" },
                { type: "other", label: "Other Emergency", icon: "🆘", color: "bg-slate-500" }
              ].map(sos => (
                <Button 
                  key={sos.type}
                  onClick={() => sendSOS(sos.type)}
                  className={`w-full h-14 ${sos.color} hover:opacity-90 text-white text-lg justify-start`}
                >
                  <span className="text-2xl mr-3">{sos.icon}</span>
                  {sos.label}
                </Button>
              ))}
              <Button variant="outline" onClick={() => setShowSOSModal(false)} className="w-full mt-4">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Emergency Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddContactModal(false)}>
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Add Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input value={newContact.name} onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))} placeholder="Contact name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input value={newContact.phone} onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))} placeholder="+1-555-123-4567" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Relationship</label>
                <select 
                  value={newContact.relationship} 
                  onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="spouse">Spouse</option>
                  <option value="family">Family</option>
                  <option value="friend">Friend</option>
                  <option value="employer">Employer/Dispatch</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowAddContactModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={addEmergencyContact} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Add Contact</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDocModal(false)}>
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                New Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Document Type</label>
                <select 
                  value={newDoc.doc_type} 
                  onChange={(e) => setNewDoc(prev => ({ ...prev, doc_type: e.target.value }))}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="bol">Bill of Lading (BOL)</option>
                  <option value="receipt">Receipt</option>
                  <option value="lumper">Lumper Receipt</option>
                  <option value="scale_ticket">Scale Ticket</option>
                  <option value="delivery_receipt">Delivery Receipt</option>
                  <option value="inspection">Inspection Report</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input value={newDoc.title} onChange={(e) => setNewDoc(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., BOL #12345 - Dallas to Atlanta" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <Textarea value={newDoc.notes} onChange={(e) => setNewDoc(prev => ({ ...prev, notes: e.target.value }))} placeholder="Any additional notes..." />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
                <Camera className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-slate-600">Camera capture coming soon!</p>
                <p className="text-xs text-slate-400">For now, documents are saved as records</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowDocModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={saveDocument} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Save Document</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Fuel Price Modal */}
      {showFuelReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFuelReportModal(false)}>
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="bg-amber-50 border-b border-amber-200">
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <Fuel className="w-5 h-5" />
                Report Fuel Price
              </CardTitle>
              <CardDescription>Help fellow drivers find cheap fuel (+15 points)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Station Name</label>
                <Input value={newFuelReport.station_name} onChange={(e) => setNewFuelReport(prev => ({ ...prev, station_name: e.target.value }))} placeholder="e.g., Pilot Flying J" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chain</label>
                <select 
                  value={newFuelReport.chain} 
                  onChange={(e) => setNewFuelReport(prev => ({ ...prev, chain: e.target.value }))}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="pilot">Pilot Flying J</option>
                  <option value="loves">Love's</option>
                  <option value="ta_petro">TA/Petro</option>
                  <option value="speedway">Speedway</option>
                  <option value="independent">Independent</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <Input value={newFuelReport.city} onChange={(e) => setNewFuelReport(prev => ({ ...prev, city: e.target.value }))} placeholder="Dallas" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <Input value={newFuelReport.state} onChange={(e) => setNewFuelReport(prev => ({ ...prev, state: e.target.value }))} placeholder="TX" maxLength={2} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diesel Price (per gallon)</label>
                <Input 
                  type="number" 
                  step="0.001"
                  value={newFuelReport.diesel_price} 
                  onChange={(e) => setNewFuelReport(prev => ({ ...prev, diesel_price: e.target.value }))} 
                  placeholder="3.459" 
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowFuelReportModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={reportFuelPrice} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">Submit Price</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
