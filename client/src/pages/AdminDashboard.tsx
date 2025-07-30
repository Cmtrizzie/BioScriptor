import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, CreditCard, Activity, Settings, RefreshCw, ShieldCheck, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
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

  // Filter users based on search and plan filter
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter((user: User) => {
      const matchesSearch = searchQuery === '' || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toString().includes(searchQuery);
      
      const matchesPlan = planFilter === 'all' || user.tier === planFilter;
      
      return matchesSearch && matchesPlan;
    });
  }, [users, searchQuery, planFilter]);

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
      <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 sm:mb-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 lg:mb-0 w-full lg:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-1 leading-tight">
                BioScriptor Admin
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-tight">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-10">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 leading-tight">Total Users</CardTitle>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-800 dark:text-emerald-200">{analytics.totalUsers}</div>
                <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  {analytics.activeUsers} active users
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 leading-tight">Subscriptions</CardTitle>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-blue-800 dark:text-blue-200">{analytics.activeSubscriptions}</div>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {analytics.totalSubscriptions} total plans
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300 leading-tight">Queries (24h)</CardTitle>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-purple-800 dark:text-purple-200">{analytics.queriesLast24h}</div>
                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 mt-1">
                  AI queries processed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300 leading-tight">Revenue</CardTitle>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-amber-800 dark:text-amber-200">${analytics.monthlyRevenue?.toFixed(2) || '0.00'}</div>
                <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Monthly earnings
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 leading-tight">API Status</CardTitle>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-1 sm:space-y-2">
                  {apiStatus && Object.entries(apiStatus).map(([provider, status]) => (
                    <div key={provider} className="flex justify-between items-center">
                      <span className="text-xs font-medium capitalize text-slate-600 dark:text-slate-400 leading-tight">{provider}</span>
                      <Badge variant={status ? "default" : "destructive"} className="text-xs h-5">
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
        <Tabs defaultValue="users" className="space-y-4 sm:space-y-8">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white/20 gap-1 sm:gap-0">
            <TabsTrigger value="users" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4 py-2">
              Users
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4 py-2 sm:block hidden">
              Payments
            </TabsTrigger>
            <TabsTrigger value="apis" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4 py-2">
              APIs
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4 py-2 sm:block hidden">
              Logs
            </TabsTrigger>
            <TabsTrigger value="plans" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4 py-2">
              Plans
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4 py-2 sm:block hidden">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl">
                <div className="flex flex-col gap-4">
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    User Management
                  </CardTitle>
                  
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        placeholder="Search by email, name, or user ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/50 dark:bg-slate-800/50"
                      />
                    </div>
                    <Select value={planFilter} onValueChange={setPlanFilter}>
                      <SelectTrigger className="w-full sm:w-[200px] bg-white/50 dark:bg-slate-800/50">
                        <SelectValue placeholder="Filter by plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Results Summary */}
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {filteredUsers.length} of {users?.length || 0} users
                    {searchQuery && (
                      <span> • Search: "{searchQuery}"</span>
                    )}
                    {planFilter !== 'all' && (
                      <span> • Plan: {planFilter}</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 dark:text-slate-400 mt-4 font-medium">Loading users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">No users found</h3>
                    <p className="text-slate-500 dark:text-slate-500">
                      {searchQuery || planFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'No users have been registered yet'
                      }
                    </p>
                    {(searchQuery || planFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setPlanFilter('all');
                        }}
                        className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700">
                          <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm px-2 sm:px-4">Email</TableHead>
                          <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm px-2 sm:px-4 hidden sm:table-cell">Display Name</TableHead>
                          <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm px-2 sm:px-4">Tier</TableHead>
                          <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">Query Count</TableHead>
                          <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm px-2 sm:px-4 hidden lg:table-cell">Created</TableHead>
                          <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm px-2 sm:px-4">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user: User) => (
                          <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-200">
                            <TableCell className="font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm px-2 sm:px-4">
                              <div className="max-w-[120px] sm:max-w-none truncate">{user.email}</div>
                              <div className="sm:hidden text-xs text-slate-500 mt-1">{user.displayName || 'No name'}</div>
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm px-2 sm:px-4 hidden sm:table-cell">{user.displayName || 'N/A'}</TableCell>
                            <TableCell className="px-2 sm:px-4">
                              <Badge 
                                variant={user.tier === 'enterprise' ? 'default' : user.tier === 'premium' ? 'secondary' : 'outline'}
                                className={`font-semibold text-xs ${
                                  user.tier === 'enterprise' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' :
                                  user.tier === 'premium' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                                  'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                                }`}
                              >
                                {user.tier}
                              </Badge>
                              <div className="md:hidden text-xs text-slate-500 mt-1">{user.queryCount} queries</div>
                            </TableCell>
                            <TableCell className="font-mono text-slate-700 dark:text-slate-300 text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">{user.queryCount}</TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm px-2 sm:px-4 hidden lg:table-cell">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="px-2 sm:px-4">
                              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResetUserLimit(user.id)}
                                  className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors text-xs h-7 sm:h-8"
                                >
                                  Reset
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpgradeUser(user.id, 'premium')}
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs h-7 sm:h-8"
                                >
                                  Upgrade
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleBanUser(user.id, true, 'Admin action')}
                                  className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-xs h-7 sm:h-8"
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
                  Payments & Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="current" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="current">Current Subscriptions</TabsTrigger>
                    <TabsTrigger value="webhooks">Webhook Logs</TabsTrigger>
                    <TabsTrigger value="failed">Failed Payments</TabsTrigger>
                    <TabsTrigger value="manual">Manual Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="current">
                    {subscriptionsLoading ? (
                      <div className="text-center py-8">Loading subscriptions...</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>PayPal ID</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Tier</TableHead>
                              <TableHead>Revenue</TableHead>
                              <TableHead>Start Date</TableHead>
                              <TableHead>Actions</TableHead>
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
                                  ${subscription.tier === 'premium' ? '9.99' : subscription.tier === 'enterprise' ? '49.99' : '0.00'}/mo
                                </TableCell>
                                <TableCell>
                                  {new Date(subscription.startDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                      Cancel
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      Refund
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="webhooks">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">PayPal Webhooks</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">245</div>
                            <p className="text-xs text-muted-foreground">Events received today</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Failed Events</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-red-600">3</div>
                            <p className="text-xs text-muted-foreground">Requires attention</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Processing Time</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-blue-600">1.2s</div>
                            <p className="text-xs text-muted-foreground">Average response time</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { type: 'BILLING.SUBSCRIPTION.ACTIVATED', status: 'success', user: 'user@example.com', time: '2 mins ago' },
                            { type: 'BILLING.SUBSCRIPTION.CANCELLED', status: 'success', user: 'test@demo.com', time: '5 mins ago' },
                            { type: 'PAYMENT.CAPTURE.COMPLETED', status: 'failed', user: 'fail@example.com', time: '10 mins ago' }
                          ].map((event, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-sm">{event.type}</TableCell>
                              <TableCell>
                                <Badge variant={event.status === 'success' ? 'default' : 'destructive'}>
                                  {event.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{event.user}</TableCell>
                              <TableCell>{event.time}</TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline">Retry</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="failed">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Failed & Cancelled Payments</h3>
                        <Button>Export Failed Payments</Button>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Attempts</TableHead>
                            <TableHead>Last Attempt</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { user: 'user1@test.com', amount: '$9.99', reason: 'Insufficient funds', attempts: 3, lastAttempt: '1 hour ago' },
                            { user: 'user2@test.com', amount: '$49.99', reason: 'Card expired', attempts: 1, lastAttempt: '2 hours ago' },
                            { user: 'user3@test.com', amount: '$9.99', reason: 'Payment declined', attempts: 2, lastAttempt: '4 hours ago' }
                          ].map((payment, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{payment.user}</TableCell>
                              <TableCell className="font-semibold">{payment.amount}</TableCell>
                              <TableCell>
                                <Badge variant="destructive">{payment.reason}</Badge>
                              </TableCell>
                              <TableCell>{payment.attempts}/3</TableCell>
                              <TableCell>{payment.lastAttempt}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm">Retry Payment</Button>
                                  <Button size="sm" variant="outline">Contact User</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Manual Subscription Change</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">User Email</label>
                            <input
                              type="email"
                              placeholder="user@example.com"
                              className="w-full mt-1 p-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">New Tier</label>
                            <select className="w-full mt-1 p-2 border rounded-md">
                              <option value="free">Free</option>
                              <option value="premium">Premium</option>
                              <option value="enterprise">Enterprise</option>
                              <option value="lifetime">Lifetime</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Reason</label>
                            <textarea
                              placeholder="Reason for manual change..."
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                            />
                          </div>
                          <Button className="w-full">Update Subscription</Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Lifetime Access</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">User Email</label>
                            <input
                              type="email"
                              placeholder="user@example.com"
                              className="w-full mt-1 p-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Access Level</label>
                            <select className="w-full mt-1 p-2 border rounded-md">
                              <option value="premium_lifetime">Premium Lifetime</option>
                              <option value="enterprise_lifetime">Enterprise Lifetime</option>
                              <option value="custom">Custom Access</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Custom Features (if custom)</label>
                            <div className="space-y-2">
                              <label className="flex items-center gap-2">
                                <input type="checkbox" />
                                <span className="text-sm">Unlimited Queries</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input type="checkbox" />
                                <span className="text-sm">Priority Support</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input type="checkbox" />
                                <span className="text-sm">API Access</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input type="checkbox" />
                                <span className="text-sm">Beta Features</span>
                              </label>
                            </div>
                          </div>
                          <Button className="w-full">Grant Lifetime Access</Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
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
                  API Routing & Model Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="status" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="status">API Status</TabsTrigger>
                    <TabsTrigger value="routing">Model Routing</TabsTrigger>
                    <TabsTrigger value="keys">API Keys</TabsTrigger>
                    <TabsTrigger value="errors">Error Logs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="status">
                    {apiStatusLoading ? (
                      <div className="text-center py-8">Loading API status...</div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {apiStatus && Object.entries(apiStatus).map(([provider, status]) => (
                            <Card key={provider} className={`border-2 ${status ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg capitalize">{provider}</CardTitle>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={status ? "default" : "destructive"}>
                                      {status ? "Active" : "Inactive"}
                                    </Badge>
                                    <Button size="sm" variant="outline">
                                      {status ? 'Disable' : 'Enable'}
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Requests Today:</span>
                                    <span className="font-semibold">{Math.floor(Math.random() * 1000)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Success Rate:</span>
                                    <span className="font-semibold text-green-600">98.{Math.floor(Math.random() * 9)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Avg Response:</span>
                                    <span className="font-semibold">{(Math.random() * 2 + 0.5).toFixed(2)}s</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        <Card>
                          <CardHeader>
                            <CardTitle>Real-time Performance Metrics</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-3xl font-bold text-blue-600">2,847</div>
                                <p className="text-sm text-muted-foreground">Total Requests Today</p>
                              </div>
                              <div>
                                <div className="text-3xl font-bold text-green-600">99.2%</div>
                                <p className="text-sm text-muted-foreground">Overall Success Rate</p>
                              </div>
                              <div>
                                <div className="text-3xl font-bold text-purple-600">1.8s</div>
                                <p className="text-sm text-muted-foreground">Average Response Time</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="routing">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Model Priority & Routing by Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {['free', 'premium', 'enterprise'].map((tier) => (
                              <div key={tier} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-semibold capitalize">{tier} Tier Routing</h4>
                                  <Button size="sm" variant="outline">Edit Priority</Button>
                                </div>
                                <div className="space-y-2">
                                  {[
                                    { name: 'Groq', priority: tier === 'free' ? 2 : 1, enabled: tier !== 'free' },
                                    { name: 'Together', priority: tier === 'free' ? 1 : 2, enabled: true },
                                    { name: 'OpenRouter', priority: 3, enabled: tier !== 'free' },
                                    { name: 'Cohere', priority: 4, enabled: tier === 'enterprise' }
                                  ].map((model) => (
                                    <div key={model.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                          {model.priority}
                                        </span>
                                        <span className="font-medium">{model.name}</span>
                                        <Badge variant={model.enabled ? 'default' : 'secondary'}>
                                          {model.enabled ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-2">
                                          <input type="checkbox" checked={model.enabled} readOnly />
                                          <span className="text-sm">Active</span>
                                        </label>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Load Balancing Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Fallback Strategy</label>
                              <select className="w-full mt-1 p-2 border rounded-md">
                                <option value="priority">Priority Order</option>
                                <option value="round_robin">Round Robin</option>
                                <option value="least_load">Least Load</option>
                                <option value="fastest">Fastest Response</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Retry Attempts</label>
                              <input
                                type="number"
                                value="3"
                                className="w-full mt-1 p-2 border rounded-md"
                                min="1"
                                max="5"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Timeout (seconds)</label>
                              <input
                                type="number"
                                value="30"
                                className="w-full mt-1 p-2 border rounded-md"
                                min="5"
                                max="120"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Rate Limit (req/min)</label>
                              <input
                                type="number"
                                value="100"
                                className="w-full mt-1 p-2 border rounded-md"
                                min="10"
                                max="1000"
                              />
                            </div>
                          </div>
                          <Button className="mt-4">Save Load Balancing Settings</Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="keys">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {apiStatus && Object.entries(apiStatus).map(([provider, status]) => (
                          <Card key={provider}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="capitalize">{provider} API</CardTitle>
                                <Badge variant={status ? "default" : "destructive"}>
                                  {status ? "Configured" : "Missing"}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <label className="text-sm font-medium">API Key</label>
                                <div className="flex gap-2 mt-1">
                                  <input
                                    type="password"
                                    value={status ? "••••••••••••••••" : ""}
                                    placeholder="Enter API key..."
                                    className="flex-1 p-2 border rounded-md"
                                  />
                                  <Button size="sm" variant="outline">Test</Button>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Endpoint URL</label>
                                <input
                                  type="url"
                                  placeholder={`Default ${provider} endpoint`}
                                  className="w-full mt-1 p-2 border rounded-md"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" className="flex-1">Update Key</Button>
                                <Button size="sm" variant="destructive">Remove</Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Add New API Provider</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Provider Name</label>
                              <input
                                type="text"
                                placeholder="e.g., Custom API"
                                className="w-full mt-1 p-2 border rounded-md"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">API Type</label>
                              <select className="w-full mt-1 p-2 border rounded-md">
                                <option value="openai">OpenAI Compatible</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="cohere">Cohere</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">API Key</label>
                              <input
                                type="password"
                                placeholder="Enter API key..."
                                className="w-full mt-1 p-2 border rounded-md"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Endpoint URL</label>
                              <input
                                type="url"
                                placeholder="https://api.example.com/v1/chat"
                                className="w-full mt-1 p-2 border rounded-md"
                              />
                            </div>
                          </div>
                          <Button>Add API Provider</Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="errors">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">API Error Logs & Failed Calls</h3>
                        <div className="flex gap-2">
                          <Button variant="outline">Export Logs</Button>
                          <Button variant="outline">Clear Old Logs</Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">23</div>
                            <p className="text-sm text-muted-foreground">Errors Today</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">7</div>
                            <p className="text-sm text-muted-foreground">Timeouts</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">12</div>
                            <p className="text-sm text-muted-foreground">Rate Limited</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">98.9%</div>
                            <p className="text-sm text-muted-foreground">Success Rate</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Error Type</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { timestamp: '2 mins ago', provider: 'Groq', error: 'Rate Limit', user: 'user1@example.com', details: '429 - Too many requests' },
                            { timestamp: '5 mins ago', provider: 'Together', error: 'Timeout', user: 'user2@example.com', details: 'Request timeout after 30s' },
                            { timestamp: '8 mins ago', provider: 'OpenRouter', error: 'API Error', user: 'user3@example.com', details: '500 - Internal server error' },
                            { timestamp: '12 mins ago', provider: 'Cohere', error: 'Auth Failed', user: 'user4@example.com', details: '401 - Invalid API key' }
                          ].map((log, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{log.timestamp}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{log.provider}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="destructive">{log.error}</Badge>
                              </TableCell>
                              <TableCell>{log.user}</TableCell>
                              <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">Retry</Button>
                                  <Button size="sm" variant="outline">Details</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
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

          <TabsContent value="settings">
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
                      });                    }}
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