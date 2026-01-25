import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, Star, Droplets, Utensils, Fuel, Wifi, Shield } from "lucide-react";

const getChainColor = (chainId) => {
  const colors = {
    'pilot_flying_j': 'bg-red-500',
    'loves': 'bg-yellow-500',
    'ta_petro': 'bg-blue-600',
    'speedway': 'bg-orange-500',
    'walmart': 'bg-blue-500',
    'lowes': 'bg-blue-700',
    'cracker_barrel': 'bg-amber-600',
    'cabelas': 'bg-green-700',
    'rest_area': 'bg-green-500'
  };
  return colors[chainId] || 'bg-gray-500';
};

const getAmenityIcon = (amenity) => {
  switch (amenity) {
    case 'shower': return <Droplets className="w-4 h-4" />;
    case 'restroom': return <Droplets className="w-4 h-4" />;
    case 'food': return <Utensils className="w-4 h-4" />;
    case 'fuel': return <Fuel className="w-4 h-4" />;
    case 'wifi': return <Wifi className="w-4 h-4" />;
    case 'security': return <Shield className="w-4 h-4" />;
    default: return null;
  }
};

export default function RetailParkingTab({ 
  retailParking = [], 
  retailChains = [], 
  selectedChain = "", 
  onChainSelect 
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-6 h-6" />
            {t('retail.title', 'Free Overnight Parking')}
          </CardTitle>
          <CardDescription>{t('retail.description', 'Find overnight parking at Walmart, Cracker Barrel, and more')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedChain === "" ? "default" : "outline"}
              size="sm"
              onClick={() => onChainSelect("")}
            >
              {t('common.all', 'All')}
            </Button>
            {retailChains.filter(c => c.overnight_friendly).map((chain) => (
              <Button
                key={chain.id}
                variant={selectedChain === chain.id ? "default" : "outline"}
                size="sm"
                onClick={() => onChainSelect(chain.id)}
              >
                {chain.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {retailParking.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center">
              <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t('retail.noLocations', 'No retail parking locations found')}</p>
            </CardContent>
          </Card>
        ) : (
          retailParking.map((location) => (
            <Card key={location.id} className="overflow-hidden" data-testid={`retail-${location.id}`}>
              <div className={`h-2 ${getChainColor(location.chain)}`}></div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <CardDescription>{location.city}, {location.state}</CardDescription>
                  </div>
                  {location.community_verified && (
                    <Badge className="bg-green-500/20 text-green-600 text-xs">{t('retail.verified', 'Verified')}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{location.address}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">{location.average_rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({location.total_reviews} {t('retail.reviews', 'reviews')})</span>
                  </div>
                  {location.truck_parking_spaces && (
                    <Badge variant="outline">{location.truck_parking_spaces} {t('retail.spots', 'spots')}</Badge>
                  )}
                </div>

                {location.restrictions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {location.restrictions.map((restriction, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600">
                        {restriction.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                )}

                {location.amenities.length > 0 && (
                  <div className="flex gap-2">
                    {location.amenities.map((amenity, i) => (
                      <span key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                        {getAmenityIcon(amenity)} {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
