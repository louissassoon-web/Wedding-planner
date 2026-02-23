"use client";

import { useState } from "react";
import { Plus, Calendar, Clock, CheckCircle2, Circle, MoreHorizontal } from "lucide-react";
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

interface Milestone {
  id: string;
  title: string;
  description?: string;
  date: string;
  completed: boolean;
}

const weddingDate = new Date("2026-06-15");
const today = new Date();
const daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

const initialMilestones: Milestone[] = [
  { id: "1", title: "Set wedding date", date: "2026-02-15", completed: true },
  { id: "2", title: "Book venue", date: "2026-03-01", completed: false },
  { id: "3", title: "Send save the dates", date: "2026-03-15", completed: false },
  { id: "4", title: "Book photographer", date: "2026-04-01", completed: false },
  { id: "5", title: "Choose wedding party", date: "2026-04-15", completed: false },
  { id: "6", title: "Send invitations", date: "2026-04-30", completed: false },
  { id: "7", title: "Final dress fitting", date: "2026-06-01", completed: false },
  { id: "8", title: "Wedding day!", date: "2026-06-15", completed: false },
];

export default function TimelinePage() {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    date: "",
  });

  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const completedCount = milestones.filter((m) => m.completed).length;

  const toggleMilestone = (id: string) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim() || !newMilestone.date) return;
    const milestone: Milestone = {
      id: Date.now().toString(),
      title: newMilestone.title,
      description: newMilestone.description || undefined,
      date: newMilestone.date,
      completed: false,
    };
    setMilestones([...milestones, milestone]);
    setNewMilestone({ title: "", description: "", date: "" });
    setIsAddDialogOpen(false);
  };

  const deleteMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isPast = (dateStr: string) => {
    return new Date(dateStr) < today;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Timeline</h1>
          <p className="mt-1 text-muted-foreground">
            Track your wedding planning milestones
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Milestone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Book caterer"
                  value={newMilestone.title}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={newMilestone.description}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Target Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newMilestone.date}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, date: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addMilestone}>Add Milestone</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-rose-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Wedding Date</span>
            </div>
            <p className="mt-2 text-2xl font-bold font-serif">15th June 2026</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">Days to go</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{daysUntilWedding}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-sage-500" />
              <span className="text-sm text-muted-foreground">Milestones</span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {completedCount} / {milestones.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-6">
              {sortedMilestones.map((milestone, index) => (
                <div key={milestone.id} className="relative pl-10">
                  <button
                    onClick={() => toggleMilestone(milestone.id)}
                    className={`absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      milestone.completed
                        ? "border-primary bg-primary text-primary-foreground"
                        : isPast(milestone.date)
                        ? "border-amber-500 bg-background"
                        : "border-muted-foreground/30 bg-background"
                    }`}
                  >
                    {milestone.completed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                  <div
                    className={`rounded-lg border p-4 transition-colors ${
                      milestone.completed
                        ? "bg-muted/50"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p
                          className={`font-medium ${
                            milestone.completed ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {milestone.title}
                        </p>
                        {milestone.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDate(milestone.date)}
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
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMilestone(milestone.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
