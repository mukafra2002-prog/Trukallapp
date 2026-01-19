import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Search, TrendingUp, MapPin, DollarSign, Truck, Bell, 
  Filter, ArrowRight, Star, AlertTriangle, Fuel, Navigation,
  CheckCircle, XCircle, Clock, Target
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function SmartLoadBoard({ driverEmail, driverLocation }) {
  const [activeTab, setActiveTab] = useState('search');
  const [loads, setLoads] = useState([]);
  const [laneRates, setLaneRates] = useState([]);
  const [matchedLoads, setMatchedLoads] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Search filters
  const [filters, setFilters] = useState({
    origin_city: '',
    destination_city: '',
    equipment_type: '',
    min_rate: '',
    min_rate_per_mile: '',
    max_deadhead: '100'
  });
  
  // Alert settings
  const [alertConfig, setAlertConfig] = useState({
    origin_states: [],
    destination_states: [],
    equipment_types: [],
    min_rate: '',
    min_rate_per_mile: ''
  });
  const [alertMatches, setAlertMatches] = useState([]);

  useEffect(() => {
    fetchLaneRates();
    if (driverLocation) {
      fetchSmartMatches();
    }
    fetchAlertConfig();
  }, [driverLocation]);

  const fetchLaneRates = async () => {
    try {
      const response = await axios.get(`${API}/loads/lane-rates`);
      setLaneRates(response.data || []);
    } catch (error) {
      console.error('Failed to fetch lane rates', error);
    }
  };

  const fetchSmartMatches = async () => {
    if (!driverLocation?.lat || !driverLocation?.lng) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        driver_lat: driverLocation.lat,
        driver_lng: driverLocation.lng,
        max_deadhead_miles: filters.max_deadhead || 100
      });
      if (filters.equipment_type) params.append('equipment_type', filters.equipment_type);
      if (filters.min_rate) params.append('min_rate', filters.min_rate);
      if (filters.min_rate_per_mile) params.append('min_rate_per_mile', filters.min_rate_per_mile);
      
      const response = await axios.get(`${API}/loads/smart-match?${params}`);
      setMatchedLoads(response.data || []);
    } catch (error) {
      console.error('Failed to fetch smart matches', error);
    } finally {
      setLoading(false);
    }
  };

  const searchLoads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.origin_city) params.append('origin_city', filters.origin_city);
      if (filters.destination_city) params.append('destination_city', filters.destination_city);
      if (filters.equipment_type) params.append('equipment_type', filters.equipment_type);
      if (filters.min_rate) params.append('min_rate', filters.min_rate);
      if (filters.min_rate_per_mile) params.append('min_rate_per_mile', filters.min_rate_per_mile);
      
      const response = await axios.get(`${API}/loads/search?${params}`);
      setLoads(response.data?.loads || []);
      toast.success(`Found ${response.data?.total || 0} loads`);
    } catch (error) {
      toast.error('Failed to search loads');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertConfig = async () => {
    try {
      const response = await axios.get(`${API}/loads/alerts/${driverEmail}`);
      if (response.data?.active) {
        setAlertConfig(response.data);
        // Fetch matches
        const matchesRes = await axios.get(`${API}/loads/alerts/matches/${driverEmail}`);
        setAlertMatches(matchesRes.data?.matches || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    }
  };

  const saveAlertConfig = async () => {
    try {
      const params = new URLSearchParams({ driver_email: driverEmail });
      if (alertConfig.min_rate) params.append('min_rate', alertConfig.min_rate);
      if (alertConfig.min_rate_per_mile) params.append('min_rate_per_mile', alertConfig.min_rate_per_mile);
      
      await axios.post(`${API}/loads/alerts/subscribe?${params}`);
      toast.success('Load alerts saved!');
      fetchAlertConfig();
    } catch (error) {
      toast.error('Failed to save alerts');
    }
  };

  const getRateColor = (ratePerMile) => {
    if (ratePerMile >= 3) return 'text-green-600 bg-green-100';
    if (ratePerMile >= 2.5) return 'text-blue-600 bg-blue-100';
    if (ratePerMile >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'search', label: 'Search Loads', icon: Search },
          { id: 'smart', label: 'Smart Match', icon: Target },
          { id: 'rates', label: 'Lane Rates', icon: TrendingUp },
          { id: 'alerts', label: 'Load Alerts', icon: Bell }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'bg-blue-600' : ''}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* SEARCH TAB */}
      {activeTab === 'search' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Advanced Load Search
            </CardTitle>
            <CardDescription>Search with multiple filters like DAT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Input
                placeholder="Origin City"
                value={filters.origin_city}
                onChange={(e) => setFilters({...filters, origin_city: e.target.value})}
              />
              <Input
                placeholder="Destination City"
                value={filters.destination_city}
                onChange={(e) => setFilters({...filters, destination_city: e.target.value})}
              />
              <Select value={filters.equipment_type} onValueChange={(v) => setFilters({...filters, equipment_type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="reefer">Reefer</SelectItem>
                  <SelectItem value="flatbed">Flatbed</SelectItem>
                  <SelectItem value="stepdeck">Step Deck</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Min Rate ($)"
                type="number"
                value={filters.min_rate}
                onChange={(e) => setFilters({...filters, min_rate: e.target.value})}
              />
              <Input
                placeholder="Min $/mile"
                type="number"
                step="0.1"
                value={filters.min_rate_per_mile}
                onChange={(e) => setFilters({...filters, min_rate_per_mile: e.target.value})}
              />
              <Button onClick={searchLoads} disabled={loading} className="bg-blue-600">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            {/* Results */}
            <div className="space-y-3 mt-4">
              {loads.map((load, idx) => (
                <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-lg">
                        <MapPin className="w-4 h-4 text-green-600" />
                        {load.origin || `${load.origin_city}, ${load.origin_state}`}
                        <ArrowRight className="w-4 h-4" />
                        <MapPin className="w-4 h-4 text-red-600" />
                        {load.destination || `${load.destination_city}, ${load.destination_state}`}
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span><Truck className="w-4 h-4 inline mr-1" />{load.equipment_type || load.equipment || 'Van'}</span>
                        <span>{load.miles || load.distance || 0} miles</span>
                        <span>{load.weight?.toLocaleString() || 0} lbs</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">${load.rate?.toLocaleString()}</div>
                      <Badge className={getRateColor(load.rate_per_mile)}>
                        ${load.rate_per_mile}/mi
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {loads.length === 0 && !loading && (
                <p className="text-center text-gray-500 py-8">Enter filters and click Search to find loads</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SMART MATCH TAB */}
      {activeTab === 'smart' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Smart Load Matching
            </CardTitle>
            <CardDescription>Loads matched to your current location - lowest deadhead first</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4">
              <Input
                placeholder="Max Deadhead Miles"
                type="number"
                value={filters.max_deadhead}
                onChange={(e) => setFilters({...filters, max_deadhead: e.target.value})}
                className="w-40"
              />
              <Button onClick={fetchSmartMatches} disabled={loading || !driverLocation} className="bg-purple-600">
                <Navigation className="w-4 h-4 mr-2" />
                Find Matches
              </Button>
            </div>

            {!driverLocation && (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Enable location to use Smart Matching</p>
              </div>
            )}

            <div className="space-y-3">
              {matchedLoads.map((load, idx) => (
                <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-gradient-to-r from-purple-50 to-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-600">Match Score: {load.match_score}</Badge>
                        <Badge variant="outline" className="text-orange-600">
                          {load.deadhead_miles} mi deadhead
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 font-semibold text-lg mt-2">
                        {load.origin || `${load.origin_city}, ${load.origin_state}`}
                        <ArrowRight className="w-4 h-4" />
                        {load.destination || `${load.destination_city}, ${load.destination_state}`}
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        <span>{load.equipment_type || load.equipment || 'Van'}</span>
                        <span>{load.miles || load.distance || 0} miles</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">${load.rate?.toLocaleString()}</div>
                      <Badge className={getRateColor(load.rate_per_mile)}>
                        ${load.rate_per_mile}/mi
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* LANE RATES TAB */}
      {activeTab === 'rates' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Market Lane Rates
            </CardTitle>
            <CardDescription>Average rates per lane - use for negotiation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Lane</th>
                    <th className="text-right p-2">Avg Rate</th>
                    <th className="text-right p-2">$/Mile</th>
                    <th className="text-right p-2">Range</th>
                    <th className="text-right p-2">Loads</th>
                  </tr>
                </thead>
                <tbody>
                  {laneRates.map((lane, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="font-semibold">{lane.origin}</div>
                        <div className="text-sm text-gray-500">→ {lane.destination}</div>
                      </td>
                      <td className="text-right p-2 font-bold text-green-600">
                        ${lane.avg_rate?.toLocaleString()}
                      </td>
                      <td className="text-right p-2">
                        <Badge className={getRateColor(lane.avg_rate_per_mile)}>
                          ${lane.avg_rate_per_mile}/mi
                        </Badge>
                      </td>
                      <td className="text-right p-2 text-sm text-gray-600">
                        ${lane.min_rate} - ${lane.max_rate}
                      </td>
                      <td className="text-right p-2">
                        <Badge variant="outline">{lane.load_count}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ALERTS TAB */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" />
                Load Alert Settings
              </CardTitle>
              <CardDescription>Get notified when matching loads are posted</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Min Rate ($)</label>
                  <Input
                    type="number"
                    value={alertConfig.min_rate || ''}
                    onChange={(e) => setAlertConfig({...alertConfig, min_rate: e.target.value})}
                    placeholder="e.g., 1500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Min Rate Per Mile ($)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={alertConfig.min_rate_per_mile || ''}
                    onChange={(e) => setAlertConfig({...alertConfig, min_rate_per_mile: e.target.value})}
                    placeholder="e.g., 2.50"
                  />
                </div>
              </div>
              <Button onClick={saveAlertConfig} className="bg-orange-600">
                <Bell className="w-4 h-4 mr-2" />
                Save Alert Settings
              </Button>
            </CardContent>
          </Card>

          {alertMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Matching Loads ({alertMatches.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alertMatches.map((load, idx) => (
                    <div key={idx} className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-semibold">
                          {load.origin || `${load.origin_city}, ${load.origin_state}`} → {load.destination || `${load.destination_city}, ${load.destination_state}`}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">{load.miles || load.distance} mi</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-green-600">${load.rate?.toLocaleString()}</span>
                        <Badge className="ml-2">${load.rate_per_mile}/mi</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
