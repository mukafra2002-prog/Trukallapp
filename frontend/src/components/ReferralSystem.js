import { useState, useContext, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Gift, Copy, Share2, Users, Award, TrendingUp, Check, ExternalLink } from "lucide-react";

export default function ReferralSystem() {
  const { user } = useContext(AuthContext);
  const [referralData, setReferralData] = useState(null);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
    fetchLeaderboard();
  }, []);

  const fetchReferralData = async () => {
    try {
      const [codeRes, statsRes] = await Promise.all([
        axios.get(`${API}/referral/code/${user.email}`),
        axios.get(`${API}/referral/stats/${user.email}`)
      ]);
      setReferralData(codeRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/referral/leaderboard`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Failed to load leaderboard");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralData?.referral_code || "");
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralData?.referral_link || "");
    toast.success("Referral link copied!");
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TrukAll!',
          text: `Use my referral code ${referralData?.referral_code} to get 250 bonus points!`,
          url: referralData?.referral_link
        });
      } catch (error) {
        copyLink();
      }
    } else {
      copyLink();
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-blue-600" />
            Refer & Earn
          </h3>
          <p className="text-slate-600">Invite friends, earn rewards</p>
        </div>
      </div>

      {/* Referral Code Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div>
              <p className="text-blue-100 text-sm mb-2">Your Referral Code</p>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-3xl font-mono font-bold tracking-wider" data-testid="referral-code">
                  {referralData?.referral_code || "LOADING..."}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={copyCode}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy Code"}
              </Button>
              <Button 
                onClick={shareReferral}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            <div className="pt-4 border-t border-white/20">
              <p className="text-sm text-blue-100">Your referral link:</p>
              <div className="flex items-center gap-2 mt-2">
                <Input 
                  value={referralData?.referral_link || ""}
                  readOnly
                  className="bg-white/10 border-white/20 text-white text-sm"
                />
                <Button 
                  onClick={copyLink}
                  size="icon"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Info */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <Gift className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold text-amber-600">500</p>
              <p className="text-sm text-slate-600">Points for YOU</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-blue-600">250</p>
              <p className="text-sm text-slate-600">Points for FRIEND</p>
            </div>
          </div>
          <p className="text-center text-sm text-slate-600 mt-4">
            Both you and your friend get bonus points when they sign up!
          </p>
        </CardContent>
      </Card>

      {/* Your Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Your Referral Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stats?.total_referrals || 0}</p>
              <p className="text-sm text-slate-600">Total Referrals</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{stats?.total_earned || 0}</p>
              <p className="text-sm text-slate-600">Points Earned</p>
            </div>
          </div>

          {/* Recent Referrals */}
          {stats?.referrals?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Recent Referrals</h4>
              <div className="space-y-2">
                {stats.referrals.slice(0, 5).map((ref, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{ref.referred_name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(ref.completed_at || ref.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">+{ref.reward_points} pts</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Top Referrers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((leader, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    idx === 0 ? 'bg-amber-50 border border-amber-200' :
                    idx === 1 ? 'bg-slate-100' :
                    idx === 2 ? 'bg-orange-50' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-amber-500 text-white' :
                      idx === 1 ? 'bg-slate-400 text-white' :
                      idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200'
                    }`}>
                      {leader.rank}
                    </span>
                    <span className="font-medium">{leader.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{leader.total_referrals}</p>
                    <p className="text-xs text-slate-500">referrals</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-bold text-blue-800 mb-4">How It Works</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
              <p className="text-sm text-blue-700">Share your referral code or link with friends</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
              <p className="text-sm text-blue-700">They sign up using your code</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
              <p className="text-sm text-blue-700">You both get bonus points instantly!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
