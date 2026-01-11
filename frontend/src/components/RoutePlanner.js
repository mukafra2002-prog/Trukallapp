import { useState, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Navigation, MapPin, Fuel, Clock, AlertTriangle, Coffee, Truck, Route } from "lucide-react";

export default function RoutePlanner() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState(null);
  const [formData, setFormData] = useState({
    origin_address: "",
    origin_lat: 32.7767,
    origin_lng: -96.7970,
    destination_address: "",
    destination_lat: 33.7490,
    destination_lng: -84.3880,
    truck_type: "semi",
    truck_height_ft: 13.6,
    truck_weight_lbs: 80000,
    hazmat: false,
    avoid_tolls: false,
    include_parking_stops: true
  });

  const planRoute = async () => {
    if (!formData.origin_address || !formData.destination_address) {
      toast.error("Please enter origin and destination");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/routes/plan?driver_email=${user.email}`,
        formData
      );
      setRoute(response.data);
      toast.success("Route planned successfully!");
    } catch (error) {
      toast.error("Failed to plan route");
    } finally {
      setLoading(false);
    }
  };

  const popularRoutes = [
    { origin_address: "Dallas, TX", destination_address: "Atlanta, GA", origin_lat: 32.7767, origin_lng: -96.7970, dest_lat: 33.7490, dest_lng: -84.3880 },
    { origin_address: "Los Angeles, CA", destination_address: "Phoenix, AZ", origin_lat: 34.0522, origin_lng: -118.2437, dest_lat: 33.4484, dest_lng: -112.0740 },
    { origin_address: "Chicago, IL", destination_address: "Detroit, MI", origin_lat: 41.8781, origin_lng: -87.6298, dest_lat: 42.3314, dest_lng: -83.0458 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Route className="w-6 h-6 text-blue-600" />
            Truck Route Planner
          </h3>
          <p className="text-slate-600">Plan routes with truck-specific restrictions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Form */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Your Route</CardTitle>
            <CardDescription>Enter your trip details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Origin</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.origin_address}
                  onChange={(e) => setFormData({ ...formData, origin_address: e.target.value })}
                  placeholder="e.g., Dallas, TX"
                  data-testid="route-origin"
                />
                <Button variant="outline" size="icon">
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Destination</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.destination_address}
                  onChange={(e) => setFormData({ ...formData, destination_address: e.target.value })}
                  placeholder="e.g., Atlanta, GA"
                  data-testid="route-destination"
                />
                <Button variant="outline" size="icon">
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Truck Height (ft)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.truck_height_ft}
                  onChange={(e) => setFormData({ ...formData, truck_height_ft: parseFloat(e.target.value) })}
                  data-testid="truck-height"
                />
              </div>
              <div>
                <Label>Truck Weight (lbs)</Label>
                <Input
                  type="number"
                  value={formData.truck_weight_lbs}
                  onChange={(e) => setFormData({ ...formData, truck_weight_lbs: parseInt(e.target.value) })}
                  data-testid="truck-weight"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hazmat"
                  checked={formData.hazmat}
                  onCheckedChange={(checked) => setFormData({ ...formData, hazmat: checked })}
                />
                <Label htmlFor="hazmat" className="cursor-pointer">Hazmat Load</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="avoid-tolls"
                  checked={formData.avoid_tolls}
                  onCheckedChange={(checked) => setFormData({ ...formData, avoid_tolls: checked })}
                />
                <Label htmlFor="avoid-tolls" className="cursor-pointer">Avoid Tolls</Label>
              </div>
            </div>

            <Button 
              onClick={planRoute} 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
              data-testid="plan-route-btn"
            >
              {loading ? (
                "Planning Route..."
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Plan Route
                </>
              )}
            </Button>

            {/* Popular Routes */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Popular Routes:</p>
              <div className="flex flex-wrap gap-2">
                {popularRoutes.map((r, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      origin_address: r.origin_address,
                      destination_address: r.destination_address,
                      origin_lat: r.origin_lat,
                      origin_lng: r.origin_lng,
                      destination_lat: r.dest_lat,
                      destination_lng: r.dest_lng
                    })}
                  >
                    {r.origin_address} → {r.destination_address}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Results */}
        <Card>
          <CardHeader>
            <CardTitle>Route Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!route ? (
              <div className="text-center py-12 text-slate-500">
                <Truck className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Enter your route details and click "Plan Route"</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-black text-blue-600">{route.total_distance}</p>
                    <p className="text-sm text-slate-600">Miles</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-black text-green-600">
                      {Math.floor(route.total_duration / 60)}h {Math.round(route.total_duration % 60)}m
                    </p>
                    <p className="text-sm text-slate-600">Drive Time</p>
                  </div>
                </div>

                {/* Restrictions */}
                {route.restrictions?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-bold flex items-center gap-2 text-amber-700 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Route Restrictions
                    </h4>
                    <ul className="space-y-1">
                      {route.restrictions.map((r, idx) => (
                        <li key={idx} className="text-sm text-amber-600">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Fuel Stops */}
                {route.fuel_stops?.length > 0 && (
                  <div>
                    <h4 className="font-bold flex items-center gap-2 mb-2">
                      <Fuel className="w-4 h-4 text-amber-600" />
                      Recommended Fuel Stops
                    </h4>
                    <div className="space-y-2">
                      {route.fuel_stops.map((stop, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                          <div>
                            <p className="font-medium">{stop.name}</p>
                            <p className="text-sm text-slate-500">Mile {stop.mile}</p>
                          </div>
                          <Badge className="bg-green-500">${stop.fuel_price}/gal</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rest Stops */}
                {route.rest_stops?.length > 0 && (
                  <div>
                    <h4 className="font-bold flex items-center gap-2 mb-2">
                      <Coffee className="w-4 h-4 text-blue-600" />
                      HOS Rest Stops
                    </h4>
                    <div className="space-y-2">
                      {route.rest_stops.map((stop, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                          <div>
                            <p className="font-medium">{stop.name}</p>
                            <p className="text-sm text-slate-500">Mile {stop.mile}</p>
                          </div>
                          <div className="flex gap-1">
                            {stop.amenities?.map((a, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
