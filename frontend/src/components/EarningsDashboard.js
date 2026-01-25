import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AuthContext } from '@/App';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar,
  Truck, Target, Award, ArrowRight, Plus, BarChart3
} from 'lucide-react';

export default function EarningsDashboard() {
  const { user } = useContext(AuthContext);
  const [earnings, setEarnings] = useState([]);
  const [showAddEarning, setShowAddEarning] = useState(false);
  const [viewPeriod, setViewPeriod] = useState('week');
  const [newEarning, setNewEarning] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'load',
    description: '',
    miles: ''
  });

  useEffect(() => {
    // Load earnings from localStorage
    const saved = localStorage.getItem('trukall_earnings');
    if (saved) {
      setEarnings(JSON.parse(saved));
    } else {
      // Demo data
      setEarnings(getDemoEarnings());
    }
  }, []);

  const getDemoEarnings = () => {
    const now = new Date();
    return [
      { id: '1', date: new Date(now - 0 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 850, type: 'load', description: 'Dallas to Houston', miles: 240 },
      { id: '2', date: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 1200, type: 'load', description: 'Houston to San Antonio', miles: 200 },
      { id: '3', date: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2100, type: 'load', description: 'San Antonio to Phoenix', miles: 850 },
      { id: '4', date: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 150, type: 'detention', description: 'Detention pay - 3 hours', miles: 0 },
      { id: '5', date: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 1800, type: 'load', description: 'Phoenix to Los Angeles', miles: 370 },
      { id: '6', date: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 950, type: 'load', description: 'LA to Vegas', miles: 270 },
      { id: '7', date: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 1500, type: 'load', description: 'Vegas to Salt Lake', miles: 420 },
      { id: '8', date: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2200, type: 'load', description: 'Denver to Kansas City', miles: 600 },
      { id: '9', date: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 1100, type: 'load', description: 'KC to Omaha', miles: 185 },
      { id: '10', date: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 3500, type: 'load', description: 'Chicago to Atlanta', miles: 720 },
    ];
  };

  const saveEarnings = (updated) => {
    setEarnings(updated);
    localStorage.setItem('trukall_earnings', JSON.stringify(updated));
  };

  const addEarning = () => {
    if (!newEarning.amount || parseFloat(newEarning.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const earning = {
      id: Date.now().toString(),
      ...newEarning,
      amount: parseFloat(newEarning.amount),
      miles: parseFloat(newEarning.miles) || 0
    };

    const updated = [earning, ...earnings];
    saveEarnings(updated);
    toast.success('Earning added!');
    
    setNewEarning({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      type: 'load',
      description: '',
      miles: ''
    });
    setShowAddEarning(false);
  };

  const getFilteredEarnings = () => {
    const now = new Date();
    return earnings.filter(e => {
      const earningDate = new Date(e.date);
      switch (viewPeriod) {
        case 'week':
          const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
          return earningDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
          return earningDate >= monthAgo;
        case 'year':
          return earningDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  };

  const getTotalEarnings = () => {
    return getFilteredEarnings().reduce((sum, e) => sum + e.amount, 0);
  };

  const getTotalMiles = () => {
    return getFilteredEarnings().reduce((sum, e) => sum + (e.miles || 0), 0);
  };

  const getAveragePerMile = () => {
    const miles = getTotalMiles();
    const earnings = getTotalEarnings();
    return miles > 0 ? earnings / miles : 0;
  };

  const getLoadCount = () => {
    return getFilteredEarnings().filter(e => e.type === 'load').length;
  };

  const getPreviousPeriodEarnings = () => {
    const now = new Date();
    let startDate, endDate;
    
    switch (viewPeriod) {
      case 'week':
        startDate = new Date(now - 14 * 24 * 60 * 60 * 1000);
        endDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now - 60 * 24 * 60 * 60 * 1000);
        endDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return 0;
    }
    
    return earnings.filter(e => {
      const date = new Date(e.date);
      return date >= startDate && date < endDate;
    }).reduce((sum, e) => sum + e.amount, 0);
  };

  const getPercentChange = () => {
    const current = getTotalEarnings();
    const previous = getPreviousPeriodEarnings();
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getDailyBreakdown = () => {
    const filtered = getFilteredEarnings();
    const dailyTotals = {};
    
    filtered.forEach(e => {
      if (!dailyTotals[e.date]) {
        dailyTotals[e.date] = 0;
      }
      dailyTotals[e.date] += e.amount;
    });
    
    return Object.entries(dailyTotals)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .slice(0, 7);
  };

  const getMaxDailyEarning = () => {
    const daily = getDailyBreakdown();
    return daily.length > 0 ? Math.max(...daily.map(d => d[1])) : 1000;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const totalEarnings = getTotalEarnings();
  const totalMiles = getTotalMiles();
  const avgPerMile = getAveragePerMile();
  const loadCount = getLoadCount();
  const percentChange = getPercentChange();
  const dailyBreakdown = getDailyBreakdown();
  const maxDaily = getMaxDailyEarning();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Earnings Dashboard
          </CardTitle>
          <CardDescription>
            Track your income, analyze trends, and maximize your earnings.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Period Selector & Add Button */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          {['week', 'month', 'year', 'all'].map(period => (
            <Button
              key={period}
              variant={viewPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewPeriod(period)}
              className={viewPeriod === period ? 'bg-green-600' : ''}
            >
              {period === 'all' ? 'All Time' : `This ${period.charAt(0).toUpperCase() + period.slice(1)}`}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowAddEarning(!showAddEarning)} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Log Earning
        </Button>
      </div>

      {/* Add Earning Form */}
      {showAddEarning && (
        <Card className="border-green-300">
          <CardHeader>
            <CardTitle className="text-lg">Log New Earning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Date</label>
                <Input
                  type="date"
                  value={newEarning.date}
                  onChange={(e) => setNewEarning({...newEarning, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Amount ($)</label>
                <Input
                  type="number"
                  placeholder="1500"
                  value={newEarning.amount}
                  onChange={(e) => setNewEarning({...newEarning, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Type</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={newEarning.type}
                  onChange={(e) => setNewEarning({...newEarning, type: e.target.value})}
                >
                  <option value="load">Load Payment</option>
                  <option value="detention">Detention Pay</option>
                  <option value="bonus">Bonus</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Miles (if load)</label>
                <Input
                  type="number"
                  placeholder="500"
                  value={newEarning.miles}
                  onChange={(e) => setNewEarning({...newEarning, miles: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Description</label>
              <Input
                placeholder="e.g., Dallas to Houston haul"
                value={newEarning.description}
                onChange={(e) => setNewEarning({...newEarning, description: e.target.value})}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={addEarning} className="flex-1 bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Earning
              </Button>
              <Button variant="outline" onClick={() => setShowAddEarning(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              {percentChange !== 0 && (
                <Badge className={percentChange >= 0 ? 'bg-green-300 text-green-900' : 'bg-red-300 text-red-900'}>
                  {percentChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(percentChange).toFixed(0)}%
                </Badge>
              )}
            </div>
            <p className="text-3xl font-bold">${totalEarnings.toLocaleString()}</p>
            <p className="text-green-100 text-sm">Total Earnings</p>
          </CardContent>
        </Card>

        {/* Total Miles */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <Truck className="w-8 h-8 opacity-80 mb-2" />
            <p className="text-3xl font-bold">{totalMiles.toLocaleString()}</p>
            <p className="text-blue-100 text-sm">Miles Driven</p>
          </CardContent>
        </Card>

        {/* Rate Per Mile */}
        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white">
          <CardContent className="p-4">
            <Target className="w-8 h-8 opacity-80 mb-2" />
            <p className="text-3xl font-bold">${avgPerMile.toFixed(2)}</p>
            <p className="text-purple-100 text-sm">Avg $/Mile</p>
          </CardContent>
        </Card>

        {/* Load Count */}
        <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white">
          <CardContent className="p-4">
            <Award className="w-8 h-8 opacity-80 mb-2" />
            <p className="text-3xl font-bold">{loadCount}</p>
            <p className="text-orange-100 text-sm">Loads Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-500" />
            Daily Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No earnings recorded for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyBreakdown.map(([date, amount]) => (
                <div key={date} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-500">{formatDate(date)}</div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-end pr-3"
                        style={{ width: `${Math.max(10, (amount / maxDaily) * 100)}%` }}
                      >
                        <span className="text-white text-sm font-semibold">${amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Earnings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          {getFilteredEarnings().length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No earnings recorded</p>
              <Button variant="outline" className="mt-3" onClick={() => setShowAddEarning(true)}>
                Log Your First Earning
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {getFilteredEarnings().slice(0, 10).map(earning => (
                <div 
                  key={earning.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      earning.type === 'load' ? 'bg-green-100' :
                      earning.type === 'detention' ? 'bg-yellow-100' :
                      earning.type === 'bonus' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <DollarSign className={`w-4 h-4 ${
                        earning.type === 'load' ? 'text-green-600' :
                        earning.type === 'detention' ? 'text-yellow-600' :
                        earning.type === 'bonus' ? 'text-purple-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{earning.description || earning.type}</p>
                      <p className="text-sm text-gray-500">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(earning.date)}
                        {earning.miles > 0 && (
                          <span className="ml-2">
                            <Truck className="w-3 h-3 inline mr-1" />
                            {earning.miles} mi
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${earning.amount.toLocaleString()}</p>
                    {earning.miles > 0 && (
                      <p className="text-xs text-gray-500">${(earning.amount / earning.miles).toFixed(2)}/mi</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-green-700 mb-2">💰 Earnings Tips</h4>
          <ul className="text-sm text-green-600 space-y-1">
            <li>• Track every load and detention payment for accurate records</li>
            <li>• Aim for $2.50+/mile to maintain healthy profit margins</li>
            <li>• Don't forget to log bonuses and accessorial charges</li>
            <li>• Review weekly trends to identify your best routes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
