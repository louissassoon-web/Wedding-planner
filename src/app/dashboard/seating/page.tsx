"use client";

import { useState } from "react";
import { Plus, Grid3X3, Users, MoreHorizontal } from "lucide-react";
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

interface Table {
  id: string;
  name: string;
  capacity: number;
  guests: string[];
}

const initialTables: Table[] = [];

export default function SeatingPage() {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTable, setNewTable] = useState({
    name: "",
    capacity: "10",
  });

  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const totalSeated = tables.reduce((sum, t) => sum + t.guests.length, 0);

  const addTable = () => {
    if (!newTable.name.trim()) return;
    const table: Table = {
      id: Date.now().toString(),
      name: newTable.name,
      capacity: parseInt(newTable.capacity) || 10,
      guests: [],
    };
    setTables([...tables, table]);
    setNewTable({ name: "", capacity: "10" });
    setIsAddDialogOpen(false);
  };

  const deleteTable = (id: string) => {
    setTables(tables.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Seating Plan</h1>
          <p className="mt-1 text-muted-foreground">
            Arrange your guests at tables
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Table Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Table 1, Head Table"
                  value={newTable.name}
                  onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addTable}>Add Table</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tables</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{tables.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Capacity</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{totalCapacity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sage-500" />
              <span className="text-sm text-muted-foreground">Seated</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{totalSeated}</p>
          </CardContent>
        </Card>
      </div>

      {tables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Grid3X3 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No tables yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add tables to start creating your seating plan.
            </p>
            <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
              Add Table
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <Card key={table.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{table.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Assign Guests</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteTable(table.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">
                    {table.guests.length} / {table.capacity}
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${(table.guests.length / table.capacity) * 100}%`,
                    }}
                  />
                </div>
                {table.guests.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground text-center">
                    No guests assigned
                  </p>
                ) : (
                  <div className="mt-3 space-y-1">
                    {table.guests.map((guest, i) => (
                      <p key={i} className="text-sm">
                        {guest}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
