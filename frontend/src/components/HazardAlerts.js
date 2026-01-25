import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AuthContext, API } from '@/App';
import axios from 'axios';
import { 
  AlertTriangle, Plus, MapPin, Clock, ThumbsUp, 
  Construction, CloudRain, Car, Truck, AlertOctagon,
  CheckCircle, X, Navigation, RefreshCw
} from 'lucide-react';

const HAZARD_TYPES = [
  { id: 'accident', label: 'Accident', icon: Car, color: 'bg-red-500', emoji: '🚗💥' },
  { id: 'construction', label: 'Construction', icon: Construction, color: 'bg-orange-500', emoji: '🚧' },
  { id: 'weather', label: 'Weather Hazard', icon: CloudRain, color: 'bg-blue-500', emoji: '🌧️' },
  { id: 'road_closure', label: 'Road Closure', icon: X, color: 'bg-purple-500', emoji: '🚫' },
  { id: 'debris', label: 'Debris/Obstacle', icon: AlertOctagon, color: 'bg-yellow-500', emoji: '⚠️' },
  { id: 'traffic', label: 'Heavy Traffic', icon: Truck, color: 'bg-gray-500', emoji: '🚛' },
  { id: 'police', label: 'Police Activity', icon: AlertTriangle, color: 'bg-indigo-500', emoji: '👮' },
  { id: 'other', label: 'Other Hazard', icon: AlertTriangle, color: 'bg-gray-600', emoji: '❗' },
];

