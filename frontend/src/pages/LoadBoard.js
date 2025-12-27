import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Truck, MapPin, DollarSign, Calendar, Weight, ArrowRight, Search } from "lucide-react";

export default function LoadBoard() {
  const { user } = useContext(AuthContext);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    origin_state: "",
    destination_state: "",
    equipment_type: ""
  });

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      const params = {};
      if (filters.origin_state) params.origin_state = filters.origin_state;
      if (filters.destination_state) params.destination_state = filters.destination_state;
      if (filters.equipment_type) params.equipment_type = filters.equipment_type;

      const response = await axios.get(`${API}/loads`, { params });
      setLoads(response.data);
    } catch (error) {
      toast.error("Failed to load available loads");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLoads();
  };

  const getEquipmentBadge = (type) => {
    const colors = {
      dry_van: "bg-blue-500/20 text-blue-400",
      reefer: "bg-cyan-500/20 text-cyan-400",
      flatbed: "bg-orange-500/20 text-orange-400",
      stepdeck: "bg-purple-500/20 text-purple-400"
    };
    return colors[type] || "bg-gray-500/20 text-gray-400";
  };

  return (
    <div className="space-y-6">
      <Card data-testid="load-board-header">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            Load Board
          </CardTitle>
          <CardDescription>Find paying loads while you find parking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="Origin State (e.g., TX)"
              value={filters.origin_state}
              onChange={(e) => setFilters({ ...filters, origin_state: e.target.value })}
              className="touch-target"
              data-testid="origin-state-filter"
            />
            <Input
              placeholder="Destination State (e.g., GA)"
              value={filters.destination_state}
              onChange={(e) => setFilters({ ...filters, destination_state: e.target.value })}
              className="touch-target"
              data-testid="dest-state-filter"
            />
            <select
              value={filters.equipment_type}
              onChange={(e) => setFilters({ ...filters, equipment_type: e.target.value })}
              className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="equipment-filter"
            >
              <option value="">All Equipment</option>
              <option value="dry_van">Dry Van</option>
              <option value="reefer">Reefer</option>
              <option value="flatbed">Flatbed</option>
              <option value="stepdeck">Stepdeck</option>
            </select>
            <Button onClick={handleSearch} className="btn-primary" data-testid="search-loads-btn">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading available loads...</p>
        ) : loads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground">No loads found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          loads.map((load) => (
            <Card key={load.id} className="card-hover" data-testid={`load-card-${load.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge className={getEquipmentBadge(load.equipment_type)}>
                      {load.equipment_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className="bg-secondary/20 text-secondary">
                      ${load.rate.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Per Mile</p>
                    <p className="text-2xl font-bold mono text-primary">
                      ${(load.rate / load.distance).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ORIGIN</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-bold">{load.origin_city}, {load.origin_state}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      <span className="mono font-bold">{load.distance} mi</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">DESTINATION</p>
                    <div className="flex items-center gap-2 justify-end">
                      <MapPin className="w-4 h-4 text-secondary" />
                      <span className="font-bold">{load.destination_city}, {load.destination_state}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-white/10">
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(load.pickup_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(load.delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Weight className="w-3 h-3" />
                      {load.weight.toLocaleString()} lbs
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="text-sm font-medium">{load.contact_name}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{load.contact_phone}</p>
                  <Button variant="outline" onClick={() => toast.success(`Contact ${load.contact_name} at ${load.contact_phone}`)}>
                    Contact Broker
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
