import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { DollarSign, Plus, Fuel, CreditCard, Utensils, Wrench, TrendingUp } from "lucide-react";

export default function ExpenseTracker() {
  const { user } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, by_category: {}, count: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: "fuel",
    amount: "",
    description: "",
    location: ""
  });

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API}/expenses/${user.email}`);
      setExpenses(response.data);
    } catch (error) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/expenses/${user.email}/summary`);
      setSummary(response.data);
    } catch (error) {
      console.error("Failed to load summary");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expenses?driver_email=${user.email}`, {
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      });
      toast.success("Expense logged successfully!");
      setShowAddDialog(false);
      setNewExpense({ category: "fuel", amount: "", description: "", location: "" });
      fetchExpenses();
      fetchSummary();
    } catch (error) {
      toast.error("Failed to log expense");
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "fuel": return <Fuel className="w-5 h-5 text-primary" />;
      case "tolls": return <CreditCard className="w-5 h-5 text-secondary" />;
      case "food": return <Utensils className="w-5 h-5 text-yellow-500" />;
      case "maintenance": return <Wrench className="w-5 h-5 text-destructive" />;
      default: return <DollarSign className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="total-expenses">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mono text-primary">${summary.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.count} transactions</p>
          </CardContent>
        </Card>

        {Object.entries(summary.by_category).slice(0, 3).map(([category, amount]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                {getCategoryIcon(category)}
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mono">${amount.toFixed(2)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Expense Button */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button className="btn-primary" data-testid="add-expense-btn">
            <Plus className="w-5 h-5 mr-2" />
            Log Expense
          </Button>
        </DialogTrigger>
        <DialogContent data-testid="add-expense-dialog">
          <DialogHeader>
            <DialogTitle>Log New Expense</DialogTitle>
            <DialogDescription>Track your expenses for better financial management</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="expense-category"
              >
                <option value="fuel">Fuel</option>
                <option value="tolls">Tolls</option>
                <option value="parking">Parking</option>
                <option value="food">Food</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                required
                placeholder="0.00"
                data-testid="expense-amount"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                required
                placeholder="e.g., Diesel fill-up"
                data-testid="expense-description"
              />
            </div>
            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={newExpense.location}
                onChange={(e) => setNewExpense({ ...newExpense, location: e.target.value })}
                placeholder="e.g., Dallas, TX"
                data-testid="expense-location"
              />
            </div>
            <Button type="submit" className="w-full btn-primary" data-testid="submit-expense-btn">
              Log Expense
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Your transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading expenses...</p>
          ) : expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No expenses logged yet</p>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <Card key={expense.id} className="bg-accent/50" data-testid={`expense-${expense.id}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(expense.category)}
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.location && `${expense.location} • `}
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold mono text-primary">${expense.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{expense.category}</p>
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
