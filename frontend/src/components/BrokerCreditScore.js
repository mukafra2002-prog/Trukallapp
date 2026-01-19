import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Search, Shield, Star, AlertTriangle, CheckCircle, 
  XCircle, Clock, DollarSign, TrendingUp, AlertOctagon
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function BrokerCreditScore() {
  const [brokerName, setBrokerName] = useState('');
  const [creditData, setCreditData] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchBroker = async () => {
    if (!brokerName.trim()) {
      toast.error('Enter a broker name');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/brokers/credit-score/${encodeURIComponent(brokerName)}`);
      setCreditData(response.data);
    } catch (error) {
      toast.error('Failed to fetch broker data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'bg-green-600';
    if (grade === 'B') return 'bg-blue-600';
    if (grade === 'C') return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getRiskBadge = (risk) => {
    const colors = {
      'Very Low': 'bg-green-100 text-green-700',
      'Low': 'bg-green-100 text-green-700',
      'Medium': 'bg-yellow-100 text-yellow-700',
      'Medium-High': 'bg-orange-100 text-orange-700',
      'High': 'bg-red-100 text-red-700',
      'Very High': 'bg-red-100 text-red-700'
    };
    return colors[risk] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Broker Credit Score Checker
          </CardTitle>
          <CardDescription>
            Check broker creditworthiness before accepting loads - like DAT's broker scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter broker name (e.g., TQL, CH Robinson)"
              value={brokerName}
              onChange={(e) => setBrokerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchBroker()}
              className="flex-1"
            />
            <Button onClick={searchBroker} disabled={loading} className="bg-blue-600">
              <Search className="w-4 h-4 mr-2" />
              Check Score
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {creditData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{creditData.broker_name}</span>
              {creditData.credit_score !== null && (
                <Badge className={getGradeColor(creditData.grade)}>
                  Grade: {creditData.grade}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creditData.credit_score === null ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
                <p className="text-gray-600">{creditData.message}</p>
                <p className="text-sm text-gray-500 mt-2">
                  This broker has no ratings yet. Proceed with caution.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Credit Score Gauge */}
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="#e5e7eb"
                        strokeWidth="16"
                        fill="none"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke={creditData.credit_score >= 70 ? '#22c55e' : creditData.credit_score >= 50 ? '#eab308' : '#ef4444'}
                        strokeWidth="16"
                        fill="none"
                        strokeDasharray={`${(creditData.credit_score / 100) * 502} 502`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-5xl font-bold ${getScoreColor(creditData.credit_score)}`}>
                        {creditData.credit_score}
                      </span>
                      <span className="text-sm text-gray-500">out of 100</span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <Star className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
                    <div className="text-2xl font-bold">{creditData.average_rating || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Avg Rating</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <Clock className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                    <div className="text-2xl font-bold">{creditData.avg_days_to_pay || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Days to Pay</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <TrendingUp className="w-6 h-6 mx-auto text-green-500 mb-1" />
                    <div className="text-2xl font-bold">{creditData.total_reviews}</div>
                    <div className="text-sm text-gray-500">Total Reviews</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <AlertOctagon className="w-6 h-6 mx-auto text-red-500 mb-1" />
                    <div className="text-2xl font-bold">{creditData.fraud_reports}</div>
                    <div className="text-sm text-gray-500">Fraud Reports</div>
                  </div>
                </div>

                {/* Risk Level & Recommendation */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 p-4 border rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Risk Level</div>
                    <Badge className={getRiskBadge(creditData.risk_level)}>
                      {creditData.risk_level}
                    </Badge>
                  </div>
                  <div className="flex-1 p-4 border rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Recommendation</div>
                    <div className="flex items-center gap-2">
                      {creditData.recommendation === 'Recommended' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : creditData.recommendation === 'Use Caution' ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-semibold">{creditData.recommendation}</span>
                    </div>
                  </div>
                </div>

                {/* Warning if fraud reports */}
                {creditData.fraud_reports > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertOctagon className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-red-700">Fraud Alert</div>
                      <p className="text-sm text-red-600">
                        This broker has {creditData.fraud_reports} fraud report(s). 
                        Verify all load details and consider requiring quick pay or factoring.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Broker Verification Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Score 70+ = Generally safe to work with</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <span>Score 50-70 = Verify load details, consider quick pay</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <span>Score below 50 = High risk, avoid or require prepayment</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
              <span>Always verify broker's MC number on FMCSA website</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
