"use client";

import { useState } from "react";
import { Save, User, Calendar, Users, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [weddingDetails, setWeddingDetails] = useState({
    name: "Our Wedding",
    date: "2026-06-15",
    venue: "",
    estimatedGuests: "",
  });

  const [teamMembers] = useState([
    { id: "1", name: "Sarah", email: "sarah@example.com", role: "Couple", canViewSpend: true },
    { id: "2", name: "James", email: "james@example.com", role: "Couple", canViewSpend: true },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your wedding details and preferences
        </p>
      </div>

      <Tabs defaultValue="wedding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="wedding" className="gap-2">
            <Calendar className="h-4 w-4" />
            Wedding Details
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wedding">
          <Card>
            <CardHeader>
              <CardTitle>Wedding Details</CardTitle>
              <CardDescription>
                Update your wedding information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weddingName">Wedding Name</Label>
                  <Input
                    id="weddingName"
                    value={weddingDetails.name}
                    onChange={(e) =>
                      setWeddingDetails({ ...weddingDetails, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weddingDate">Wedding Date</Label>
                  <Input
                    id="weddingDate"
                    type="date"
                    value={weddingDetails.date}
                    onChange={(e) =>
                      setWeddingDetails({ ...weddingDetails, date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  placeholder="Enter venue name"
                  value={weddingDetails.venue}
                  onChange={(e) =>
                    setWeddingDetails({ ...weddingDetails, venue: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedGuests">Estimated Guest Count</Label>
                <Input
                  id="estimatedGuests"
                  type="number"
                  placeholder="e.g., 100"
                  value={weddingDetails.estimatedGuests}
                  onChange={(e) =>
                    setWeddingDetails({ ...weddingDetails, estimatedGuests: e.target.value })
                  }
                />
              </div>
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage who has access to your wedding planner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {member.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-sm px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {member.role}
                    </span>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Invite Team Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Control what team members can see and do
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Planner Permissions</h4>
                <p className="text-sm text-muted-foreground">
                  Configure what planners can access by default
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id="plannerTasks" defaultChecked />
                      <Label htmlFor="plannerTasks">Can edit tasks</Label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id="plannerGuests" defaultChecked />
                      <Label htmlFor="plannerGuests">Can edit guests</Label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id="plannerVendors" defaultChecked />
                      <Label htmlFor="plannerVendors">Can edit vendors</Label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id="plannerSeating" defaultChecked />
                      <Label htmlFor="plannerSeating">Can edit seating</Label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Checkbox id="plannerSpend" />
                      <Label htmlFor="plannerSpend" className="text-amber-600">
                        Can view budget & spend
                      </Label>
                    </div>
                    <span className="text-xs text-muted-foreground">Restricted by default</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h4 className="font-medium">Vendor Access</h4>
                <p className="text-sm text-muted-foreground">
                  Vendors can only see their own information. They cannot view:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Budget or spend information</li>
                  <li>Other vendor details</li>
                  <li>Guest information</li>
                  <li>Full task list</li>
                </ul>
              </div>

              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Permissions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
