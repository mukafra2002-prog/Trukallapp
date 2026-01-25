import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Fuel, TrendingUp, TrendingDown, Plus, Trash2,
  Calendar, MapPin, Gauge, BarChart3, Target
} from 'lucide-react';

export default function FuelEfficiencyTracker() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    gallons: '',
    totalCost: '',
    odometer: '',
    location: '',
    fullTank: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('trukall_fuel_logs');
    if (saved) {
      setFuelLogs(JSON.parse(saved));
    }
  }, []);

  const saveLogs = (logs) => {
    setFuelLogs(logs);
    localStorage.setItem('trukall_fuel_logs', JSON.stringify(logs));
  };

  const addFuelLog = () => {
    if (!newLog.gallons || !newLog.totalCost || !newLog.odometer) {
      toast.error('Please fill in gallons, cost, and odometer');
      return;
    }

    const log = {
      id: Date.now(),
      ...newLog,
      gallons: parseFloat(newLog.gallons),
      totalCost: parseFloat(newLog.totalCost),
      odometer: parseFloat(newLog.odometer),
      pricePerGallon: parseFloat(newLog.totalCost) / parseFloat(newLog.gallons),
      createdAt: new Date().toISOString()
    };

    // Calculate MPG if we have previous log
    if (fuelLogs.length > 0 && log.fullTank) {
      const prevLog = fuelLogs[0];
      const milesDriven = log.odometer - prevLog.odometer;
      if (milesDriven > 0) {
        log.mpg = milesDriven / log.gallons;
        log.milesDriven = milesDriven;
      }
    }

    const updated = [log, ...fuelLogs];
    saveLogs(updated);
    toast.success('Fuel log added!');

    setNewLog({
      date: new Date().toISOString().split('T')[0],
      gallons: '',
      totalCost: '',
      odometer: '',
      location: '',
      fullTank: true
    });
    setShowAddForm(false);
  };

  const deleteLog = (id) => {
    const updated = fuelLogs.filter(log => log.id !== id);
    saveLogs(updated);
    toast.success('Log deleted');
  };

  const getAverageMPG = () => {
    const logsWithMPG = fuelLogs.filter(log => log.mpg && log.mpg > 0);
    if (logsWithMPG.length === 0) return null;
    return logsWithMPG.reduce((sum, log) => sum + log.mpg, 0) / logsWithMPG.length;
  };

  const getAveragePricePerGallon = () => {
    if (fuelLogs.length === 0) return null;
    return fuelLogs.reduce((sum, log) => sum + (log.pricePerGallon || 0), 0) / fuelLogs.length;
  };

  const getTotalGallons = () => {
    return fuelLogs.reduce((sum, log) => sum + log.gallons, 0);
  };

  const getTotalSpent = () => {
    return fuelLogs.reduce((sum, log) => sum + log.totalCost, 0);
  };

  const getTotalMiles = () => {
    return fuelLogs.reduce((sum, log) => sum + (log.milesDriven || 0), 0);
  };

  const getCostPerMile = () => {
    const totalMiles = getTotalMiles();
    const totalSpent = getTotalSpent();
    if (totalMiles === 0) return null;
    return totalSpent / totalMiles;
  };

  const getMPGTrend = () => {
    const logsWithMPG = fuelLogs.filter(log => log.mpg).slice(0, 10);
    if (logsWithMPG.length < 2) return null;
    
    const recent = logsWithMPG.slice(0, 5).reduce((sum, log) => sum + log.mpg, 0) / Math.min(5, logsWithMPG.length);
    const older = logsWithMPG.slice(5).reduce((sum, log) => sum + log.mpg, 0) / Math.max(1, logsWithMPG.length - 5);
    
    if (older === 0) return null;
    return ((recent - older) / older) * 100;
  };

  const avgMPG = getAverageMPG();
  const avgPrice = getAveragePricePerGallon();
  const mpgTrend = getMPGTrend();
  const costPerMile = getCostPerMile();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-6 h-6 text-yellow-600" />
            Fuel Efficiency Tracker
          </CardTitle>
          <CardDescription>
            Track your MPG over time. Identify trends and optimize fuel costs.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-yellow-600 hover:bg-yellow-700">
          <Plus className="w-4 h-4 mr-2" />
          Log Fuel Stop
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="border-yellow-300">
          <CardHeader>
            <CardTitle className="text-lg">Log Fuel Stop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Date</label>
                <Input
                  type="date"
                  value={newLog.date}
                  onChange={(e) => setNewLog({...newLog, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Gallons</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="150.5"
                  value={newLog.gallons}
                  onChange={(e) => setNewLog({...newLog, gallons: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Total Cost ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="525.00"
                  value={newLog.totalCost}
                  onChange={(e) => setNewLog({...newLog, totalCost: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Odometer</label>
                <Input
                  type="number"
                  placeholder="125000"
                  value={newLog.odometer}
                  onChange={(e) => setNewLog({...newLog, odometer: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Location (Optional)</label>
                <Input
                  placeholder="Flying J, Dallas TX"
                  value={newLog.location}
                  onChange={(e) => setNewLog({...newLog, location: e.target.value})}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newLog.fullTank}
                    onChange={(e) => setNewLog({...newLog, fullTank: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Filled to Full</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={addFuelLog} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Fuel Log
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              💡 Tip: Always fill to full tank and record odometer for accurate MPG calculation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Average MPG */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Gauge className="w-8 h-8 text-green-500" />
              {mpgTrend !== null && (
                <Badge className={mpgTrend >= 0 ? 'bg-green-500' : 'bg-red-500'}>
                  {mpgTrend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(mpgTrend).toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-3xl font-bold text-green-700 mt-2">
              {avgMPG ? avgMPG.toFixed(1) : '--'}
            </p>
            <p className="text-sm text-green-600">Avg MPG</p>
          </CardContent>
        </Card>

        {/* Cost Per Mile */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            <p className="text-3xl font-bold text-blue-700 mt-2">
              ${costPerMile ? costPerMile.toFixed(2) : '--'}
            </p>
            <p className="text-sm text-blue-600">Cost/Mile</p>
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <Fuel className="w-8 h-8 text-purple-500" />
            <p className="text-3xl font-bold text-purple-700 mt-2">
              ${getTotalSpent().toFixed(0)}
            </p>
            <p className="text-sm text-purple-600">Total Spent</p>
          </CardContent>
        </Card>

        {/* Avg Price */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-4">
            <Target className="w-8 h-8 text-orange-500" />
            <p className="text-3xl font-bold text-orange-700 mt-2">
              ${avgPrice ? avgPrice.toFixed(2) : '--'}
            </p>
            <p className="text-sm text-orange-600">Avg $/Gallon</p>
          </CardContent>
        </Card>
      </div>

      {/* Totals Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{getTotalGallons().toFixed(0)}</p>
              <p className="text-sm text-gray-500">Total Gallons</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{getTotalMiles().toLocaleString()}</p>
              <p className="text-sm text-gray-500">Miles Tracked</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{fuelLogs.length}</p>
              <p className="text-sm text-gray-500">Fuel Stops</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fuel Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fuel History</CardTitle>
        </CardHeader>
        <CardContent>
          {fuelLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Fuel className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No fuel logs yet</p>
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={() => setShowAddForm(true)}
              >
                Log Your First Fuel Stop
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {fuelLogs.slice(0, 15).map((log, idx) => (
                <div 
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <Fuel className={`w-6 h-6 ${log.mpg ? 'text-green-500' : 'text-gray-400'}`} />
                      {log.mpg && (
                        <p className="text-xs font-bold text-green-600">{log.mpg.toFixed(1)}</p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{log.gallons.toFixed(1)} gal @ ${log.pricePerGallon?.toFixed(2)}/gal</p>
                        {log.mpg && idx < fuelLogs.length - 1 && (
                          <Badge className={
                            log.mpg > (fuelLogs[idx + 1]?.mpg || 0) 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }>
                            {log.mpg > (fuelLogs[idx + 1]?.mpg || 0) ? '↑' : '↓'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(log.date).toLocaleDateString()}
                        {log.location && (
                          <>
                            <MapPin className="w-3 h-3 inline ml-2 mr-1" />
                            {log.location}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold">${log.totalCost.toFixed(2)}</p>
                      {log.milesDriven && (
                        <p className="text-xs text-gray-500">{log.milesDriven.toLocaleString()} mi</p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteLog(log.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-yellow-700 mb-2">💡 Fuel Efficiency Tips</h4>
          <ul className="text-sm text-yellow-600 space-y-1">
            <li>• Maintain steady speed - avoid rapid acceleration/braking</li>
            <li>• Keep tires properly inflated (check weekly)</li>
            <li>• Reduce idle time - turn off engine during long stops</li>
            <li>• Use cruise control on highways when safe</li>
            <li>• Track MPG trends - sudden drops may indicate maintenance needs</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
