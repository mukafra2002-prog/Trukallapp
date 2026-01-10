import { useState, useEffect, useContext } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Bell, MapPin, Users, AlertTriangle, Check, Trash2, X } from "lucide-react";

export default function NotificationBell() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      
      // Poll for new notifications every 10 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API}/notifications/${user.email}?limit=20`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to load notifications");
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API}/notifications/${user.email}/count`);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Failed to load notification count");
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read?driver_email=${user.email}`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/notifications/${user.email}/read-all`);
      fetchNotifications();
      fetchUnreadCount();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${API}/notifications/${notificationId}?driver_email=${user.email}`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "location_share":
        return <MapPin className="w-4 h-4 text-blue-500" />;
      case "convoy_join":
        return <Users className="w-4 h-4 text-green-500" />;
      case "sos_alert":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Handle navigation based on notification type
    if (notification.type === "location_share" && notification.data?.latitude) {
      window.open(
        `https://www.google.com/maps?q=${notification.data.latitude},${notification.data.longitude}`,
        '_blank'
      );
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="notification-bell"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
              data-testid="notification-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto"
        data-testid="notification-dropdown"
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700"
              data-testid="mark-all-read"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