export default function HazardAlerts() {
  const { user } = useContext(AuthContext);
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddHazard, setShowAddHazard] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [newHazard, setNewHazard] = useState({
    type: 'accident',
    location: '',
    highway: '',
    direction: 'both',
    description: '',
    severity: 'moderate'
  });

  useEffect(() => {
    fetchHazards();
    // Refresh every 2 minutes
    const interval = setInterval(fetchHazards, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchHazards = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/hazards`);
      setHazards(response.data || []);
    } catch (error) {
      // Use demo data if API not available
      setHazards(getDemoHazards());
    } finally {
      setLoading(false);
    }
  };

  const getDemoHazards = () => [
    {
      id: '1',
      type: 'accident',
      location: 'I-40 Mile Marker 287',
      highway: 'I-40',
      direction: 'eastbound',
      description: 'Multi-vehicle accident blocking right lane. Expect 30+ min delays.',
      severity: 'severe',
      reporter: 'TruckerMike',
      reported_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      confirmations: 12,
      active: true
    },
    {
      id: '2',
      type: 'construction',
      location: 'I-95 Exit 42-48',
      highway: 'I-95',
      direction: 'both',
      description: 'Lane closures for road work. Speed limit reduced to 45 mph.',
      severity: 'moderate',
      reporter: 'RoadRunner',
      reported_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      confirmations: 34,
      active: true
    },
    {
      id: '3',
      type: 'weather',
      location: 'I-70 Colorado Mountains',
      highway: 'I-70',
      direction: 'westbound',
      description: 'Heavy snow and icy conditions. Chain law in effect.',
      severity: 'severe',
      reporter: 'MountainMan',
      reported_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      confirmations: 28,
      active: true
    },
    {
      id: '4',
      type: 'debris',
      location: 'I-10 near Phoenix, AZ',
      highway: 'I-10',
      direction: 'westbound',
      description: 'Tire debris in center lane. Drive carefully.',
      severity: 'minor',
      reporter: 'DesertDriver',
      reported_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      confirmations: 5,
      active: true
    },
    {
      id: '5',
      type: 'traffic',
      location: 'I-405 Los Angeles',
      highway: 'I-405',
      direction: 'northbound',
      description: 'Rush hour backup. Standstill traffic from Exit 25 to 32.',
      severity: 'moderate',
      reporter: 'LAHauler',
      reported_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      confirmations: 45,
      active: true
    }
  ];

  const reportHazard = async () => {
    if (!newHazard.location || !newHazard.highway) {
      toast.error('Please enter location and highway');
      return;
    }

    const hazard = {
      id: Date.now().toString(),
      ...newHazard,
      reporter: user?.name || 'Anonymous',
      reported_at: new Date().toISOString(),
      confirmations: 1,
      active: true
    };

    try {
      await axios.post(`${API}/hazards`, hazard);
      toast.success('Hazard reported! Thank you for keeping drivers safe.');
    } catch {
      // Save locally if API fails
      const saved = JSON.parse(localStorage.getItem('trukall_hazards') || '[]');
      localStorage.setItem('trukall_hazards', JSON.stringify([hazard, ...saved]));
      toast.success('Hazard reported (saved locally)');
    }

    setHazards([hazard, ...hazards]);
    setNewHazard({
      type: 'accident',
      location: '',
      highway: '',
      direction: 'both',
      description: '',
      severity: 'moderate'
    });
    setShowAddHazard(false);
  };

  const confirmHazard = (hazardId) => {
    setHazards(hazards.map(h => 
      h.id === hazardId ? { ...h, confirmations: h.confirmations + 1 } : h
    ));
    toast.success('Thanks for confirming!');
  };

  const clearHazard = (hazardId) => {
    setHazards(hazards.map(h => 
      h.id === hazardId ? { ...h, active: false } : h
    ));
    toast.success('Marked as cleared');
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins} min ago`;
    return `${diffHours}h ago`;
  };

  const getHazardInfo = (type) => {
    return HAZARD_TYPES.find(h => h.id === type) || HAZARD_TYPES[7];
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-700 border-red-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'minor': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredHazards = hazards.filter(h => {
    if (!h.active) return false;
    if (filterType === 'all') return true;
    return h.type === filterType;
  });

  const activeCount = hazards.filter(h => h.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Road Hazard Alerts
              </CardTitle>
              <CardDescription>
                Real-time hazard reports from fellow drivers. Stay safe on the road.
              </CardDescription>
            </div>
            <Badge className="bg-red-500 text-white text-lg px-3 py-1">
              {activeCount} Active
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => setShowAddHazard(!showAddHazard)} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Report Hazard
        </Button>
        <Button variant="outline" onClick={fetchHazards}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('all')}
          className={filterType === 'all' ? 'bg-gray-800' : ''}
        >
          All Hazards
        </Button>
        {HAZARD_TYPES.map(type => (
          <Button
            key={type.id}
            variant={filterType === type.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType(type.id)}
            className={filterType === type.id ? type.color : ''}
          >
            {type.emoji}
          </Button>
        ))}
      </div>

      {/* Report Hazard Form */}
      {showAddHazard && (
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-lg">Report a Hazard</CardTitle>
            <CardDescription>Help fellow drivers stay safe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hazard Type */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Hazard Type</label>
              <div className="grid grid-cols-4 gap-2">
                {HAZARD_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.id}
                      variant={newHazard.type === type.id ? 'default' : 'outline'}
                      className={`flex flex-col h-auto py-2 ${newHazard.type === type.id ? type.color : ''}`}
                      onClick={() => setNewHazard({...newHazard, type: type.id})}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Highway/Interstate</label>
                <Input
                  placeholder="e.g., I-40, US-101"
                  value={newHazard.highway}
                  onChange={(e) => setNewHazard({...newHazard, highway: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Direction</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={newHazard.direction}
                  onChange={(e) => setNewHazard({...newHazard, direction: e.target.value})}
                >
                  <option value="both">Both Directions</option>
                  <option value="eastbound">Eastbound</option>
                  <option value="westbound">Westbound</option>
                  <option value="northbound">Northbound</option>
                  <option value="southbound">Southbound</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Location (Mile Marker, Exit, City)</label>
              <Input
                placeholder="e.g., Mile Marker 287, near Exit 42, Dallas TX"
                value={newHazard.location}
                onChange={(e) => setNewHazard({...newHazard, location: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Severity</label>
              <div className="flex gap-2">
                {['minor', 'moderate', 'severe'].map(sev => (
                  <Button
                    key={sev}
                    variant={newHazard.severity === sev ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewHazard({...newHazard, severity: sev})}
                    className={newHazard.severity === sev ? (
                      sev === 'severe' ? 'bg-red-500' : sev === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'
                    ) : ''}
                  >
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Description</label>
              <Textarea
                placeholder="Describe the hazard, expected delays, alternate routes..."
                value={newHazard.description}
                onChange={(e) => setNewHazard({...newHazard, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={reportHazard} className="flex-1 bg-red-600 hover:bg-red-700">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Submit Report
              </Button>
              <Button variant="outline" onClick={() => setShowAddHazard(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hazard List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading hazard reports...</div>
        ) : filteredHazards.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p className="text-gray-600 font-medium">No active hazards reported</p>
              <p className="text-gray-400 text-sm">Roads are looking clear!</p>
            </CardContent>
          </Card>
        ) : (
          filteredHazards.map(hazard => {
            const hazardInfo = getHazardInfo(hazard.type);
            const Icon = hazardInfo.icon;
            
            return (
              <Card 
                key={hazard.id}
                className={`border-l-4 ${
                  hazard.severity === 'severe' ? 'border-l-red-500 bg-red-50/50' :
                  hazard.severity === 'moderate' ? 'border-l-yellow-500 bg-yellow-50/50' :
                  'border-l-green-500 bg-green-50/50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${hazardInfo.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={hazardInfo.color}>{hazardInfo.label}</Badge>
                        <Badge className={getSeverityColor(hazard.severity)}>
                          {hazard.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {getTimeAgo(hazard.reported_at)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg">
                        {hazard.highway} - {hazard.direction}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                        <MapPin className="w-4 h-4" />
                        {hazard.location}
                      </p>
                      <p className="text-gray-700">{hazard.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => confirmHazard(hazard.id)}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Confirm ({hazard.confirmations})
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => clearHazard(hazard.id)}
                          className="text-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Cleared
                        </Button>
                        <span className="text-xs text-gray-400">
                          Reported by {hazard.reporter}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Safety Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-700 mb-2">🛡️ Safety Reminder</h4>
          <p className="text-sm text-blue-600">
            Always report hazards after you've safely stopped. Never use your phone while driving.
            If you see a hazard, slow down, stay alert, and report it when safe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
