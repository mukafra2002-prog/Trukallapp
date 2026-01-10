import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { TrendingUp, TrendingDown, DollarSign, Truck, Fuel, MapPin, Calendar, ArrowUp, ArrowDown } from "lucide-react";

export default function AnalyticsDashboard() {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API}/analytics/${user.email}?period=${period}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Analytics Dashboard
          </h3>
          <p className="text-slate-600">Track your earnings and performance</p>
        </div>
        <div className="flex gap-2">
          {["week", "month", "year"].map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
              className={period === p ? "bg-blue-600" : ""}
              data-testid={`period-${p}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-500">
                <ArrowUp className="w-3 h-3 mr-1" />
                12%
              </Badge>
            </div>
            <p className="text-3xl font-black text-green-700">
              {formatCurrency(analytics?.total_earnings || 0)}
            </p>
            <p className="text-sm text-green-600">Total Earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Truck className="w-8 h-8 text-blue-600" />
              <Badge variant="outline" className="border-blue-500 text-blue-600">
                {analytics?.total_loads || 0} loads
              </Badge>
            </div>
            <p className="text-3xl font-black text-blue-700">
              {(analytics?.total_miles || 0).toLocaleString()}
            </p>
            <p className="text-sm text-blue-600">Total Miles</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Fuel className="w-8 h-8 text-red-600" />
              <Badge className="bg-red-500">
                <ArrowDown className="w-3 h-3 mr-1" />
                5%
              </Badge>
            </div>
            <p className="text-3xl font-black text-red-700">
              {formatCurrency(analytics?.total_expenses || 0)}
            </p>
            <p className="text-sm text-red-600">Total Expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <Badge className={analytics?.net_profit >= 0 ? "bg-green-500" : "bg-red-500"}>
                {analytics?.net_profit >= 0 ? "Profit" : "Loss"}
              </Badge>
            </div>
            <p className="text-3xl font-black text-purple-700">
              {formatCurrency(analytics?.net_profit || 0)}
            </p>
            <p className="text-sm text-purple-600">Net Profit</p>
          </CardContent>
        </Card>
      </div>

      {/* Rate per Mile */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-3xl font-black text-blue-600">
                ${analytics?.avg_rate_per_mile?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-slate-600">Avg Rate/Mile</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-3xl font-black text-amber-600">
                {formatCurrency(analytics?.fuel_expenses || 0)}
              </p>
              <p className="text-sm text-slate-600">Fuel Costs</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-3xl font-black text-green-600">
                {formatCurrency(analytics?.parking_expenses || 0)}
              </p>
              <p className="text-sm text-slate-600">Parking Costs</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-3xl font-black text-red-600">
                {formatCurrency(analytics?.maintenance_expenses || 0)}
              </p>
              <p className="text-sm text-slate-600">Maintenance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Chart (Simplified Bar Chart) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Last 7 Days Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-48">
            {analytics?.earnings_by_day?.map((day, index) => {
              const maxEarning = Math.max(...(analytics?.earnings_by_day?.map(d => d.amount) || [1]));
              const height = maxEarning > 0 ? (day.amount / maxEarning) * 100 : 10;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '160px' }}>
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold">{day.day}</p>
                    <p className="text-xs text-slate-500">${day.amount}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
