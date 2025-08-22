import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      slack: true,
      sms: false,
      push: true,
    },
    thresholds: {
      highRisk: 80,
      mediumRisk: 50,
      healthScore: 60,
    },
    automation: {
      autoAssign: true,
      autoEscalate: true,
      smartRouting: true,
    },
    profile: {
      name: "Sarah Chen",
      email: "sarah.chen@company.com",
      role: "Customer Success Manager",
      department: "Customer Success",
    },
  });

  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const teamMembers = [
    { name: "Sarah Chen", role: "Customer Success Manager", email: "sarah.chen@company.com", status: "active" },
    { name: "Mike Johnson", role: "Senior CSM", email: "mike.johnson@company.com", status: "active" },
    { name: "Lisa Wang", role: "CSM", email: "lisa.wang@company.com", status: "active" },
    { name: "David Kim", role: "Team Lead", email: "david.kim@company.com", status: "active" },
    { name: "Emma Thompson", role: "CSM", email: "emma.thompson@company.com", status: "away" },
  ];

  const playbookTemplates = [
    { name: "CX Rescue", status: "active", success: "85%", usage: "High" },
    { name: "Payment Recovery", status: "active", success: "72%", usage: "Medium" },
    { name: "Engagement Boost", status: "active", success: "68%", usage: "High" },
    { name: "Product Training", status: "active", success: "78%", usage: "Medium" },
    { name: "Special Offer", status: "paused", success: "65%", usage: "Low" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Settings</h1>
            <p className="text-gray-600">Configure your churn prevention platform preferences and team settings</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="thresholds">Risk Thresholds</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name"
                        value={settings.profile.name}
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, name: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, email: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={settings.profile.role}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Customer Success Manager">Customer Success Manager</SelectItem>
                          <SelectItem value="Senior CSM">Senior CSM</SelectItem>
                          <SelectItem value="Team Lead">Team Lead</SelectItem>
                          <SelectItem value="Director">Director</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select value={settings.profile.department}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Customer Success">Customer Success</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave}>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="password">Change Password</Label>
                    <Input type="password" placeholder="Enter new password" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input type="password" placeholder="Confirm new password" className="mt-1" />
                  </div>
                  
                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline">Update Password</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive churn alerts and reports via email</p>
                    </div>
                    <Switch 
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, email: checked }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Slack Notifications</h4>
                      <p className="text-sm text-gray-600">Get real-time alerts in your Slack channels</p>
                    </div>
                    <Switch 
                      checked={settings.notifications.slack}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, slack: checked }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">SMS Alerts</h4>
                      <p className="text-sm text-gray-600">Critical alerts via SMS for high-risk customers</p>
                    </div>
                    <Switch 
                      checked={settings.notifications.sms}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, sms: checked }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Push Notifications</h4>
                      <p className="text-sm text-gray-600">Browser push notifications for urgent matters</p>
                    </div>
                    <Switch 
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, push: checked }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alert Frequency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Daily Summary</Label>
                    <Select defaultValue="enabled">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="weekdays">Weekdays Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Weekly Report</Label>
                    <Select defaultValue="monday">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="thresholds" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Thresholds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="high-risk">High Risk Threshold (%)</Label>
                    <Input 
                      id="high-risk"
                      type="number"
                      value={settings.thresholds.highRisk}
                      onChange={(e) => setSettings({
                        ...settings,
                        thresholds: { ...settings.thresholds, highRisk: parseInt(e.target.value) }
                      })}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-600 mt-1">Customers above this churn probability are marked as high risk</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="medium-risk">Medium Risk Threshold (%)</Label>
                    <Input 
                      id="medium-risk"
                      type="number"
                      value={settings.thresholds.mediumRisk}
                      onChange={(e) => setSettings({
                        ...settings,
                        thresholds: { ...settings.thresholds, mediumRisk: parseInt(e.target.value) }
                      })}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-600 mt-1">Customers above this threshold are marked as medium risk</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="health-score">Low Health Score Threshold (%)</Label>
                    <Input 
                      id="health-score"
                      type="number"
                      value={settings.thresholds.healthScore}
                      onChange={(e) => setSettings({
                        ...settings,
                        thresholds: { ...settings.thresholds, healthScore: parseInt(e.target.value) }
                      })}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-600 mt-1">Customers below this health score trigger alerts</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alert Triggers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Payment failures</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Support ticket escalation</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Low engagement (7+ days)</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">NPS score drops below 6</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="automation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Automation Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto-assign Interventions</h4>
                      <p className="text-sm text-gray-600">Automatically assign new interventions to available CSMs</p>
                    </div>
                    <Switch 
                      checked={settings.automation.autoAssign}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        automation: { ...settings.automation, autoAssign: checked }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto-escalate High Risk</h4>
                      <p className="text-sm text-gray-600">Escalate critical risk customers to team leads</p>
                    </div>
                    <Switch 
                      checked={settings.automation.autoEscalate}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        automation: { ...settings.automation, autoEscalate: checked }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Smart Playbook Routing</h4>
                      <p className="text-sm text-gray-600">Automatically select best playbook based on customer profile</p>
                    </div>
                    <Switch 
                      checked={settings.automation.smartRouting}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        automation: { ...settings.automation, smartRouting: checked }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Team Members</CardTitle>
                    <Button>
                      <i className="fas fa-plus mr-2"></i>
                      Invite Member
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamMembers.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.role}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {member.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <i className="fas fa-cog"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="playbooks" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Playbook Management</CardTitle>
                    <Button>
                      <i className="fas fa-plus mr-2"></i>
                      Create Playbook
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {playbookTemplates.map((playbook, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-play-circle text-blue-600"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{playbook.name}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Success: {playbook.success}</span>
                              <span>Usage: {playbook.usage}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={playbook.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {playbook.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <i className="fas fa-copy"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              <i className="fas fa-save mr-2"></i>
              Save All Settings
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}