import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, MapPin, DollarSign, Shield, Droplets, Utensils, Fuel, Wifi, Calendar, Star } from "lucide-react";
import SpotReviews from "@/components/SpotReviews";

export default function ParkingDetails() {
  const { spotId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchSpot();
    // Set default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCheckInDate(today.toISOString().split('T')[0]);
    setCheckOutDate(tomorrow.toISOString().split('T')[0]);
  }, [spotId]);

  const fetchSpot = async () => {
    try {
      const response = await axios.get(`${API}/spots/${spotId}`);
      setSpot(response.data);
    } catch (error) {
      toast.error("Failed to load parking spot details");
      navigate('/driver');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error("Please login to book");
      navigate('/');
      return;
    }

    if (!checkInDate || !checkOutDate) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    setBooking(true);
    try {
      const bookingData = {
        spot_id: spotId,
        check_in_date: new Date(checkInDate).toISOString(),
        check_out_date: new Date(checkOutDate).toISOString()
      };

      const response = await axios.post(
        `${API}/bookings?driver_email=${user.email}`,
        bookingData
      );

      const bookingId = response.data.id;

      // If not free, initiate payment
      if (spot.price_per_night > 0) {
        const paymentResponse = await axios.post(
          `${API}/payments/create-checkout?booking_id=${bookingId}`
        );
        window.location.href = paymentResponse.data.url;
      } else {
        toast.success("Booking confirmed! (Free parking)");
        navigate('/driver');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case 'shower': return <Droplets className="w-5 h-5" />;
      case 'restroom': return <Droplets className="w-5 h-5" />;
      case 'food': return <Utensils className="w-5 h-5" />;
      case 'fuel': return <Fuel className="w-5 h-5" />;
      case 'wifi': return <Wifi className="w-5 h-5" />;
      case 'security': return <Shield className="w-5 h-5" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-2xl font-bold text-primary">Loading...</p>
      </div>
    );
  }

  if (!spot) {
    return null;
  }

  const days = Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));
  const totalPrice = spot.is_free ? 0 : spot.price_per_night * (days > 0 ? days : 1);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4">
        <div className="max-w-7xl mx-auto">
          <Button variant="outline" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-6 mt-6">
        {/* Main Info */}
        <Card data-testid="spot-details">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{spot.name}</CardTitle>
                <CardDescription className="text-lg">
                  <MapPin className="inline w-5 h-5 mr-1" />
                  {spot.address}, {spot.city}, {spot.state}
                </CardDescription>
              </div>
              {spot.available_spaces > 0 ? (
                <Badge className="status-available text-lg px-4 py-2">Available</Badge>
              ) : (
                <Badge className="status-full text-lg px-4 py-2">Full</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing */}
            <div className="bg-accent p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg text-muted-foreground">Price per Night</span>
                <span className="text-4xl font-black mono text-primary">
                  {spot.is_free ? "FREE" : `$${spot.price_per_night}`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Available Spaces</p>
                  <p className="text-2xl font-bold mono">{spot.available_spaces}/{spot.total_spaces}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Security Level</p>
                  <p className="text-2xl font-bold uppercase">{spot.security_level}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {spot.description && (
              <div>
                <h3 className="text-xl font-bold mb-2">About This Location</h3>
                <p className="text-muted-foreground">{spot.description}</p>
              </div>
            )}

            {/* Amenities */}
            <div>
              <h3 className="text-xl font-bold mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {spot.amenities.map((amenity) => (
                  <div key={amenity} className="amenity-badge bg-accent text-foreground">
                    {getAmenityIcon(amenity)}
                    <span className="capitalize">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fuel Prices */}
            {(spot.fuel_price_diesel || spot.fuel_price_unleaded) && (
              <div>
                <h3 className="text-xl font-bold mb-4">Fuel Prices</h3>
                <div className="grid grid-cols-2 gap-4">
                  {spot.fuel_price_diesel && (
                    <div className="bg-accent p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Diesel</p>
                      <p className="fuel-price text-primary">${spot.fuel_price_diesel}</p>
                    </div>
                  )}
                  {spot.fuel_price_unleaded && (
                    <div className="bg-accent p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Unleaded</p>
                      <p className="fuel-price text-primary">${spot.fuel_price_unleaded}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Form */}
        {user?.role === 'driver' && spot.available_spaces > 0 && (
          <Card data-testid="booking-form">
            <CardHeader>
              <CardTitle className="text-2xl">Reserve Your Spot</CardTitle>
              <CardDescription>Select your check-in and check-out dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="check-in">Check-in Date</Label>
                    <input
                      id="check-in"
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      data-testid="check-in-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="check-out">Check-out Date</Label>
                    <input
                      id="check-out"
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      data-testid="check-out-date"
                    />
                  </div>
                </div>

                <div className="bg-accent p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">Nights</span>
                    <span className="text-2xl font-bold mono">{days > 0 ? days : 1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg">Total Price</span>
                    <span className="text-4xl font-black mono text-primary">
                      {totalPrice === 0 ? "FREE" : `$${totalPrice.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={booking || spot.available_spaces === 0}
                  className="w-full btn-primary"
                  data-testid="confirm-booking-btn"
                >
                  {booking ? "Processing..." : totalPrice === 0 ? "Confirm Booking" : "Proceed to Payment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Community Reviews */}
        <Card data-testid="reviews-section">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Star className="w-6 h-6 text-primary" />
              Driver Reviews
            </CardTitle>
            <CardDescription>See what other drivers say about this location</CardDescription>
          </CardHeader>
          <CardContent>
            <SpotReviews spotId={spotId} spotName={spot.name} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
