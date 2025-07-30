import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, CreditCard, Activity, Settings, Shield, LogOut, RefreshCw, Plus, Edit, Trash2, Search, FileText, BarChart2, Zap, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  monthlyRevenue: number;
  conversionRate: number;
}

interface User {
  id: number;
  email: string;
  displayName: string;
  tier: string;
  queryCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'banned';
  lastActive: string;
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
  revenue: number;
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

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<AdminAnalytics>({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      // Simulated API response
      return {
        totalUsers: 1242,
        activeUsers: 893,
        usersByTier: { free: 642, premium: 423, enterprise: 177 },
        totalSubscriptions: 600,
        activeSubscriptions: 542,
        queriesLast24h: 2847,
        monthlyRevenue: 8423.50,
        conversionRate: 14.3,
        recentActivity: []
      };
    }
  });

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      // Simulated API response
      return Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        email: `user${i + 1}@example.com`,
        displayName: `User ${i + 1}`,
        tier: i % 3 === 0 ? 'free' : i % 3 === 1 ? 'premium' : 'enterprise',
        queryCount: Math.floor(Math.random() * 500),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        status: i % 10 === 0 ? 'banned' : 'active',
        lastActive: new Date(Date.now() - Math.floor(Math.random() * 24) * 3600000).toISOString()
      }));
    }
  });

  const { data: subscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery<Subscription[]>({
    queryKey: ['adminSubscriptions'],
    queryFn: async () => {
      // Simulated API response
      return Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        userId: i + 1,
        paypalSubscriptionId: `SUB-${Math.random().toString(36).substr(2, 14)}`,
        status: ['active', 'cancelled', 'pending'][Math.floor(Math.random() * 3)],
        tier: i % 3 === 0 ? 'free' : i % 3 === 1 ? 'premium' : 'enterprise',
        startDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000).toISOString(),
        revenue: i % 3 === 0 ? 0 : i % 3 === 1 ? 9.99 : 49.99
      }));
    }
  });

  // Filter users based on search and plan filter
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter((user) => {
      const matchesSearch = searchQuery === '' || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toString().includes(searchQuery);

      const matchesPlan = planFilter === 'all' || user.tier === planFilter;

      return matchesSearch && matchesPlan;
    });
  }, [users, searchQuery, planFilter]);

  const { data: apiStatus, isLoading: apiStatusLoading, refetch: refetchApiStatus } = useQuery({
    queryKey: ['apiStatus'],
    queryFn: async () => {
      return {
        groq: true,
        together: true,
        openrouter: true,
        cohere: false
      };
    }
  });

  const handleResetUserLimit = async (userId: number) => {
    try {
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

  // Get tier color classes
  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'free': return 'bg-gradient-to-r from-gray-400 to-gray-500';
      case 'premium': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'enterprise': return 'bg-gradient-to-r from-purple-500 to-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    return status === 'active' ? 'default' : 'destructive';
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Header Section */}
        <motion.div 
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-1">
                BioScriptor Admin
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                System performance & user management center
              </p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.03 }}>
            <Button 
              onClick={() => {
                refetchAnalytics();
                refetchUsers();
                refetchSubscriptions();
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </motion.div>
        </motion.div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total Users</CardTitle>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                  {analytics?.totalUsers || '0'}
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {analytics?.activeUsers || '0'} active users
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Revenue</CardTitle>
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                  ${analytics?.monthlyRevenue?.toFixed(2) || '0.00'}
                </div>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  Monthly earnings
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Queries (24h)</CardTitle>
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                  <Zap className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                  {analytics?.queriesLast24h || '0'}
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  AI queries processed
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-300">Conversion</CardTitle>
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-md">
                  <BarChart2 className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-800 dark:text-amber-200">
                  {analytics?.conversionRate?.toFixed(1) || '0.0'}%
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Free to paid conversion
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white/20">
            <TabsTrigger value="users" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white px-4 py-2">
              <Users className="h-4 w-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white px-4 py-2">
              <CreditCard className="h-4 w-4 mr-2" /> Payments
            </TabsTrigger>
            <TabsTrigger value="plans" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white px-4 py-2">
              <FileText className="h-4 w-4 mr-2" /> Plans
            </TabsTrigger>
            <TabsTrigger value="promos" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white px-4 py-2">
              <Gift className="h-4 w-4 mr-2" /> Promos
            </TabsTrigger>
            <TabsTrigger value="apis" className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white px-4 py-2">
              <Settings className="h-4 w-4 mr-2" /> APIs
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <motion.div 
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl p-6">
                <div className="flex flex-col gap-4">
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    User Management
                  </CardTitle>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        placeholder="Search by email, name, or user ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={planFilter} onValueChange={setPlanFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
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

                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {filteredUsers.length} of {users?.length || 0} users
                    {searchQuery && ` • Search: "${searchQuery}"`}
                    {planFilter !== 'all' && ` • Plan: ${planFilter}`}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                          <TableHead>User</TableHead>
                          <TableHead className="hidden sm:table-cell">Tier</TableHead>
                          <TableHead className="hidden md:table-cell">Queries</TableHead>
                          <TableHead className="hidden lg:table-cell">Created</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <TableCell>
                              <div className="font-medium">{user.email}</div>
                              <div className="text-sm text-slate-500">{user.displayName}</div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge className={cn("text-white", getTierColor(user.tier))}>
                                {user.tier}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell font-mono">
                              {user.queryCount}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(user.status)}>
                                {user.status}
                              </Badge>
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
                                  onClick={() => handleUpgradeUser(user.id, 'premium')}
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                >
                                  Upgrade
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
            </motion.div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <motion.div 
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl p-6">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  Payments & Subscriptions
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {subscriptionsLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Subscription ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptions?.map((subscription) => (
                          <TableRow key={subscription.id}>
                            <TableCell>user{subscription.userId}@example.com</TableCell>
                            <TableCell className="font-mono text-sm">
                              {subscription.paypalSubscriptionId.substring(0, 12)}...
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
                              <Badge className={cn("text-white", getTierColor(subscription.tier))}>
                                {subscription.tier}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              ${subscription.revenue.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {new Date(subscription.startDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  Manage
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
            </motion.div>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans">
            <motion.div 
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <FileText className="h-6 w-6 text-blue-600" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { tier: 'free', icon: '🆓', price: 0 },
                    { tier: 'premium', icon: '⭐', price: 9.99 },
                    { tier: 'enterprise', icon: '🏢', price: 49.99 }
                  ].map(({ tier, icon, price }) => (
                    <Card key={tier} className="border-2 border-slate-200 dark:border-slate-700">
                      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                        <CardTitle className="capitalize flex items-center gap-2">
                          <span className="text-2xl">{icon}</span>
                          {tier} Plan
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold">
                            ${price}<span className="text-sm font-normal">/month</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                            <span>Max Queries:</span>
                            <span>{tier === 'free' ? '10' : tier === 'premium' ? '1,000' : 'Unlimited'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                            <span>File Size:</span>
                            <span>{tier === 'free' ? '5MB' : tier === 'premium' ? '50MB' : '500MB'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                            <span>API Access:</span>
                            <span>{tier === 'free' ? '❌' : '✅'}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span>Priority Support:</span>
                            <span>{tier === 'enterprise' ? '✅' : '❌'}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingPlan({
                              tier,
                              maxQueries: tier === 'free' ? 10 : tier === 'premium' ? 1000 : -1,
                              maxFileSize: tier === 'free' ? 5 : tier === 'premium' ? 50 : 500,
                              features: {
                                apiAccess: tier !== 'free',
                                prioritySupport: tier === 'enterprise'
                              }
                            })}
                            className="flex-1"
                          >
                            Edit
                          </Button>
                          {tier !== 'free' && (
                            <Button size="sm" 
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
              </CardContent>
            </motion.div>
          </TabsContent>

          {/* Promos Tab */}
          <TabsContent value="promos">
            <motion.div 
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl p-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <Gift className="h-6 w-6 text-blue-600" />
                    Promo Code Management
                  </CardTitle>
                  <Button 
                    onClick={() => setCreatingPromo(true)}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                  >
                    Create Promo Code
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
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
              </CardContent>
            </motion.div>
          </TabsContent>

          {/* APIs Tab */}
          <TabsContent value="apis">
            <motion.div 
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl p-6">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <Settings className="h-6 w-6 text-blue-600" />
                  API Management
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* API Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 border-slate-200 dark:border-slate-700">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                      <CardTitle className="text-lg text-green-800 dark:text-green-200">Active Providers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {[
                        { name: 'Groq', status: apiStatus?.groq, requests: '2,847', uptime: '99.9%' },
                        { name: 'Together AI', status: apiStatus?.together, requests: '1,234', uptime: '99.5%' },
                        { name: 'OpenRouter', status: apiStatus?.openrouter, requests: '876', uptime: '98.2%' },
                        { name: 'Cohere', status: apiStatus?.cohere, requests: '543', uptime: '97.8%' }
                      ].map((provider) => (
                        <div key={provider.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${provider.status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="font-medium">{provider.name}</span>
                          </div>
                          <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                            <div>{provider.requests} req/24h</div>
                            <div>↑ {provider.uptime}</div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-slate-200 dark:border-slate-700">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                      <CardTitle className="text-lg text-blue-800 dark:text-blue-200">Recent API Errors</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {[
                        { provider: 'Groq', error: 'Rate Limit', time: '2 min ago', severity: 'warning' },
                        { provider: 'Together', error: 'Timeout', time: '5 min ago', severity: 'error' },
                        { provider: 'Cohere', error: 'Auth Failed', time: '1 hour ago', severity: 'error' }
                      ].map((error, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${error.severity === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                            <div>
                              <div className="font-medium">{error.provider}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">{error.error}</div>
                            </div>
                          </div>
                          <div className="text-sm text-slate-500">{error.time}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* API Configuration */}
                <Card className="border-2 border-slate-200 dark:border-slate-700">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                    <CardTitle className="flex items-center justify-between">
                      <span>Provider Configuration</span>
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        Add Provider
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Cost/1K tokens</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { name: 'Groq', status: 'Active', model: 'llama3-70b-8192', cost: '$0.00059' },
                          { name: 'Together AI', status: 'Active', model: 'meta-llama/Llama-2-70b-chat-hf', cost: '$0.0008' },
                          { name: 'OpenRouter', status: 'Active', model: 'anthropic/claude-3-haiku', cost: '$0.00025' },
                          { name: 'Cohere', status: 'Inactive', model: 'command-r-plus', cost: '$0.003' }
                        ].map((provider) => (
                          <TableRow key={provider.name}>
                            <TableCell className="font-medium">{provider.name}</TableCell>
                            <TableCell>
                              <Badge variant={provider.status === 'Active' ? 'default' : 'destructive'}>
                                {provider.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{provider.model}</TableCell>
                            <TableCell className="text-green-600 font-semibold">{provider.cost}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  Configure
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant={provider.status === 'Active' ? 'destructive' : 'default'}
                                >
                                  {provider.status === 'Active' ? 'Disable' : 'Enable'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Usage Analytics */}
                <Card className="border-2 border-slate-200 dark:border-slate-700">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                    <CardTitle className="text-lg text-indigo-800 dark:text-indigo-200">Usage Analytics (Last 24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">5,500</div>
                        <div className="text-sm text-blue-500">Total Requests</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">5,347</div>
                        <div className="text-sm text-green-500">Successful</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">153</div>
                        <div className="text-sm text-red-500">Failed</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">97.2%</div>
                        <div className="text-sm text-yellow-500">Success Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Plan Edit Modal */}
        {editingPlan && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                {editingPlan.tier ? `Edit ${editingPlan.tier} Plan` : 'Create New Plan'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name</label>
                  <Input
                    value={editingPlan.tier}
                    onChange={(e) => setEditingPlan({...editingPlan, tier: e.target.value})}
                    placeholder="Enter plan name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Queries</label>
                    <Input
                      type="number"
                      value={editingPlan.maxQueries}
                      onChange={(e) => setEditingPlan({...editingPlan, maxQueries: Number(e.target.value)})}
                      placeholder="Enter max queries"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max File Size (MB)</label>
                    <Input
                      type="number"
                      value={editingPlan.maxFileSize}
                      onChange={(e) => setEditingPlan({...editingPlan, maxFileSize: Number(e.target.value)})}
                      placeholder="Enter max file size"
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Features</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
                      <input
                        type="checkbox"
                        checked={editingPlan.features.apiAccess}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          features: {...editingPlan.features, apiAccess: e.target.checked}
                        })}
                        className="rounded w-4 h-4 text-blue-600"
                      />
                      <span>API Access</span>
                    </label>
                    
                    <label className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
                      <input
                        type="checkbox"
                        checked={editingPlan.features.prioritySupport}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          features: {...editingPlan.features, prioritySupport: e.target.checked}
                        })}
                        className="rounded w-4 h-4 text-blue-600"
                      />
                      <span>Priority Support</span>
                    </label>
                    
                    <label className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
                      <input
                        type="checkbox"
                        checked={editingPlan.features.analytics}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          features: {...editingPlan.features, analytics: e.target.checked}
                        })}
                        className="rounded w-4 h-4 text-blue-600"
                      />
                      <span>Advanced Analytics</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setEditingPlan(null)}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                    onClick={() => {
                      setEditingPlan(null);
                      toast({
                        title: "Success",
                        description: editingPlan.tier 
                          ? `${editingPlan.tier} plan updated` 
                          : "New plan created",
                      });
                    }}
                  >
                    Save Plan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promo Create Modal */}
        {creatingPromo && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                Create New Promo Code
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <Input
                    placeholder="WELCOME20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Discount</SelectItem>
                      <SelectItem value="fixed">Fixed Amount Discount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Value</label>
                  <Input
                    type="number"
                    placeholder="20"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Uses (optional)</label>
                    <Input
                      type="number"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expiry Date (optional)</label>
                    <Input
                      type="date"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setCreatingPromo(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                    onClick={() => {
                      setCreatingPromo(false);
                      toast({
                        title: "Success",
                        description: "Promo code created",
                      });
                    }}
                  >
                    Create Promo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 