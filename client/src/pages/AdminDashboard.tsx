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
    enabled: !!hasAdminAccess
  });

  const { data: apiStatus, isLoading: apiStatusLoading, refetch: refetchApiStatus } = useQuery({
    queryKey: ['/api/admin/api-keys'],
    enabled: !!hasAdminAccess
  });

  // Check for admin access
  const hasAdminAccess = user && (
    user.tier === 'enterprise' || 
    user.role === 'admin' || 
    ['admin@bioscriptor.com', 'support@bioscriptor.com'].includes(user.email || '')
  );

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Admin access required. Contact support if you believe this is an error.
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

  const handleBanUser = async (userId: number, banned: boolean, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user.firebaseUid!,
        },
        body: JSON.stringify({ banned, reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      toast({
        title: "Success",
        description: `User ${banned ? 'banned' : 'unbanned'} successfully.`,
      });

      refetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  const handleUpgradeUser = async (userId: number, tier: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user.firebaseUid!,
        },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade user');
      }

      toast({
        title: "Success",
        description: `User upgraded to ${tier} successfully.`,
      });

      refetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upgrade user.",
        variant: "destructive",
      });
    }
  };

  const handleAddCredits = async (userId: number, credits: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/add-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user.firebaseUid!,
        },
        body: JSON.stringify({ credits }),
      });

      if (!response.ok) {
        throw new Error('Failed to add credits');
      }

      toast({
        title: "Success",
        description: `Added ${credits} credits successfully.`,
      });

      refetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add credits.",
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
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics.monthlyRevenue?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  From {analytics.activeSubscriptions} active subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">API Status</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {apiStatus && Object.entries(apiStatus).map(([provider, status]) => (
                    <div key={provider} className="flex justify-between items-center text-sm">
                      <span className="capitalize">{provider}:</span>
                      <Badge variant={status ? "default" : "destructive"}>
                        {status ? "✓" : "✗"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subscriptions">Plans</TabsTrigger>
            <TabsTrigger value="apis">APIs</TabsTrigger>
            <TabsTrigger value="activity">Logs</TabsTrigger>
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
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResetUserLimit(user.id)}
                                >
                                  Reset
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleUpgradeUser(user.id, 'premium')}
                                >
                                  Upgrade
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleBanUser(user.id, true, 'Admin action')}
                                >
                                  Ban
                                </Button>
                              </div>
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

          <TabsContent value="apis">
            <Card>
              <CardHeader>
                <CardTitle>API Management</CardTitle>
              </CardHeader>
              <CardContent>
                {apiStatusLoading ? (
                  <div className="text-center py-8">Loading API status...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {apiStatus && Object.entries(apiStatus).map(([provider, status]) => (
                        <Card key={provider}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg capitalize">{provider}</CardTitle>
                              <Badge variant={status ? "default" : "destructive"}>
                                {status ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              {status ? "API key configured and ready" : "API key not configured"}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3">Model Priority</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p><strong>1. Groq:</strong> Primary (fastest, 2 retries)</p>
                        <p><strong>2. Together:</strong> Secondary (balanced, 2 retries)</p>
                        <p><strong>3. OpenRouter:</strong> Tertiary (reliable, 1 retry)</p>
                        <p><strong>4. Cohere:</strong> Fallback (specialized, 1 retry)</p>
                      </div>
                    </div>
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
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">System Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p><strong>Database:</strong> <Badge variant="default">Connected</Badge></p>
                        <p><strong>AI Providers:</strong> <Badge variant="default">Active</Badge></p>
                        <p><strong>Security:</strong> <Badge variant="default">Enabled</Badge></p>
                      </div>
                      <div className="space-y-2">
                        <p><strong>Cache:</strong> <Badge variant="default">Running</Badge></p>
                        <p><strong>Rate Limiting:</strong> <Badge variant="default">Active</Badge></p>
                        <p><strong>Audit Logs:</strong> <Badge variant="default">Recording</Badge></p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Plan Limits</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Free Tier:</strong> 10 queries/day</p>
                      <p><strong>Premium Tier:</strong> 1,000 queries/day</p>
                      <p><strong>Enterprise Tier:</strong> Unlimited queries</p>
                    </div>
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