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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{user.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900" data-testid="admin-name">{user.name}</h2>
              <p className="text-sm text-slate-500">Administrator</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} data-testid="logout-btn" className="border-slate-300 text-slate-700 hover:bg-slate-100">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-blue-50 border-blue-200" data-testid="stat-spots">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Total Spots</CardTitle>
                <MapPin className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mono text-blue-600">{stats.total_spots}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.active_spots} active
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200" data-testid="stat-bookings">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Total Bookings</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mono text-green-600">{stats.total_bookings}</div>
                <p className="text-xs text-slate-500 mt-1">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200" data-testid="stat-revenue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Total Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mono text-purple-600">${stats.total_revenue.toFixed(2)}</div>
                <p className="text-xs text-slate-500 mt-1">
                  From paid bookings
                </p>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200" data-testid="stat-users">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Total Users</CardTitle>
                <Users className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mono text-amber-600">{users.length}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {users.filter(u => u.role === 'driver').length} drivers, {users.filter(u => u.role === 'partner').length} partners
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Table */}
        <Card className="bg-white border-slate-200" data-testid="users-table">
          <CardHeader>
            <CardTitle className="text-slate-900">All Users</CardTitle>
            <CardDescription className="text-slate-500">Manage drivers, partners, and admins</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-slate-500 py-8">Loading users...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-4 font-bold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-700">Email</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-700">Role</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-700">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`user-row-${u.id}`}>
                        <td className="py-3 px-4 text-slate-900">{u.name}</td>
                        <td className="py-3 px-4 text-slate-500">{u.email}</td>
                        <td className="py-3 px-4">
                          <Badge className={
                            u.role === 'admin' ? 'bg-red-500 text-white' :
                            u.role === 'partner' ? 'bg-green-500 text-white' :
                            'bg-blue-500 text-white'
                          }>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
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
