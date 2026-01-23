import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Search, Shield, CheckCircle, XCircle, AlertTriangle,
  Truck, MapPin, Phone, Building2, FileCheck, AlertOctagon,
  Activity, Users, Gauge
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function CarrierVerification() {
  const [searchType, setSearchType] = useState('dot');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [carrierData, setCarrierData] = useState(null);
  const [safetyData, setSafetyData] = useState(null);

  const searchCarrier = async () => {
    if (!searchValue.trim()) {
      toast.error('Enter a DOT number or carrier name');
      return;
    }

    setLoading(true);
    setCarrierData(null);
    setSafetyData(null);

    try {
      let response;
      if (searchType === 'dot') {
        // Direct DOT lookup
        response = await axios.get(`${API}/fmcsa/carrier/${searchValue}`);
        setCarrierData(response.data);

        // Also get safety data
        const safetyResponse = await axios.get(`${API}/fmcsa/carrier/${searchValue}/safety`);
        setSafetyData(safetyResponse.data);
      } else {
        // Search by name
        response = await axios.get(`${API}/fmcsa/search?name=${encodeURIComponent(searchValue)}`);
        if (response.data.results && response.data.results.length > 0) {
          setCarrierData({
            ...response.data,
            search_results: response.data.results
          });
        } else {
          toast.error('No carriers found with that name');
        }
      }
    } catch (error) {
      toast.error('Failed to verify carrier');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectCarrier = async (dotNumber) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/fmcsa/carrier/${dotNumber}`);
      setCarrierData(response.data);

      const safetyResponse = await axios.get(`${API}/fmcsa/carrier/${dotNumber}/safety`);
      setSafetyData(safetyResponse.data);
    } catch (error) {
      toast.error('Failed to get carrier details');
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (percentile) => {
    if (percentile < 25) return 'bg-green-500';
    if (percentile < 50) return 'bg-yellow-500';
    if (percentile < 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSafetyTextColor = (percentile) => {
    if (percentile < 25) return 'text-green-600';
    if (percentile < 50) return 'text-yellow-600';
    if (percentile < 75) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            FMCSA Carrier Verification
          </CardTitle>
          <CardDescription>
            Verify carrier/broker licenses using official FMCSA database - FREE real-time data
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Carrier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={searchType} onValueChange={setSearchType}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dot">By DOT Number</TabsTrigger>
              <TabsTrigger value="name">By Name</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-3">
            <Input
              placeholder={searchType === 'dot' ? 'Enter USDOT number (e.g., 1234567)' : 'Enter carrier name'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCarrier()}
              className="flex-1"
            />
            <Button onClick={searchCarrier} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Verify
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results (Name Search) */}
      {carrierData?.search_results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Search Results ({carrierData.total_found} found)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {carrierData.search_results.map((carrier, idx) => (
                <div 
                  key={idx} 
                  className="p-3 bg-gray-50 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-100"
                  onClick={() => selectCarrier(carrier.dot_number)}
                >
                  <div>
                    <p className="font-medium">{carrier.legal_name}</p>
                    <p className="text-sm text-gray-500">
                      DOT: {carrier.dot_number} | {carrier.city}, {carrier.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {carrier.allow_to_operate === 'Y' ? (
                      <Badge className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge className="bg-red-600">Inactive</Badge>
                    )}
                    <Button size="sm" variant="outline">View</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Carrier Details */}
      {carrierData?.legal_name && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                {carrierData.legal_name}
              </CardTitle>
              {carrierData.is_authorized ? (
                <Badge className="bg-green-600 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Authorized
                </Badge>
              ) : (
                <Badge className="bg-red-600 text-white">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Authorized
                </Badge>
              )}
            </div>
            {carrierData.dba_name && (
              <CardDescription>DBA: {carrierData.dba_name}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">USDOT Number</p>
                <p className="text-lg font-bold text-blue-700">{carrierData.dot_number}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">MC Number</p>
                <p className="text-lg font-bold text-purple-700">{carrierData.mc_number || 'N/A'}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">Safety Rating</p>
                <p className="text-lg font-bold text-green-700">{carrierData.safety_rating || 'Not Rated'}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">Operation Type</p>
                <p className="text-sm font-bold text-orange-700">{carrierData.carrier_operation || 'N/A'}</p>
              </div>
            </div>

            {/* Address & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Physical Address</span>
                </div>
                {carrierData.physical_address && (
                  <p className="text-sm text-gray-600">
                    {carrierData.physical_address.street}<br />
                    {carrierData.physical_address.city}, {carrierData.physical_address.state} {carrierData.physical_address.zip}
                  </p>
                )}
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Contact</span>
                </div>
                <p className="text-sm text-gray-600">{carrierData.phone || 'Not available'}</p>
              </div>
            </div>

            {/* Fleet Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg flex items-center gap-3">
                <Truck className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{carrierData.total_power_units || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Power Units</p>
                </div>
              </div>
              <div className="p-4 border rounded-lg flex items-center gap-3">
                <Users className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{carrierData.total_drivers || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Drivers</p>
                </div>
              </div>
            </div>

            {/* Out of Service Warning */}
            {carrierData.out_of_service === 'Y' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertOctagon className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-700">OUT OF SERVICE</p>
                  <p className="text-sm text-red-600">
                    This carrier has been placed out of service as of {carrierData.out_of_service_date}.
                    Do NOT accept loads from this carrier.
                  </p>
                </div>
              </div>
            )}

            {/* Demo Data Notice */}
            {!carrierData.verified && carrierData.demo_data && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-700">Demo Data</p>
                  <p className="text-sm text-yellow-600">
                    {carrierData.message} To get real FMCSA data, configure your FMCSA WebKey.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Safety BASICs */}
      {safetyData?.safety_basics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Safety Performance (BASICs)
            </CardTitle>
            <CardDescription>
              Higher percentile = WORSE safety record. 65+ percentile triggers FMCSA alerts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Overall Status */}
            <div className="mb-6 p-4 rounded-lg bg-gray-50 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Safety Status</p>
                <p className={`text-xl font-bold ${
                  safetyData.overall_status === 'SATISFACTORY' ? 'text-green-600' :
                  safetyData.overall_status === 'CONDITIONAL' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {safetyData.overall_status}
                </p>
              </div>
              {safetyData.alert_count > 0 && (
                <Badge className="bg-red-600">
                  {safetyData.alert_count} Alert(s)
                </Badge>
              )}
            </div>

            {/* BASICs Grid */}
            <div className="space-y-4">
              {Object.entries(safetyData.safety_basics).map(([category, data]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">
                      {category.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-sm font-bold ${getSafetyTextColor(data.percentile)}`}>
                      {data.percentile}th percentile
                      {data.status === 'ALERT' && (
                        <AlertTriangle className="w-4 h-4 inline ml-1 text-red-500" />
                      )}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getSafetyColor(data.percentile)} transition-all`}
                      style={{ width: `${data.percentile}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Percentile Guide:</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-500"></span>
                  0-24: Excellent
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-yellow-500"></span>
                  25-49: Good
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-orange-500"></span>
                  50-74: Caution
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-500"></span>
                  75+: Alert
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to Get Real Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-500" />
            Get Real FMCSA Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
            <li>Go to <a href="https://mobile.fmcsa.dot.gov/QCDevsite/docs/apiAccess" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">FMCSA Developer Portal</a></li>
            <li>Create an account using Login.gov (free)</li>
            <li>Navigate to "My WebKeys" and generate a new key</li>
            <li>Add FMCSA_WEBKEY to your backend environment</li>
            <li>Restart the backend to apply changes</li>
          </ol>
          <p className="mt-3 text-xs text-gray-400">
            The FMCSA API is completely free with no rate limits for reasonable use.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
