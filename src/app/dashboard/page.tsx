import {
  CheckSquare,
  Users,
  PoundSterling,
  Calendar,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const stats = [
  {
    name: "Tasks",
    value: "12/45",
    description: "completed",
    icon: CheckSquare,
    href: "/dashboard/tasks",
    color: "text-primary",
  },
  {
    name: "Guests",
    value: "0",
    description: "confirmed",
    icon: Users,
    href: "/dashboard/guests",
    color: "text-sage-600",
  },
  {
    name: "Budget",
    value: "£0",
    description: "of £15,000",
    icon: PoundSterling,
    href: "/dashboard/budget",
    color: "text-champagne-700",
  },
  {
    name: "Days Left",
    value: "478",
    description: "until the big day",
    icon: Calendar,
    href: "/dashboard/timeline",
    color: "text-rose-500",
  },
];

const upcomingTasks = [
  { id: 1, title: "Book venue viewing", dueDate: "28/02/2026", priority: "high" },
  { id: 2, title: "Research photographers", dueDate: "05/03/2026", priority: "medium" },
  { id: 3, title: "Create guest list draft", dueDate: "10/03/2026", priority: "medium" },
];

const recentActivity = [
  { id: 1, action: "Wedding created", time: "Just now" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your wedding planning.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No upcoming tasks</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first task to get started.
                </p>
                <Link href="/dashboard/tasks">
                  <Button className="mt-4">Add Task</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          task.priority === "high"
                            ? "bg-destructive"
                            : task.priority === "medium"
                            ? "bg-amber-500"
                            : "bg-sage-500"
                        }`}
                      />
                      <span className="font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {task.dueDate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No recent activity</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your activity will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-sage-100">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h3 className="text-xl font-semibold">Ready to start planning?</h3>
            <p className="mt-1 text-muted-foreground">
              Add your first guests, set your budget, or create tasks.
            </p>
          </div>
          <div className="mt-4 flex gap-3 md:mt-0">
            <Link href="/dashboard/guests">
              <Button variant="outline">Add Guests</Button>
            </Link>
            <Link href="/dashboard/tasks">
              <Button>Create Task</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
