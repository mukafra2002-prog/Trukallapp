import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  Calculator, DollarSign, Fuel, Clock, MapPin, 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Truck, ArrowRight, Info, RotateCcw, Save, Lightbulb
} from 'lucide-react';

export default function LoadProfitCalculator() {
  // Load Details
  const [loadRate, setLoadRate] = useState('');
  const [loadMiles, setLoadMiles] = useState('');
  const [deadheadMiles, setDeadheadMiles] = useState('');
  
  // Fuel Settings
  const [fuelPrice, setFuelPrice] = useState('3.50');
  const [mpg, setMpg] = useState('6.5');
  
  // Additional Costs
  const [tollCost, setTollCost] = useState('');
  const [lumperFees, setLumperFees] = useState('');
  const [otherCosts, setOtherCosts] = useState('');
  
  // Time & Labor
  const [estimatedHours, setEstimatedHours] = useState('');
  const [hourlyGoal, setHourlyGoal] = useState('25');
  
  // Results
  const [results, setResults] = useState(null);
  const [savedCalculations, setSavedCalculations] = useState([]);

  // Load saved calculations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('trukall_saved_calculations');
    if (saved) {
      setSavedCalculations(JSON.parse(saved));
    }
  }, []);

  const calculateProfit = () => {
    // Validate inputs
    if (!loadRate || !loadMiles) {
      toast.error('Please enter load rate and miles');
      return;
    }

    const rate = parseFloat(loadRate) || 0;
    const miles = parseFloat(loadMiles) || 0;
    const deadhead = parseFloat(deadheadMiles) || 0;
    const fuel = parseFloat(fuelPrice) || 3.50;
    const milesPerGallon = parseFloat(mpg) || 6.5;
    const tolls = parseFloat(tollCost) || 0;
    const lumper = parseFloat(lumperFees) || 0;
    const other = parseFloat(otherCosts) || 0;
    const hours = parseFloat(estimatedHours) || (miles + deadhead) / 50; // Estimate 50 mph avg
    const hourlyTarget = parseFloat(hourlyGoal) || 25;

    // Calculate total miles (loaded + deadhead)
    const totalMiles = miles + deadhead;
    
    // Calculate fuel cost
    const gallonsNeeded = totalMiles / milesPerGallon;
    const fuelCost = gallonsNeeded * fuel;
    
    // Calculate total costs
    const totalCosts = fuelCost + tolls + lumper + other;
    
    // Calculate net profit
    const netProfit = rate - totalCosts;
    
    // Calculate per-mile rates
    const grossRatePerMile = rate / miles;
    const netRatePerMile = netProfit / totalMiles;
    const netRatePerLoadedMile = netProfit / miles;
    
    // Calculate hourly earnings
    const hourlyEarnings = netProfit / hours;
    const meetsHourlyGoal = hourlyEarnings >= hourlyTarget;
    
    // Calculate profit margin
    const profitMargin = (netProfit / rate) * 100;
    
    // Determine if load is profitable
    const isProfitable = netProfit > 0;
    const isGoodDeal = netRatePerMile >= 1.50 && meetsHourlyGoal;
    const isGreatDeal = netRatePerMile >= 2.00 && hourlyEarnings >= hourlyTarget * 1.2;

    setResults({
      // Gross
      grossRate: rate,
      grossRatePerMile: grossRatePerMile,
      
      // Miles
      loadedMiles: miles,
      deadheadMiles: deadhead,
      totalMiles: totalMiles,
      deadheadPercentage: (deadhead / totalMiles) * 100,
      
      // Costs breakdown
      fuelCost: fuelCost,
      gallonsNeeded: gallonsNeeded,
      tollCost: tolls,
      lumperFees: lumper,
      otherCosts: other,
      totalCosts: totalCosts,
      
      // Net
      netProfit: netProfit,
      netRatePerMile: netRatePerMile,
      netRatePerLoadedMile: netRatePerLoadedMile,
      profitMargin: profitMargin,
      
      // Time
      estimatedHours: hours,
      hourlyEarnings: hourlyEarnings,
      hourlyGoal: hourlyTarget,
      meetsHourlyGoal: meetsHourlyGoal,
      
      // Assessment
      isProfitable: isProfitable,
      isGoodDeal: isGoodDeal,
      isGreatDeal: isGreatDeal
    });
  };

  const saveCalculation = () => {
    if (!results) return;
    
    const calculation = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      loadRate: loadRate,
      loadMiles: loadMiles,
      deadheadMiles: deadheadMiles,
      netProfit: results.netProfit,
      netRatePerMile: results.netRatePerMile
    };
    
    const updated = [calculation, ...savedCalculations].slice(0, 10);
    setSavedCalculations(updated);
    localStorage.setItem('trukall_saved_calculations', JSON.stringify(updated));
    toast.success('Calculation saved!');
  };

  const resetForm = () => {
    setLoadRate('');
    setLoadMiles('');
    setDeadheadMiles('');
    setTollCost('');
    setLumperFees('');
    setOtherCosts('');
    setEstimatedHours('');
    setResults(null);
  };

  const getAssessmentColor = () => {
    if (!results) return 'bg-gray-100';
    if (results.isGreatDeal) return 'bg-green-50 border-green-300';
    if (results.isGoodDeal) return 'bg-blue-50 border-blue-300';
    if (results.isProfitable) return 'bg-yellow-50 border-yellow-300';
    return 'bg-red-50 border-red-300';
  };

  const getAssessmentText = () => {
    if (!results) return { title: '', message: '', icon: null };
    if (results.isGreatDeal) return {
      title: 'Excellent Load!',
      message: 'This load exceeds your hourly goal with great per-mile rate.',
      icon: <CheckCircle className="w-6 h-6 text-green-600" />
    };
    if (results.isGoodDeal) return {
      title: 'Good Load',
      message: 'Solid profitability. Meets your minimum requirements.',
      icon: <CheckCircle className="w-6 h-6 text-blue-600" />
    };
    if (results.isProfitable) return {
      title: 'Marginal Load',
      message: 'Profitable but below optimal. Consider negotiating or deadhead.',
      icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />
    };
    return {
      title: 'Unprofitable Load',
      message: 'This load loses money. Avoid or negotiate significantly higher rate.',
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />
    };
  };

  const assessment = getAssessmentText();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-orange-600" />
            Load Profitability Calculator
          </CardTitle>
          <CardDescription>
            Calculate true profit after fuel, deadhead, tolls, and time costs
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          {/* Load Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Load Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Load Rate ($) *</label>
                  <Input
                    type="number"
                    placeholder="2500"
                    value={loadRate}
                    onChange={(e) => setLoadRate(e.target.value)}
                    className="text-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Loaded Miles *</label>
                  <Input
                    type="number"
                    placeholder="780"
                    value={loadMiles}
                    onChange={(e) => setLoadMiles(e.target.value)}
                    className="text-lg font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Deadhead Miles (to pickup)</label>
                <Input
                  type="number"
                  placeholder="50"
                  value={deadheadMiles}
                  onChange={(e) => setDeadheadMiles(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fuel Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Fuel className="w-5 h-5 text-green-600" />
                Fuel Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Fuel Price ($/gal)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="3.50"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Your MPG</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="6.5"
                    value={mpg}
                    onChange={(e) => setMpg(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Costs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-600" />
                Additional Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Tolls ($)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={tollCost}
                    onChange={(e) => setTollCost(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Lumper ($)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={lumperFees}
                    onChange={(e) => setLumperFees(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Other ($)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={otherCosts}
                    onChange={(e) => setOtherCosts(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time & Goals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Time & Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Est. Hours (total)</label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="Auto-calc"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank to auto-estimate</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Hourly Goal ($/hr)</label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={hourlyGoal}
                    onChange={(e) => setHourlyGoal(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={calculateProfit} className="flex-1 bg-orange-600 hover:bg-orange-700 h-12">
              <Calculator className="w-5 h-5 mr-2" />
              Calculate Profit
            </Button>
            <Button variant="outline" onClick={resetForm} className="h-12">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {results ? (
            <>
              {/* Assessment Card */}
              <Card className={getAssessmentColor()}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {assessment.icon}
                      {assessment.title}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={saveCalculation}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                  <CardDescription>{assessment.message}</CardDescription>
                </CardHeader>
              </Card>

              {/* Net Profit Summary */}
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-1">Net Profit</p>
                    <p className={`text-4xl font-bold ${results.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${results.netProfit.toFixed(2)}
                    </p>
                    <div className="flex justify-center gap-6 mt-4">
                      <div>
                        <p className="text-slate-400 text-xs">Net $/Mile</p>
                        <p className={`text-xl font-semibold ${results.netRatePerMile >= 1.50 ? 'text-green-400' : 'text-yellow-400'}`}>
                          ${results.netRatePerMile.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Hourly</p>
                        <p className={`text-xl font-semibold ${results.meetsHourlyGoal ? 'text-green-400' : 'text-yellow-400'}`}>
                          ${results.hourlyEarnings.toFixed(2)}/hr
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Margin</p>
                        <p className={`text-xl font-semibold ${results.profitMargin >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {results.profitMargin.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Revenue */}
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-green-700 font-medium">Gross Revenue</span>
                      <span className="text-green-700 font-bold">${results.grossRate.toFixed(2)}</span>
                    </div>
                    
                    {/* Costs */}
                    <div className="space-y-2 pl-4 border-l-2 border-red-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          <Fuel className="w-3 h-3 inline mr-1" />
                          Fuel ({results.gallonsNeeded.toFixed(1)} gal)
                        </span>
                        <span className="text-red-600">-${results.fuelCost.toFixed(2)}</span>
                      </div>
                      {results.tollCost > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Tolls</span>
                          <span className="text-red-600">-${results.tollCost.toFixed(2)}</span>
                        </div>
                      )}
                      {results.lumperFees > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Lumper Fees</span>
                          <span className="text-red-600">-${results.lumperFees.toFixed(2)}</span>
                        </div>
                      )}
                      {results.otherCosts > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Other Costs</span>
                          <span className="text-red-600">-${results.otherCosts.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm font-medium pt-1 border-t">
                        <span className="text-gray-700">Total Costs</span>
                        <span className="text-red-600">-${results.totalCosts.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Net */}
                    <div className="flex justify-between items-center p-2 bg-slate-100 rounded mt-2">
                      <span className="font-bold">Net Profit</span>
                      <span className={`font-bold text-lg ${results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${results.netProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Miles & Time Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Trip Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded text-center">
                      <p className="text-xs text-gray-500">Loaded Miles</p>
                      <p className="text-xl font-bold">{results.loadedMiles}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded text-center">
                      <p className="text-xs text-gray-500">Deadhead</p>
                      <p className="text-xl font-bold">{results.deadheadMiles}</p>
                      <p className="text-xs text-gray-400">({results.deadheadPercentage.toFixed(1)}%)</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded text-center">
                      <p className="text-xs text-gray-500">Total Miles</p>
                      <p className="text-xl font-bold">{results.totalMiles}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded text-center">
                      <p className="text-xs text-gray-500">Est. Time</p>
                      <p className="text-xl font-bold">{results.estimatedHours.toFixed(1)}h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hourly Goal Check */}
              <Card className={results.meetsHourlyGoal ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {results.meetsHourlyGoal ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                      <span className={results.meetsHourlyGoal ? 'text-green-700' : 'text-yellow-700'}>
                        {results.meetsHourlyGoal ? 'Meets Hourly Goal!' : 'Below Hourly Goal'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        ${results.hourlyEarnings.toFixed(2)}/hr vs ${results.hourlyGoal}/hr goal
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Empty State */
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center py-12">
                <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Enter Load Details</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  Fill in the load rate, miles, and costs to see your true profit breakdown
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Aim for at least $1.50-$2.00 net per mile after all costs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Keep deadhead under 15% of total miles when possible</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Factor in wait times at pickup/delivery (2-4 hrs typical)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Negotiate lumper fees to be prepaid by broker</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Saved Calculations */}
      {savedCalculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Calculations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {savedCalculations.slice(0, 5).map((calc) => (
                <div key={calc.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400">{calc.date}</p>
                  <p className="font-medium">${calc.loadRate} / {calc.loadMiles}mi</p>
                  <p className={`text-sm font-semibold ${calc.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Net: ${calc.netProfit.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">${calc.netRatePerMile.toFixed(2)}/mi</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
