import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, CheckCircle, Clock, Users, IndianRupee, Shield, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingVerification {
  id: string;
  userId: string;
  userName: string;
  email: string;
  collegeIdUrl: string;
  govtIdUrl: string;
  submittedAt: string;
  university: string;
}

interface ReportedUser {
  id: string;
  reportedUserId: string;
  reportedUserName: string;
  reporterName: string;
  reportType: string;
  description: string;
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

interface SubscriptionStats {
  totalRevenue: number;
  activeSubscriptions: number;
  conversionRate: number;
  churnRate: number;
  tierBreakdown: {
    starter: number;
    plus: number;
    pro: number;
  };
}

const AdminDashboard = () => {
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [reportedUsers, setReportedUsers] = useState<ReportedUser[]>([]);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const { toast } = useToast();

  // Mock data - replace with actual API calls
  const mockPendingVerifications: PendingVerification[] = [
    {
      id: "1",
      userId: "user1",
      userName: "Priya Sharma",
      email: "priya@iitdelhi.ac.in",
      collegeIdUrl: "/placeholder.svg",
      govtIdUrl: "/placeholder.svg",
      submittedAt: "2024-01-15T10:30:00Z",
      university: "IIT Delhi"
    },
    {
      id: "2",
      userId: "user2",
      userName: "Arjun Patel",
      email: "arjun@bitspilani.ac.in",
      collegeIdUrl: "/placeholder.svg",
      govtIdUrl: "/placeholder.svg",
      submittedAt: "2024-01-15T09:15:00Z",
      university: "BITS Pilani"
    }
  ];

  const mockReportedUsers: ReportedUser[] = [
    {
      id: "1",
      reportedUserId: "user3",
      reportedUserName: "John Doe",
      reporterName: "Jane Smith",
      reportType: "inappropriate_behavior",
      description: "Sending inappropriate messages",
      submittedAt: "2024-01-14T16:45:00Z",
      status: "pending"
    },
    {
      id: "2",
      reportedUserId: "user4",
      reportedUserName: "Mike Johnson",
      reporterName: "Sarah Wilson",
      reportType: "fake_id",
      description: "Suspicious profile information",
      submittedAt: "2024-01-14T12:20:00Z",
      status: "reviewed"
    }
  ];

  const mockSubscriptionStats: SubscriptionStats = {
    totalRevenue: 125000,
    activeSubscriptions: 450,
    conversionRate: 12.5,
    churnRate: 3.2,
    tierBreakdown: {
      starter: 180,
      plus: 200,
      pro: 70
    }
  };

  useEffect(() => {
    // Simulate API calls
    setPendingVerifications(mockPendingVerifications);
    setReportedUsers(mockReportedUsers);
    setSubscriptionStats(mockSubscriptionStats);
  }, []);

  const handleVerificationAction = (verificationId: string, action: 'approve' | 'reject') => {
    const verification = pendingVerifications.find(v => v.id === verificationId);
    if (!verification) return;

    const actionText = action === 'approve' ? 'approved' : 'rejected';
    toast({
      title: `Verification ${actionText}`,
      description: `${verification.userName}'s verification has been ${actionText}.`
    });

    setPendingVerifications(prev => prev.filter(v => v.id !== verificationId));
  };

  const handleReportAction = (reportId: string, action: 'resolve' | 'dismiss') => {
    const report = reportedUsers.find(r => r.id === reportId);
    if (!report) return;

    const actionText = action === 'resolve' ? 'resolved' : 'dismissed';
    toast({
      title: `Report ${actionText}`,
      description: `The report against ${report.reportedUserName} has been ${actionText}.`
    });

    setReportedUsers(prev => 
      prev.map(r => 
        r.id === reportId 
          ? { ...r, status: action === 'resolve' ? 'resolved' : 'reviewed' }
          : r
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage CampusConnect operations</p>
        </div>

        <Tabs defaultValue="verifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="verifications">ID Verifications</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* ID Verifications Tab */}
          <TabsContent value="verifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Pending ID Verifications
                </CardTitle>
                <CardDescription>
                  Review and approve student identity verifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingVerifications.map((verification) => (
                    <Card key={verification.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>
                              {verification.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-2">
                            <div>
                              <h4 className="font-semibold">{verification.userName}</h4>
                              <p className="text-sm text-muted-foreground">{verification.email}</p>
                              <p className="text-sm text-muted-foreground">{verification.university}</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Submitted {new Date(verification.submittedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(verification.collegeIdUrl, '_blank')}
                          >
                            View College ID
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(verification.govtIdUrl, '_blank')}
                          >
                            View Govt ID
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleVerificationAction(verification.id, 'reject')}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleVerificationAction(verification.id, 'approve')}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {pendingVerifications.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending verifications
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  User Reports
                </CardTitle>
                <CardDescription>
                  Review reported users and take appropriate action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reported User</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportedUsers.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {report.reportedUserName}
                        </TableCell>
                        <TableCell>{report.reporterName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {report.reportType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {report.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              report.status === 'pending' ? 'destructive' :
                              report.status === 'reviewed' ? 'secondary' : 'default'
                            }
                          >
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {report.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReportAction(report.id, 'dismiss')}
                              >
                                Dismiss
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReportAction(report.id, 'resolve')}
                              >
                                Resolve
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            {subscriptionStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{subscriptionStats.totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{subscriptionStats.activeSubscriptions}</div>
                    <p className="text-xs text-muted-foreground">Currently active</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{subscriptionStats.conversionRate}%</div>
                    <p className="text-xs text-muted-foreground">Free to premium</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{subscriptionStats.churnRate}%</div>
                    <p className="text-xs text-muted-foreground">Monthly churn</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Subscription Tier Breakdown</CardTitle>
                <CardDescription>Distribution across different plans</CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionStats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Starter (₹49/month)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(subscriptionStats.tierBreakdown.starter / subscriptionStats.activeSubscriptions) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{subscriptionStats.tierBreakdown.starter}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Plus (₹89/month)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${(subscriptionStats.tierBreakdown.plus / subscriptionStats.activeSubscriptions) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{subscriptionStats.tierBreakdown.plus}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pro (₹159/month)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-amber-500 h-2 rounded-full" 
                            style={{ width: `${(subscriptionStats.tierBreakdown.pro / subscriptionStats.activeSubscriptions) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{subscriptionStats.tierBreakdown.pro}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Daily Active Users</span>
                      <span className="text-sm font-medium">1,234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Session Time</span>
                      <span className="text-sm font-medium">12m 34s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Messages Sent Today</span>
                      <span className="text-sm font-medium">5,678</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Match Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Matches Created Today</span>
                      <span className="text-sm font-medium">89</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Match Rate</span>
                      <span className="text-sm font-medium">15.6%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Conversation Rate</span>
                      <span className="text-sm font-medium">67.8%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Safety Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Reports This Week</span>
                      <span className="text-sm font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Verified Users</span>
                      <span className="text-sm font-medium">78.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Blocked Users</span>
                      <span className="text-sm font-medium">34</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;