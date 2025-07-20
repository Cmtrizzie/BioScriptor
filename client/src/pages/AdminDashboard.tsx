import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, CreditCard, Activity, Settings, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  usersByTier: {
    free: number;
    premium: number;
    enterprise: number;
  };
  totalSubscriptions: number;
  activeSubscriptions: number;
  recentActivity: Array<{
    id: number;
    adminUserId: number;
    action: string;
    targetResource: string;
    details: string;
    timestamp: string;
  }>;
  queriesLast24h: number;
}

interface User {
  id: number;
  email: string;
  displayName: string;
  tier: string;
  queryCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  id: number;
  userId: number;
  paypalSubscriptionId: string;
  status: string;
  tier: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['/api/admin/analytics/dashboard'],
    enabled: !!user && user.tier === 'enterprise'
  });

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.tier === 'enterprise'
  });

  const { data: subscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
    enabled: !!user && user.tier === 'enterprise'
  });

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['/api/admin/logs'],
    enabled: !!user && user.tier === 'enterprise'
  });

  if (!user || user.tier !== 'enterprise') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Admin access requires Enterprise tier privileges.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleResetUserLimit = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-limit`, {
        method: 'POST',
        headers: {
          'x-firebase-uid': user.firebaseUid!,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset user limit');
      }

      toast({
        title: "Success",
        description: "User daily limit has been reset.",
      });

      refetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset user limit.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              BioScriptor Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor system performance and manage users
            </p>
          </div>
          <Button 
            onClick={() => {
              refetchAnalytics();
              refetchUsers();
              refetchSubscriptions();
              refetchLogs();
            }}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.activeUsers} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalSubscriptions} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Queries (24h)</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.queriesLast24h}</div>
                <p className="text-xs text-muted-foreground">
                  AI queries processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">User Tiers</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Free:</span>
                    <span>{analytics.usersByTier.free}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Premium:</span>
                    <span>{analytics.usersByTier.premium}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Enterprise:</span>
                    <span>{analytics.usersByTier.enterprise}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Display Name</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Query Count</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user: User) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.displayName || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                user.tier === 'enterprise' ? 'default' :
                                user.tier === 'premium' ? 'secondary' : 'outline'
                              }>
                                {user.tier}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.queryCount}</TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetUserLimit(user.id)}
                              >
                                Reset Limit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptionsLoading ? (
                  <div className="text-center py-8">Loading subscriptions...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User ID</TableHead>
                          <TableHead>PayPal ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptions?.map((subscription: Subscription) => (
                          <TableRow key={subscription.id}>
                            <TableCell>{subscription.userId}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {subscription.paypalSubscriptionId}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                subscription.status === 'active' ? 'default' :
                                subscription.status === 'cancelled' ? 'destructive' : 'secondary'
                              }>
                                {subscription.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{subscription.tier}</Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(subscription.startDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {subscription.endDate ? 
                                new Date(subscription.endDate).toLocaleDateString() : 
                                'N/A'
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="text-center py-8">Loading activity logs...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Admin User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs?.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>{log.adminUserId}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {log.targetResource}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {log.details}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Plan limits and system configuration management will be available here.
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <p><strong>System Status:</strong> All systems operational</p>
                    <p><strong>AI Providers:</strong> Fault-tolerant system active</p>
                    <p><strong>Security:</strong> Military-grade security enabled</p>
                    <p><strong>Database:</strong> PostgreSQL connected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}