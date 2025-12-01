import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Plus, LogOut, Edit, DollarSign, MapPin } from "lucide-react";

export default function PartnerDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [spots, setSpots] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newSpot, setNewSpot] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    latitude: 0,
    longitude: 0,
    total_spaces: 10,
    price_per_night: 0,
    amenities: [],
    is_free: false,
    security_level: "medium",
    description: "",
    fuel_price_diesel: null,
    fuel_price_unleaded: null
  });

  const amenityOptions = ["shower", "restroom", "food", "fuel", "security", "wifi"];

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      const response = await axios.get(`${API}/spots/partner/${user.email}`);
      setSpots(response.data);
    } catch (error) {
      toast.error("Failed to load your parking spots");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpot = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/spots?partner_email=${user.email}`, newSpot);
      toast.success("Parking spot added successfully!");
      setShowAddDialog(false);
      fetchSpots();
      // Reset form
      setNewSpot({
        name: "",
        address: "",
        city: "",
        state: "",
        latitude: 0,
        longitude: 0,
        total_spaces: 10,
        price_per_night: 0,
        amenities: [],
        is_free: false,
        security_level: "medium",
        description: "",
        fuel_price_diesel: null,
        fuel_price_unleaded: null
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add parking spot");
    }
  };

  const toggleAmenity = (amenity) => {
    const current = newSpot.amenities;
    if (current.includes(amenity)) {
      setNewSpot({ ...newSpot, amenities: current.filter(a => a !== amenity) });
    } else {
      setNewSpot({ ...newSpot, amenities: [...current, amenity] });
    }
  };

  const totalRevenue = spots.reduce((sum, spot) => {
    const occupiedSpaces = spot.total_spaces - spot.available_spaces;
    return sum + (occupiedSpaces * spot.price_per_night);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-secondary">{user.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold" data-testid="partner-name">{user.name}</h2>
              <p className="text-sm text-muted-foreground">Parking Partner</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} data-testid="logout-btn">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card data-testid="stat-total-spots">
            <CardHeader>
              <CardTitle className="text-3xl mono">{spots.length}</CardTitle>
              <CardDescription>Total Parking Spots</CardDescription>
            </CardHeader>
          </Card>
          <Card data-testid="stat-total-spaces">
            <CardHeader>
              <CardTitle className="text-3xl mono">{spots.reduce((sum, s) => sum + s.total_spaces, 0)}</CardTitle>
              <CardDescription>Total Spaces</CardDescription>
            </CardHeader>
          </Card>
          <Card data-testid="stat-revenue">
            <CardHeader>
              <CardTitle className="text-3xl mono text-primary">${totalRevenue.toFixed(2)}</CardTitle>
              <CardDescription>Estimated Revenue</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Add Spot Button */}
        <div className="mb-6">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="add-spot-btn">
                <Plus className="w-5 h-5 mr-2" />
                Add Parking Spot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="add-spot-dialog">
              <DialogHeader>
                <DialogTitle>Add New Parking Spot</DialogTitle>
                <DialogDescription>Fill in the details for your parking location</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSpot} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Spot Name *</Label>
                    <Input
                      id="name"
                      value={newSpot.name}
                      onChange={(e) => setNewSpot({ ...newSpot, name: e.target.value })}
                      required
                      placeholder="Highway 45 Truck Stop"
                      data-testid="spot-name-input"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={newSpot.address}
                      onChange={(e) => setNewSpot({ ...newSpot, address: e.target.value })}
                      required
                      placeholder="123 Highway 45"
                      data-testid="spot-address-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={newSpot.city}
                      onChange={(e) => setNewSpot({ ...newSpot, city: e.target.value })}
                      required
                      placeholder="Dallas"
                      data-testid="spot-city-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={newSpot.state}
                      onChange={(e) => setNewSpot({ ...newSpot, state: e.target.value })}
                      required
                      placeholder="TX"
                      maxLength="2"
                      data-testid="spot-state-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="latitude">Latitude *</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={newSpot.latitude}
                      onChange={(e) => setNewSpot({ ...newSpot, latitude: parseFloat(e.target.value) })}
                      required
                      placeholder="32.7767"
                      data-testid="spot-lat-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude *</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={newSpot.longitude}
                      onChange={(e) => setNewSpot({ ...newSpot, longitude: parseFloat(e.target.value) })}
                      required
                      placeholder="-96.7970"
                      data-testid="spot-lng-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_spaces">Total Spaces *</Label>
                    <Input
                      id="total_spaces"
                      type="number"
                      value={newSpot.total_spaces}
                      onChange={(e) => setNewSpot({ ...newSpot, total_spaces: parseInt(e.target.value) })}
                      required
                      min="1"
                      data-testid="spot-spaces-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price per Night ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newSpot.price_per_night}
                      onChange={(e) => setNewSpot({ ...newSpot, price_per_night: parseFloat(e.target.value) })}
                      required
                      min="0"
                      data-testid="spot-price-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="diesel">Diesel Price ($)</Label>
                    <Input
                      id="diesel"
                      type="number"
                      step="0.01"
                      value={newSpot.fuel_price_diesel || ''}
                      onChange={(e) => setNewSpot({ ...newSpot, fuel_price_diesel: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="3.89"
                      data-testid="spot-diesel-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unleaded">Unleaded Price ($)</Label>
                    <Input
                      id="unleaded"
                      type="number"
                      step="0.01"
                      value={newSpot.fuel_price_unleaded || ''}
                      onChange={(e) => setNewSpot({ ...newSpot, fuel_price_unleaded: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="3.29"
                      data-testid="spot-unleaded-input"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      value={newSpot.description}
                      onChange={(e) => setNewSpot({ ...newSpot, description: e.target.value })}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Well-lit parking area with 24/7 security..."
                      data-testid="spot-description-input"
                    />
                  </div>
                  <div>
                    <Label>Security Level</Label>
                    <select
                      value={newSpot.security_level}
                      onChange={(e) => setNewSpot({ ...newSpot, security_level: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      data-testid="spot-security-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="is_free"
                      checked={newSpot.is_free}
                      onCheckedChange={(checked) => setNewSpot({ ...newSpot, is_free: checked })}
                      data-testid="spot-free-checkbox"
                    />
                    <Label htmlFor="is_free" className="cursor-pointer">Free Parking</Label>
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-2 block">Amenities</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {amenityOptions.map((amenity) => (
                        <div key={amenity} className="flex items-center gap-2">
                          <Checkbox
                            id={`amenity-${amenity}`}
                            checked={newSpot.amenities.includes(amenity)}
                            onCheckedChange={() => toggleAmenity(amenity)}
                            data-testid={`amenity-${amenity}`}
                          />
                          <Label htmlFor={`amenity-${amenity}`} className="cursor-pointer capitalize">
                            {amenity}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full btn-primary" data-testid="submit-spot-btn">
                  Add Parking Spot
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Spots List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="col-span-full text-center text-muted-foreground">Loading your parking spots...</p>
          ) : spots.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <p className="text-lg text-muted-foreground mb-4">You haven't added any parking spots yet</p>
                <p className="text-sm text-muted-foreground">Click "Add Parking Spot" to get started</p>
              </CardContent>
            </Card>
          ) : (
            spots.map((spot) => (
              <Card key={spot.id} className="card-hover" data-testid={`partner-spot-${spot.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{spot.name}</CardTitle>
                      <CardDescription>{spot.city}, {spot.state}</CardDescription>
                    </div>
                    <Badge className={spot.status === 'active' ? 'bg-secondary' : 'bg-destructive'}>
                      {spot.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Occupancy</span>
                      <span className="font-bold mono">
                        {spot.total_spaces - spot.available_spaces}/{spot.total_spaces}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price/Night</span>
                      <span className="font-bold mono text-primary">
                        {spot.is_free ? "FREE" : `$${spot.price_per_night}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <span className="font-bold mono text-secondary">
                        ${((spot.total_spaces - spot.available_spaces) * spot.price_per_night).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
