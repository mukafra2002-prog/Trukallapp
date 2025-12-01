import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { LogOut, Users, MapPin, DollarSign, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/stats?admin_email=${user.email}`);
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard stats");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users?admin_email=${user.email}`);
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-destructive">{user.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold" data-testid="admin-name">{user.name}</h2>
              <p className="text-sm text-muted-foreground">Administrator</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} data-testid="logout-btn">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card data-testid="stat-spots">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spots</CardTitle>
                <MapPin className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mono">{stats.total_spots}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.active_spots} active
                </p>
              </CardContent>
            </Card>

            <Card data-testid="stat-bookings">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <TrendingUp className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mono">{stats.total_bookings}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card data-testid="stat-revenue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mono text-primary">${stats.total_revenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From paid bookings
                </p>
              </CardContent>
            </Card>

            <Card data-testid="stat-users">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mono">{users.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {users.filter(u => u.role === 'driver').length} drivers, {users.filter(u => u.role === 'partner').length} partners
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Table */}
        <Card data-testid="users-table">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage drivers, partners, and admins</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading users...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 font-bold">Name</th>
                      <th className="text-left py-3 px-4 font-bold">Email</th>
                      <th className="text-left py-3 px-4 font-bold">Role</th>
                      <th className="text-left py-3 px-4 font-bold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-accent" data-testid={`user-row-${u.id}`}>
                        <td className="py-3 px-4">{u.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                        <td className="py-3 px-4">
                          <Badge className={
                            u.role === 'admin' ? 'bg-destructive' :
                            u.role === 'partner' ? 'bg-secondary' :
                            'bg-primary'
                          }>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
