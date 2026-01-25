import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  DollarSign, Fuel, Utensils, Wrench, Car, 
  Building, FileText, Plus, Trash2, Calendar,
  TrendingUp, TrendingDown, PieChart, Download
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  { id: 'fuel', label: 'Fuel', icon: Fuel, color: 'bg-blue-500', textColor: 'text-blue-600' },
  { id: 'food', label: 'Food & Meals', icon: Utensils, color: 'bg-orange-500', textColor: 'text-orange-600' },
  { id: 'repairs', label: 'Repairs & Maintenance', icon: Wrench, color: 'bg-red-500', textColor: 'text-red-600' },
  { id: 'tolls', label: 'Tolls', icon: Car, color: 'bg-purple-500', textColor: 'text-purple-600' },
  { id: 'parking', label: 'Parking', icon: Building, color: 'bg-green-500', textColor: 'text-green-600' },
  { id: 'lodging', label: 'Lodging', icon: Building, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
  { id: 'supplies', label: 'Supplies & Equipment', icon: FileText, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { id: 'other', label: 'Other', icon: DollarSign, color: 'bg-gray-500', textColor: 'text-gray-600' },
];

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'fuel',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: ''
  });
  const [filterPeriod, setFilterPeriod] = useState('month');

  useEffect(() => {
    const saved = localStorage.getItem('trukall_expenses');
    if (saved) {
      setExpenses(JSON.parse(saved));
    }
  }, []);

  const saveExpenses = (updatedExpenses) => {
    setExpenses(updatedExpenses);
    localStorage.setItem('trukall_expenses', JSON.stringify(updatedExpenses));
  };

  const addExpense = () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const expense = {
      id: Date.now(),
      ...newExpense,
      amount: parseFloat(newExpense.amount),
      createdAt: new Date().toISOString()
    };

    const updated = [expense, ...expenses];
    saveExpenses(updated);
    toast.success('Expense added!');
    
    setNewExpense({
      category: 'fuel',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      location: ''
    });
    setShowAddForm(false);
  };

  const deleteExpense = (id) => {
    const updated = expenses.filter(e => e.id !== id);
    saveExpenses(updated);
    toast.success('Expense deleted');
  };

  const getFilteredExpenses = () => {
    const now = new Date();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      switch (filterPeriod) {
        case 'week':
          const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
          return expenseDate >= weekAgo;
        case 'month':
          return expenseDate.getMonth() === now.getMonth() && 
                 expenseDate.getFullYear() === now.getFullYear();
        case 'year':
          return expenseDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  };

  const getTotalByCategory = () => {
    const filtered = getFilteredExpenses();
    const totals = {};
    EXPENSE_CATEGORIES.forEach(cat => {
      totals[cat.id] = filtered
        .filter(e => e.category === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);
    });
    return totals;
  };

  const getGrandTotal = () => {
    return getFilteredExpenses().reduce((sum, e) => sum + e.amount, 0);
  };

  const getCategoryIcon = (categoryId) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.icon : DollarSign;
  };

  const getCategoryColor = (categoryId) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.color : 'bg-gray-500';
  };

  const getCategoryLabel = (categoryId) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.label : categoryId;
  };

  const exportExpenses = () => {
    const filtered = getFilteredExpenses();
    const csv = [
      ['Date', 'Category', 'Amount', 'Description', 'Location'].join(','),
      ...filtered.map(e => [
        e.date,
        getCategoryLabel(e.category),
        e.amount.toFixed(2),
        `"${e.description || ''}"`,
        `"${e.location || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trukall_expenses_${filterPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Expenses exported!');
  };

  const categoryTotals = getTotalByCategory();
  const grandTotal = getGrandTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Expense Tracker
          </CardTitle>
          <CardDescription>
            Track all expenses by category. Export for tax deductions.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Period Filter & Add Button */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-2">
          {['week', 'month', 'year', 'all'].map(period => (
            <Button
              key={period}
              variant={filterPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPeriod(period)}
              className={filterPeriod === period ? 'bg-green-600' : ''}
            >
              {period === 'all' ? 'All Time' : `This ${period.charAt(0).toUpperCase() + period.slice(1)}`}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportExpenses}>
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-green-600">
            <Plus className="w-4 h-4 mr-1" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <Card className="border-green-300">
          <CardHeader>
            <CardTitle className="text-lg">Add New Expense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {EXPENSE_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.id}
                      variant={newExpense.category === cat.id ? 'default' : 'outline'}
                      className={`flex flex-col h-auto py-3 ${newExpense.category === cat.id ? cat.color : ''}`}
                      onClick={() => setNewExpense({...newExpense, category: cat.id})}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs">{cat.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  className="text-lg font-semibold"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Date</label>
                <Input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Description (Optional)</label>
              <Input
                placeholder="e.g., Diesel at Flying J"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Location (Optional)</label>
              <Input
                placeholder="e.g., Dallas, TX"
                value={newExpense.location}
                onChange={(e) => setNewExpense({...newExpense, location: e.target.value})}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={addExpense} className="flex-1 bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Grand Total */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Expenses</p>
                <p className="text-4xl font-bold">${grandTotal.toFixed(2)}</p>
                <p className="text-slate-400 text-sm mt-1">
                  {getFilteredExpenses().length} transactions
                </p>
              </div>
              <PieChart className="w-12 h-12 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        {/* Top Category */}
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-sm mb-2">Top Category</p>
            {Object.entries(categoryTotals).length > 0 && (
              (() => {
                const topCat = Object.entries(categoryTotals)
                  .filter(([_, total]) => total > 0)
                  .sort((a, b) => b[1] - a[1])[0];
                
                if (!topCat) return <p className="text-gray-400">No expenses yet</p>;
                
                const [catId, total] = topCat;
                const cat = EXPENSE_CATEGORIES.find(c => c.id === catId);
                const Icon = cat?.icon || DollarSign;
                
                return (
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${cat?.color || 'bg-gray-500'}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{cat?.label}</p>
                      <p className="text-2xl font-bold">${total.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Breakdown by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {EXPENSE_CATEGORIES.map(cat => {
              const total = categoryTotals[cat.id] || 0;
              const percentage = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
              const Icon = cat.icon;
              
              return (
                <div key={cat.id} className="flex items-center gap-3">
                  <div className={`p-2 rounded ${cat.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{cat.label}</span>
                      <span className="text-sm font-semibold">${total.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${cat.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {getFilteredExpenses().length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No expenses recorded for this period</p>
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={() => setShowAddForm(true)}
              >
                Add Your First Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {getFilteredExpenses().slice(0, 10).map(expense => {
                const Icon = getCategoryIcon(expense.category);
                return (
                  <div 
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${getCategoryColor(expense.category)}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{getCategoryLabel(expense.category)}</p>
                        <p className="text-sm text-gray-500">
                          {expense.description || expense.location || new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">${expense.amount.toFixed(2)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteExpense(expense.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Tip */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-700">Tax Deduction Tip</p>
              <p className="text-sm text-blue-600">
                Most trucking expenses are tax-deductible! Export your expenses monthly 
                and keep receipts for fuel, meals (50% deductible), repairs, and tolls.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
