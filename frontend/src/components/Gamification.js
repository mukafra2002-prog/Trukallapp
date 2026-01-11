import { useState, useContext, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Trophy, Star, Flame, Target, Award, Crown, Medal, Zap, ChevronRight, Calendar, TrendingUp } from "lucide-react";

export default function Gamification() {
  const { user } = useContext(AuthContext);
  const [gamificationData, setGamificationData] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState({ daily: [], weekly: [] });
  const [loading, setLoading] = useState(true);
  const [activeLeaderboard, setActiveLeaderboard] = useState("points");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userData, badges, leaders, challengeData] = await Promise.all([
        axios.get(`${API}/gamification/user/${user.email}`),
        axios.get(`${API}/gamification/badges`),
        axios.get(`${API}/gamification/leaderboard?category=points`),
        axios.get(`${API}/gamification/challenges`)
      ]);
      
      setGamificationData(userData.data);
      setAllBadges(badges.data);
      setLeaderboard(leaders.data);
      setChallenges(challengeData.data);
    } catch (error) {
      console.error("Failed to load gamification data");
    } finally {
      setLoading(false);
    }
  };

  const doCheckin = async () => {
    try {
      const response = await axios.post(`${API}/gamification/checkin?user_email=${user.email}`);
      toast.success(`${response.data.message} +${response.data.points_earned} points!`);
      if (response.data.new_badges?.length > 0) {
        response.data.new_badges.forEach(badge => {
          toast.success(`🏆 New Badge: ${badge.name}!`);
        });
      }
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Check-in failed");
    }
  };

  const changeLeaderboard = async (category) => {
    setActiveLeaderboard(category);
    try {
      const response = await axios.get(`${API}/gamification/leaderboard?category=${category}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Failed to load leaderboard");
    }
  };

  const earnedBadgeIds = gamificationData?.badges?.map(b => b.badge_id) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Level */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Achievements
          </h3>
          <p className="text-slate-600">Earn badges and climb the leaderboard</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-bold text-amber-600">Level {gamificationData?.level || 1}</span>
          </div>
          <p className="text-sm text-slate-500">{gamificationData?.total_points || 0} total points</p>
        </div>
      </div>

      {/* Level Progress */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-700">Level {gamificationData?.level || 1}</span>
            <span className="text-sm font-medium text-amber-700">Level {(gamificationData?.level || 1) + 1}</span>
          </div>
          <Progress value={gamificationData?.level_progress || 0} className="h-3 bg-amber-200" />
          <p className="text-xs text-amber-600 mt-2 text-center">
            {Math.round(gamificationData?.level_progress || 0)}% to next level
          </p>
        </CardContent>
      </Card>

      {/* Streak & Daily Check-in */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-8 h-8" />
                  <span className="text-4xl font-bold">{gamificationData?.streak?.current_streak || 0}</span>
                </div>
                <p className="text-orange-100">Day Streak</p>
                <p className="text-xs text-orange-200">Longest: {gamificationData?.streak?.longest_streak || 0} days</p>
              </div>
              <Button 
                onClick={doCheckin}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                data-testid="daily-checkin-btn"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Check In
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h4 className="font-bold flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-600" />
              Daily Challenges
            </h4>
            <div className="space-y-2">
              {challenges.daily.slice(0, 3).map((challenge) => (
                <div key={challenge.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm">{challenge.name}</span>
                  <Badge variant="outline" className="text-green-600">+{challenge.points}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Weekly Challenges
          </CardTitle>
          <CardDescription>Complete for bonus rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {challenges.weekly.map((challenge) => (
              <div key={challenge.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div>
                  <p className="font-medium text-purple-800">{challenge.name}</p>
                  <p className="text-xs text-purple-600">{challenge.description}</p>
                </div>
                <Badge className="bg-purple-600">+{challenge.points}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-500" />
            Badges ({earnedBadgeIds.length}/{allBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {allBadges.map((badge) => {
              const isEarned = earnedBadgeIds.includes(badge.id);
              return (
                <div 
                  key={badge.id}
                  className={`p-3 rounded-lg text-center transition-all ${
                    isEarned 
                      ? 'bg-amber-50 border-2 border-amber-300' 
                      : 'bg-slate-100 opacity-50'
                  }`}
                  title={badge.description}
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <p className="text-xs font-medium mt-1 truncate">{badge.name}</p>
                  {isEarned && <Badge className="mt-1 text-xs bg-amber-500">Earned!</Badge>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Leaderboard
            </CardTitle>
            <div className="flex gap-1">
              {["points", "streak", "reviews"].map((cat) => (
                <Button
                  key={cat}
                  variant={activeLeaderboard === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeLeaderboard(cat)}
                  className={activeLeaderboard === cat ? "bg-blue-600" : ""}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  idx === 0 ? 'bg-amber-50 border border-amber-200' :
                  idx === 1 ? 'bg-slate-100' :
                  idx === 2 ? 'bg-orange-50' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-amber-500 text-white' :
                    idx === 1 ? 'bg-slate-400 text-white' :
                    idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200'
                  }`}>
                    {entry.rank}
                  </span>
                  <span className="font-medium">{entry.name}</span>
                </div>
                <span className="font-bold text-blue-600">{entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
