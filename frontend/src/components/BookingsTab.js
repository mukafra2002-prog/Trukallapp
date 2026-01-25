import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BookingsTab({ bookings = [] }) {
  const { t } = useTranslation();

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{t('tabs.bookings')}</CardTitle>
          <CardDescription>{t('bookings.description', 'Your parking history and upcoming reservations')}</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('bookings.noBookings', 'No bookings yet')}</p>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} data-testid={`booking-${booking.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{booking.spot_name}</CardTitle>
                        <CardDescription>{booking.spot_address}</CardDescription>
                      </div>
                      <Badge className={booking.payment_status === 'paid' ? 'bg-secondary' : 'bg-yellow-500'}>
                        {booking.payment_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t('bookings.checkIn', 'Check-in')}</p>
                        <p className="font-bold mono">{new Date(booking.check_in_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('bookings.checkOut', 'Check-out')}</p>
                        <p className="font-bold mono">{new Date(booking.check_out_date).toLocaleDateString()}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">{t('bookings.totalPaid', 'Total Paid')}</p>
                        <p className="font-bold mono text-primary text-2xl">${booking.total_price}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
