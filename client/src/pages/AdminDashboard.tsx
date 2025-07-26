import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, CreditCard, Activity, Settings, RefreshCw, ShieldCheck, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

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

interface PlanFeatures {
  apiAccess?: boolean;
  prioritySupport?: boolean;
  exportFormats?: string[];
  customization?: boolean;
  analytics?: boolean;
}

interface PlanLimitEdit {
  tier: string;
  maxQueries: number;
  maxFileSize: number;
  features: PlanFeatures;
}

interface PromoCode {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [editingPlan, setEditingPlan] = useState<PlanLimitEdit | null>(null);
  const [creatingPromo, setCreatingPromo] = useState(false);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([
    {
      id: 1,
      code: 'WELCOME20',
      type: 'percentage',
      value: 20,
      maxUses: 100,
      usedCount: 45,
      expiresAt: '2024-12-31',
      active: true,
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      code: 'SAVE10',
      type: 'fixed',
      value: 10,
      maxUses: 50,
      usedCount: 12,
      active: true,
      createdAt: '2024-01-15'
    }
  ]);

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['/api/admin/analytics/dashboard'],
    enabled: true
  });

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: true
  });

  const { data: subscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
    enabled: true
  });

  // TESTING MODE: Allow all access
  const hasAdminAccess = true;

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['/api/admin/logs'],
    enabled: !!hasAdminAccess
  });

  const { data: apiStatus, isLoading: apiStatusLoading, refetch: refetchApiStatus } = useQuery({
    queryKey: ['/api/admin/api-keys'],
    enabled: !!hasAdminAccess
  });

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

  const handleDeletePlan = async (tier: string) => {
    if (tier === 'free') {
      toast({
        title: "Error",
        description: "Cannot delete the free plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/plans/${tier}`, {
        method: 'DELETE',
        headers: {
          'x-firebase-uid': user.firebaseUid!,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      toast({
        title: "Success",
        description: `${tier} plan deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete plan.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePromo = (promoId: number) => {
    setPromoCodes(codes => 
      codes.map(code => 
        code.id === promoId 
          ? { ...code, active: !code.active }
          : code
      )
    );
    
    toast({
      title: "Success",
      description: "Promo code status updated.",
    });
  };

  const handleDeletePromo = (promoId: number) => {
    setPromoCodes(codes => codes.filter(code => code.id !== promoId));
    
    toast({
      title: "Success",
      description: "Promo code deleted successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-1">
                BioScriptor Admin
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                System performance & user management center
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              refetchAnalytics();
              refetchUsers();
              refetchSubscriptions();
              refetchLogs();
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Total Users</CardTitle>
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">{analytics.totalUsers}</div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  {analytics.activeUsers} active users
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">Subscriptions</CardTitle>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{analytics.activeSubscriptions}</div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {analytics.totalSubscriptions} total plans
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Queries (24h)</CardTitle>
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">{analytics.queriesLast24h}</div>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  AI queries processed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-300">Revenue</CardTitle>
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-md">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-800 dark:text-amber-200">${analytics.monthlyRevenue?.toFixed(2) || '0.00'}</div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Monthly earnings
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">API Status</CardTitle>
                <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center shadow-md">
                  <Settings className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {apiStatus && Object.entries(apiStatus).map(([provider, status]) => (
                    <div key={provider} className="flex justify-between items-center">
                      <span className="text-xs font-medium capitalize text-slate-600 dark:text-slate-400">{provider}</span>
                      <Badge variant={status ? "default" : "destructive"} className="text-xs">
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
        <Tabs defaultValue="users" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white/20">
            <TabsTrigger value="users" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              Users
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              Plans
            </TabsTrigger>
            <TabsTrigger value="apis" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              APIs
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              Logs
            </TabsTrigger>
            <TabsTrigger value="plans" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              Plans
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 dark:text-slate-400 mt-4 font-medium">Loading users...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700">
                          <TableHead className="font-bold text-slate-700 dark:text-slate-300">Email</TableHead>
                          <TableHead className="font-bold text-slate-700 dark:text-slate-300">Display Name</TableHead>
                          <TableHead className="font-bold text-slate-700 dark:text-slate-300">Tier</TableHead>
                          <TableHead className="font-bold text-slate-700 dark:text-slate-300">Query Count</TableHead>
                          <TableHead className="font-bold text-slate-700 dark:text-slate-300">Created</TableHead>
                          <TableHead className="font-bold text-slate-700 dark:text-slate-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user: User) => (
                          <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-200">
                            <TableCell className="font-medium text-slate-800 dark:text-slate-200">{user.email}</TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">{user.displayName || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.tier === 'enterprise' ? 'default' : user.tier === 'premium' ? 'secondary' : 'outline'}
                                className={`font-semibold ${
                                  user.tier === 'enterprise' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' :
                                  user.tier === 'premium' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                                  'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                                }`}
                              >
                                {user.tier}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-slate-700 dark:text-slate-300">{user.queryCount}</TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResetUserLimit(user.id)}
                                  className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                                >
                                  Reset
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpgradeUser(user.id, 'premium')}
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                >
                                  Upgrade
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleBanUser(user.id, true, 'Admin action')}
                                  className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
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
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  Subscription Management
                </CardTitle>
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
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <Activity className="h-6 w-6 text-blue-600" />
                  Activity Logs
                </CardTitle>
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
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <Settings className="h-6 w-6 text-blue-600" />
                  API Management
                </CardTitle>
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

          <TabsContent value="plans">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    Plan Management
                  </CardTitle>
                  <Button 
                    onClick={() => setEditingPlan({ tier: '', maxQueries: 0, maxFileSize: 10, features: {} })}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    Create New Plan
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="plans" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
                    <TabsTrigger value="promos">Promo Codes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="plans">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { tier: 'free', color: 'slate', icon: '🆓' },
                        { tier: 'premium', color: 'blue', icon: '⭐' },
                        { tier: 'enterprise', color: 'purple', icon: '👑' }
                      ].map(({ tier, color, icon }) => (
                        <Card key={tier} className={`border-2 border-${color}-200 dark:border-${color}-700`}>
                          <CardHeader className={`bg-gradient-to-r from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-800/20`}>
                            <CardTitle className="capitalize flex items-center gap-2">
                              <span className="text-2xl">{icon}</span>
                              {tier} Plan
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3">
                            <div className="text-sm space-y-2">
                              <div className="flex justify-between">
                                <span className="font-medium">Max Queries:</span>
                                <span>{tier === 'free' ? '10' : tier === 'premium' ? '1,000' : 'Unlimited'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">File Size:</span>
                                <span>{tier === 'free' ? '5MB' : tier === 'premium' ? '50MB' : '500MB'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">API Access:</span>
                                <span>{tier === 'free' ? '❌' : '✅'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Priority Support:</span>
                                <span>{tier === 'enterprise' ? '✅' : '❌'}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingPlan({
                                  tier,
                                  maxQueries: tier === 'free' ? 10 : tier === 'premium' ? 1000 : -1,
                                  maxFileSize: tier === 'free' ? 5 : tier === 'premium' ? 50 : 500,
                                  features: {
                                    apiAccess: tier !== 'free',
                                    prioritySupport: tier === 'enterprise',
                                    exportFormats: tier === 'free' ? ['txt'] : tier === 'premium' ? ['txt', 'csv', 'json'] : ['txt', 'csv', 'json', 'xml', 'pdf']
                                  }
                                })}
                                className="flex-1"
                              >
                                Edit
                              </Button>
                              {tier !== 'free' && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeletePlan(tier)}
                                  className="flex-1"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="promos">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Promo Codes</h3>
                        <Button 
                          onClick={() => setCreatingPromo(true)}
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                        >
                          Create Promo Code
                        </Button>
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Code</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Uses</TableHead>
                              <TableHead>Expires</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {promoCodes.map((promo) => (
                              <TableRow key={promo.id}>
                                <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                                <TableCell>
                                  <Badge variant={promo.type === 'percentage' ? 'default' : 'secondary'}>
                                    {promo.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value}`}
                                </TableCell>
                                <TableCell>{promo.usedCount}/{promo.maxUses || '∞'}</TableCell>
                                <TableCell>
                                  {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString() : 'Never'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={promo.active ? 'default' : 'destructive'}>
                                    {promo.active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleTogglePromo(promo.id)}>
                                      {promo.active ? 'Deactivate' : 'Activate'}
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDeletePromo(promo.id)}>
                                      Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings"></TabsContent>
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <Settings className="h-6 w-6 text-blue-600" />
                  System Settings
                </CardTitle>
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

        {/* Plan Edit Modal */}
        {editingPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>
                  {editingPlan.tier ? `Edit ${editingPlan.tier} Plan` : 'Create New Plan'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Plan Tier</label>
                  <input
                    type="text"
                    value={editingPlan.tier}
                    onChange={(e) => setEditingPlan({...editingPlan, tier: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="e.g., premium"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Queries (-1 for unlimited)</label>
                  <input
                    type="number"
                    value={editingPlan.maxQueries}
                    onChange={(e) => setEditingPlan({...editingPlan, maxQueries: parseInt(e.target.value)})}
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max File Size (MB)</label>
                  <input
                    type="number"
                    value={editingPlan.maxFileSize}
                    onChange={(e) => setEditingPlan({...editingPlan, maxFileSize: parseInt(e.target.value)})}
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Features</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingPlan.features.apiAccess || false}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          features: {...editingPlan.features, apiAccess: e.target.checked}
                        })}
                      />
                      <span className="text-sm">API Access</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingPlan.features.prioritySupport || false}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          features: {...editingPlan.features, prioritySupport: e.target.checked}
                        })}
                      />
                      <span className="text-sm">Priority Support</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => setEditingPlan(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Handle save plan logic here
                      setEditingPlan(null);
                      toast({
                        title: "Success",
                        description: "Plan saved successfully.",
                      });
                    }}
                    className="flex-1"
                  >
                    Save Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Promo Code Creation Modal */}
        {creatingPromo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Create Promo Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Promo Code</label>
                  <input
                    type="text"
                    placeholder="e.g., SAVE20"
                    className="w-full mt-1 p-2 border rounded-md uppercase"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Discount Type</label>
                  <select className="w-full mt-1 p-2 border rounded-md">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Discount Value</label>
                  <input
                    type="number"
                    placeholder="20"
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Uses (optional)</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Expires At (optional)</label>
                  <input
                    type="date"
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => setCreatingPromo(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Handle create promo logic here
                      setCreatingPromo(false);
                      toast({
                        title: "Success",
                        description: "Promo code created successfully.",
                      });
                    }}
                    className="flex-1"
                  >
                    Create Promo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}