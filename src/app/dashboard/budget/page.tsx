"use client";

import { useState } from "react";
import { Plus, PoundSterling, TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BudgetItem {
  id: string;
  name: string;
  category: string;
  estimated: number;
  actual: number;
  paid: number;
  status: "unpaid" | "deposit" | "partial" | "paid";
}

const categories = [
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Flowers",
  "Music & Entertainment",
  "Attire",
  "Stationery",
  "Transport",
  "Decorations",
  "Gifts",
  "Other",
];

const initialItems: BudgetItem[] = [];

export default function BudgetPage() {
  const [items, setItems] = useState<BudgetItem[]>(initialItems);
  const [totalBudget, setTotalBudget] = useState(15000);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Venue",
    estimated: "",
    actual: "",
  });

  const totalEstimated = items.reduce((sum, item) => sum + item.estimated, 0);
  const totalActual = items.reduce((sum, item) => sum + item.actual, 0);
  const totalPaid = items.reduce((sum, item) => sum + item.paid, 0);
  const remaining = totalBudget - totalActual;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const addItem = () => {
    if (!newItem.name.trim()) return;
    const item: BudgetItem = {
      id: Date.now().toString(),
      name: newItem.name,
      category: newItem.category,
      estimated: parseFloat(newItem.estimated) || 0,
      actual: parseFloat(newItem.actual) || 0,
      paid: 0,
      status: "unpaid",
    };
    setItems([...items, item]);
    setNewItem({ name: "", category: "Venue", estimated: "", actual: "" });
    setIsAddDialogOpen(false);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const categoryTotals = categories.map((cat) => {
    const catItems = items.filter((i) => i.category === cat);
    return {
      category: cat,
      estimated: catItems.reduce((sum, i) => sum + i.estimated, 0),
      actual: catItems.reduce((sum, i) => sum + i.actual, 0),
      count: catItems.length,
    };
  }).filter((c) => c.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Budget</h1>
          <p className="mt-1 text-muted-foreground">
            Track your wedding expenses and payments
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Set Budget</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Total Budget</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="budget">Total Budget (£)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button onClick={() => setIsBudgetDialogOpen(false)}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Budget Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Venue deposit"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimated">Estimated (£)</Label>
                    <Input
                      id="estimated"
                      type="number"
                      value={newItem.estimated}
                      onChange={(e) => setNewItem({ ...newItem, estimated: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actual">Actual (£)</Label>
                    <Input
                      id="actual"
                      type="number"
                      value={newItem.actual}
                      onChange={(e) => setNewItem({ ...newItem, actual: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Budget</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Estimated</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(totalEstimated)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Spent</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${remaining >= 0 ? "bg-sage-500" : "bg-destructive"}`} />
              <span className="text-sm text-muted-foreground">Remaining</span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${remaining < 0 ? "text-destructive" : ""}`}>
              {formatCurrency(remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {totalBudget > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Used</span>
                <span>{Math.round((totalActual / totalBudget) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    totalActual / totalBudget > 1 ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min((totalActual / totalBudget) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PoundSterling className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No budget items yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first expense to start tracking your budget.
              </p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                Add Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryTotals.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between py-2 border-b">
                    <h4 className="font-medium">{cat.category}</h4>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(cat.actual)} / {formatCurrency(cat.estimated)}
                    </span>
                  </div>
                  <div className="divide-y">
                    {items
                      .filter((i) => i.category === cat.category)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-3 pl-4"
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Est: {formatCurrency(item.estimated)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(item.actual)}</p>
                              <p className="text-xs text-muted-foreground">
                                Paid: {formatCurrency(item.paid)}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Record Payment</DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteItem(item.id)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
