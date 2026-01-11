import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API } from "@/App";
import axios from "axios";
import { Star, Trophy, Flame, Heart, TrendingUp } from "lucide-react";

export default function DriverSpotlight() {
  const [spotlight, setSpotlight] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpotlight();
  }, []);

  const fetchSpotlight = async () => {
    try {
      const response = await axios.get(`${API}/spotlight/weekly`);
      setSpotlight(response.data);
    } catch (error) {
      console.error("Failed to load spotlight");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Top Reviewer": return <Star className="w-6 h-6" />;
      case "Most Helpful": return <Heart className="w-6 h-6" />;
      case "Streak Champion": return <Flame className="w-6 h-6" />;
      default: return <Trophy className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "Top Reviewer": return "from-amber-400 to-orange-500";
      case "Most Helpful": return "from-pink-400 to-rose-500";
      case "Streak Champion": return "from-orange-500 to-red-500";
      default: return "from-blue-400 to-indigo-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (spotlight.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Driver Spotlight
          <Badge className="bg-white/20 text-white border-0 ml-auto">This Week</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {spotlight.map((driver, idx) => (
            <div 
              key={idx}
              className="relative overflow-hidden rounded-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(driver.category)} opacity-10`} />
              <div className="relative p-4 text-center">
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${getCategoryColor(driver.category)} flex items-center justify-center text-white shadow-lg`}>
                  <span className="text-3xl">{driver.icon}</span>
                </div>
                <Badge className={`mb-2 bg-gradient-to-r ${getCategoryColor(driver.category)} text-white border-0`}>
                  {driver.category}
                </Badge>
                <h4 className="font-bold text-lg">{driver.name}</h4>
                <p className="text-sm text-slate-600 mb-2">{driver.stat}</p>
                <div className="flex items-center justify-center gap-1 text-amber-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-bold">{driver.points.toLocaleString()}</span>
                  <span className="text-xs text-slate-500">points</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
