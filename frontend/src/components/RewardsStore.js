import { useState, useContext, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Gift, ShoppingBag, Crown, Star, Zap, Shield, Clock, Check } from "lucide-react";

export default function RewardsStore() {
  const { user } = useContext(AuthContext);
  const [catalog, setCatalog] = useState([]);
  const [userRewards, setUserRewards] = useState({ available_points: 0, redemptions: [] });
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catalogRes, userRes] = await Promise.all([
        axios.get(`${API}/rewards/catalog`),
        axios.get(`${API}/rewards/user/${user.email}`)
      ]);
      setCatalog(catalogRes.data);
      setUserRewards(userRes.data);
    } catch (error) {
      console.error("Failed to load rewards data");
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (rewardId) => {
    setRedeeming(rewardId);
    try {
      const response = await axios.post(
        `${API}/rewards/redeem?reward_id=${rewardId}&user_email=${user.email}`
      );
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Redemption failed");
    } finally {
      setRedeeming(null);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "features": return <Crown className="w-5 h-5" />;
      case "cosmetic": return <Star className="w-5 h-5" />;
      case "service": return <Zap className="w-5 h-5" />;
      case "visibility": return <Shield className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "features": return "from-purple-500 to-indigo-600";
      case "cosmetic": return "from-amber-500 to-orange-600";
      case "service": return "from-blue-500 to-cyan-600";
      case "visibility": return "from-green-500 to-emerald-600";
      default: return "from-slate-500 to-slate-600";
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
            <ShoppingBag className="w-6 h-6 text-purple-600" />
            Rewards Store
          </h3>
          <p className="text-slate-600">Redeem your points for awesome perks</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-bold text-amber-600">
              {userRewards.available_points.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-slate-500">Available Points</p>
        </div>
      </div>

      {/* Rewards Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalog.map((reward) => {
          const canAfford = userRewards.available_points >= reward.cost;
          
          return (
            <Card 
              key={reward.id}
              className={`overflow-hidden transition-all ${canAfford ? 'hover:shadow-lg' : 'opacity-60'}`}
            >
              <div className={`h-2 bg-gradient-to-r ${getCategoryColor(reward.category)}`} />
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCategoryColor(reward.category)} flex items-center justify-center text-white`}>
                    <span className="text-2xl">{reward.icon}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {reward.category}
                  </Badge>
                </div>
                
                <h4 className="font-bold text-lg mb-1">{reward.name}</h4>
                <p className="text-sm text-slate-600 mb-4">{reward.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Gift className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-amber-600">{reward.cost.toLocaleString()}</span>
                    <span className="text-sm text-slate-500">pts</span>
                  </div>
                  
                  <Button
                    onClick={() => redeemReward(reward.id)}
                    disabled={!canAfford || redeeming === reward.id}
                    className={canAfford ? "bg-purple-600 hover:bg-purple-700" : ""}
                    size="sm"
                  >
                    {redeeming === reward.id ? "..." : "Redeem"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Rewards */}
      {userRewards.redemptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Your Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userRewards.redemptions.map((redemption) => (
                <div 
                  key={redemption.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{redemption.reward_name}</p>
                    <p className="text-xs text-slate-500">
                      Redeemed {new Date(redemption.redeemed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {redemption.expires_at ? (
                      <div className="flex items-center gap-1 text-sm text-amber-600">
                        <Clock className="w-4 h-4" />
                        Expires {new Date(redemption.expires_at).toLocaleDateString()}
                      </div>
                    ) : (
                      <Badge className="bg-green-500">Active</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to Earn Points */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-bold text-blue-800 mb-4">How to Earn Points</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
            <div className="p-3 bg-white rounded-lg">
              <p className="font-bold text-blue-600">+10-50</p>
              <p className="text-slate-600">Daily Check-in</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="font-bold text-blue-600">+25-50</p>
              <p className="text-slate-600">Write Reviews</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="font-bold text-blue-600">+500</p>
              <p className="text-slate-600">Refer Friends</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="font-bold text-blue-600">+20</p>
              <p className="text-slate-600">Community Posts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
