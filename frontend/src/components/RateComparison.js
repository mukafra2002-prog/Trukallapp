import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { 
  TrendingUp, TrendingDown, Minus, DollarSign, 
  Target, AlertTriangle, CheckCircle, ArrowRight,
  BarChart3, Lightbulb, Award
} from 'lucide-react';

export default function RateComparison() {
  const { user } = useContext(AuthContext);
  const [laneRates, setLaneRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customRate, setCustomRate] = useState({ origin: '', destination: '', rate: '', miles: '' });
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    fetchLaneRates();
  }, []);

  const fetchLaneRates = async () => {
    try {
      const response = await axios.get(`${API}/loads/lane-rates`);
      setLaneRates(response.data || []);
    } catch (error) {
      console.error('Failed to fetch lane rates', error);
    } finally {
      setLoading(false);
    }
  };

  const compareRate = () => {
    if (!customRate.origin || !customRate.destination || !customRate.rate || !customRate.miles) {
      toast.error('Please fill in all fields');
      return;
    }

    const rate = parseFloat(customRate.rate);
    const miles = parseFloat(customRate.miles);
    const ratePerMile = rate / miles;

    // Find matching lane or similar lanes
    const originLower = customRate.origin.toLowerCase();
    const destLower = customRate.destination.toLowerCase();
    
    let matchedLane = laneRates.find(lane => 
      lane.origin?.toLowerCase().includes(originLower) && 
      lane.destination?.toLowerCase().includes(destLower)
    );

    // If no exact match, find average for similar distance
    if (!matchedLane) {
      const similarDistanceLanes = laneRates.filter(lane => {
        const laneDist = lane.avg_distance || 0;
        return Math.abs(laneDist - miles) < miles * 0.3; // Within 30% distance
      });
      
      if (similarDistanceLanes.length > 0) {
        const avgRate = similarDistanceLanes.reduce((acc, l) => acc + (l.avg_rate_per_mile || 0), 0) / similarDistanceLanes.length;
        matchedLane = {
          origin: 'Similar Routes',
          destination: `(${miles} mi range)`,
          avg_rate_per_mile: avgRate,
          avg_rate: avgRate * miles,
          min_rate: Math.min(...similarDistanceLanes.map(l => l.min_rate || 0)),
          max_rate: Math.max(...similarDistanceLanes.map(l => l.max_rate || 0)),
          load_count: similarDistanceLanes.reduce((acc, l) => acc + (l.load_count || 0), 0)
        };
      }
    }

    if (!matchedLane) {
      // Use overall market average
      const overallAvg = laneRates.reduce((acc, l) => acc + (l.avg_rate_per_mile || 0), 0) / laneRates.length;
      matchedLane = {
        origin: 'Market Average',
        destination: '(All Routes)',
        avg_rate_per_mile: overallAvg,
        avg_rate: overallAvg * miles
      };
    }

    const marketRPM = matchedLane.avg_rate_per_mile || 2.50;
    const difference = ratePerMile - marketRPM;
    const percentDiff = ((ratePerMile - marketRPM) / marketRPM) * 100;

    setComparison({
      yourRate: rate,
      yourRPM: ratePerMile,
      marketRPM: marketRPM,
      marketRate: matchedLane.avg_rate,
      difference: difference,
      percentDiff: percentDiff,
      minRate: matchedLane.min_rate,
      maxRate: matchedLane.max_rate,
      loadCount: matchedLane.load_count,
      lane: `${matchedLane.origin} → ${matchedLane.destination}`,
      isGood: percentDiff >= 0,
      isGreat: percentDiff >= 10,
      isBelowMarket: percentDiff < -10
    });
  };

  const getRateAdvice = () => {
    if (!comparison) return null;
    
    if (comparison.isGreat) {
      return {
        icon: <Award className="w-5 h-5 text-green-600" />,
        title: "Excellent Rate!",
        message: `You're earning ${comparison.percentDiff.toFixed(1)}% above market average. Great negotiation!`,
        color: "text-green-600",
        bg: "bg-green-50 border-green-200"
      };
    } else if (comparison.isGood) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-blue-600" />,
        title: "Good Rate",
        message: `You're at or above market rate. This is a fair deal.`,
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-200"
      };
    } else if (comparison.isBelowMarket) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        title: "Below Market Rate",
        message: `This rate is ${Math.abs(comparison.percentDiff).toFixed(1)}% below market. Consider negotiating or finding better loads.`,
        color: "text-red-600",
        bg: "bg-red-50 border-red-200"
      };
    } else {
      return {
        icon: <Minus className="w-5 h-5 text-yellow-600" />,
        title: "Slightly Below Average",
        message: `Rate is slightly below market. May be acceptable depending on deadhead and conditions.`,
        color: "text-yellow-600",
        bg: "bg-yellow-50 border-yellow-200"
      };
    }
  };

  const advice = getRateAdvice();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Rate Comparison Tool
          </CardTitle>
          <CardDescription>
            Compare your load rates against market averages to maximize earnings
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enter Load Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Origin City</label>
              <Input
                placeholder="e.g., Atlanta"
                value={customRate.origin}
                onChange={(e) => setCustomRate({...customRate, origin: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Destination City</label>
              <Input
                placeholder="e.g., Dallas"
                value={customRate.destination}
                onChange={(e) => setCustomRate({...customRate, destination: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Total Rate ($)</label>
              <Input
                type="number"
                placeholder="e.g., 2500"
                value={customRate.rate}
                onChange={(e) => setCustomRate({...customRate, rate: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Distance (miles)</label>
              <Input
                type="number"
                placeholder="e.g., 780"
                value={customRate.miles}
                onChange={(e) => setCustomRate({...customRate, miles: e.target.value})}
              />
            </div>
          </div>
          <Button onClick={compareRate} className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Target className="w-4 h-4 mr-2" />
            Compare to Market
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparison && (
        <Card className={advice?.bg}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {advice?.icon}
                <span className={advice?.color}>{advice?.title}</span>
              </CardTitle>
              <Badge className={comparison.isGood ? 'bg-green-600' : 'bg-red-600'}>
                {comparison.percentDiff >= 0 ? '+' : ''}{comparison.percentDiff.toFixed(1)}%
              </Badge>
            </div>
            <CardDescription>{advice?.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Your Rate */}
              <div className="p-4 bg-white rounded-lg border text-center">
                <p className="text-sm text-gray-500 mb-1">Your Rate</p>
                <p className="text-2xl font-bold text-indigo-600">${comparison.yourRate.toLocaleString()}</p>
                <p className="text-sm text-gray-500">${comparison.yourRPM.toFixed(2)}/mi</p>
              </div>
              
              {/* Market Rate */}
              <div className="p-4 bg-white rounded-lg border text-center">
                <p className="text-sm text-gray-500 mb-1">Market Average</p>
                <p className="text-2xl font-bold text-gray-700">${comparison.marketRate?.toLocaleString() || 'N/A'}</p>
                <p className="text-sm text-gray-500">${comparison.marketRPM.toFixed(2)}/mi</p>
              </div>
              
              {/* Difference */}
              <div className="p-4 bg-white rounded-lg border text-center">
                <p className="text-sm text-gray-500 mb-1">Difference</p>
                <p className={`text-2xl font-bold ${comparison.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {comparison.difference >= 0 ? '+' : ''}{comparison.difference.toFixed(2)}/mi
                </p>
                <div className="flex items-center justify-center gap-1">
                  {comparison.difference >= 0 ? 
                    <TrendingUp className="w-4 h-4 text-green-600" /> : 
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  }
                  <span className={`text-sm ${comparison.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison.percentDiff >= 0 ? '+' : ''}{comparison.percentDiff.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* Lane Info */}
              <div className="p-4 bg-white rounded-lg border text-center">
                <p className="text-sm text-gray-500 mb-1">Market Data</p>
                <p className="text-sm font-medium">{comparison.lane}</p>
                {comparison.loadCount && (
                  <p className="text-xs text-gray-400">Based on {comparison.loadCount} loads</p>
                )}
              </div>
            </div>

            {/* Rate Range */}
            {comparison.minRate && comparison.maxRate && (
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-sm text-gray-500 mb-2">Market Rate Range for This Lane</p>
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400"
                    style={{ width: '100%' }}
                  />
                  <div 
                    className="absolute h-full w-1 bg-indigo-600"
                    style={{ 
                      left: `${Math.min(100, Math.max(0, ((comparison.yourRate - comparison.minRate) / (comparison.maxRate - comparison.minRate)) * 100))}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>${comparison.minRate?.toLocaleString()}</span>
                  <span className="font-medium text-indigo-600">Your Rate: ${comparison.yourRate.toLocaleString()}</span>
                  <span>${comparison.maxRate?.toLocaleString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Negotiation Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Negotiation Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Always know the market rate before accepting a load</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Factor in deadhead miles, fuel costs, and time when calculating true profit</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Rates above $2.50/mi are generally good for long hauls</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Don't be afraid to counter-offer - most rates have 10-15% negotiation room</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Check broker credit scores before accepting loads from new brokers</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Top Paying Lanes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-green-500" />
            Top Paying Lanes Right Now
          </CardTitle>
          <CardDescription>Highest rate per mile lanes based on current market data</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-4">Loading market data...</p>
          ) : (
            <div className="space-y-2">
              {laneRates
                .filter(lane => lane.avg_rate_per_mile > 0)
                .sort((a, b) => (b.avg_rate_per_mile || 0) - (a.avg_rate_per_mile || 0))
                .slice(0, 5)
                .map((lane, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">
                          {lane.origin} <ArrowRight className="w-3 h-3 inline mx-1" /> {lane.destination}
                        </p>
                        <p className="text-xs text-gray-500">{lane.avg_distance?.toLocaleString() || '—'} miles</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${lane.avg_rate_per_mile?.toFixed(2)}/mi</p>
                      <p className="text-xs text-gray-500">${lane.avg_rate?.toLocaleString()} avg</p>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
