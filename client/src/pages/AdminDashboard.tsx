import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, CreditCard, Activity, Settings, Shield, LogOut, RefreshCw, Plus, Edit, Trash2, Search, FileText, BarChart2, Zap, Gift, ShieldCheck, Library, File, FileBarChart, Server, Network, Key, AlertCircle, ClipboardList, UserCheck, UserX, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';

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
  apiStatus: Record<string, boolean>;
  systemStatus: {
    database: boolean;
    cache: boolean;
    security: boolean;
    rateLimiting: boolean;
    auditLogs: boolean;
  };
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
  credits: number;
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

interface APIStatus {
  groq: boolean;
  together: boolean;
  openrouter: boolean;
  cohere: boolean;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
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

  // Mock API status data
  const apiStatusData: APIStatus = {
    groq: true,
    together: true,
    openrouter: true,
    cohere: false
  };

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<AdminAnalytics>({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      return {
        totalUsers: 1242,
        activeUsers: 893,
        usersByTier: { free: 642, premium: 423, enterprise: 177 },
        totalSubscriptions: 600,
        activeSubscriptions: 542,
        queriesLast24h: 2847,
        monthlyRevenue: 8423.50,
        conversionRate: 14.3,
        recentActivity: [
          { id: 1, adminUserId: 1, action: 'User Upgraded', targetResource: 'User #123', details: 'Upgraded to Premium', timestamp: new Date().toISOString() },
          { id: 2, adminUserId: 1, action: 'Plan Edited', targetResource: 'Enterprise Plan', details: 'Increased file size limit', timestamp: new Date().toISOString() }
        ],
        apiStatus: apiStatusData,
        systemStatus: {
          database: true,
          cache: true,
          security: true,
          rateLimiting: true,
          auditLogs: true
        }
      };
    }
  });

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      return Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        email: `user${i + 1}@example.com`,
        displayName: `User ${i + 1}`,
        tier: i % 3 === 0 ? 'free' : i % 3 === 1 ? 'premium' : 'enterprise',
        queryCount: Math.floor(Math.random() * 500),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        status: i % 10 === 0 ? 'banned' : 'active',
        lastActive: new Date(Date.now() - Math.floor(Math.random() * 24) * 3600000).toISOString(),
        credits: Math.floor(Math.random() * 100)
      }));
    }
  });

  const { data: subscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery<Subscription[]>({
    queryKey: ['adminSubscriptions'],
    queryFn: async () => {
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

  // Handle actions
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

  // Navigation
  const [activeSection, setActiveSection] = useState('dashboard');

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

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={18} /> },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'subscriptions', label: 'Payments', icon: <CreditCard size={18} /> },
    { id: 'apis', label: 'APIs', icon: <Server size={18} /> },
    { id: 'activity', label: 'Activity Logs', icon: <ClipboardList size={18} /> },
    { id: 'plans', label: 'Plans', icon: <FileText size={18} /> },
    { id: 'promos', label: 'Promos', icon: <Gift size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
            BioScriptor Admin
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Admin Control Panel</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-7xl">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Dashboard Overview</h2>
                <Button 
                  onClick={() => refetchAnalytics()}
                  className="gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh Data
                </Button>
              </div>

              {/* Analytics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { 
                    title: 'Total Users', 
                    value: analytics?.totalUsers || 0, 
                    change: '+12.4%', 
                    icon: <Users size={20} />,
                    color: 'from-blue-500 to-indigo-500'
                  },
                  { 
                    title: 'Active Subscriptions', 
                    value: analytics?.activeSubscriptions || 0, 
                    change: '+8.2%', 
                    icon: <CreditCard size={20} />,
                    color: 'from-green-500 to-emerald-500'
                  },
                  { 
                    title: 'Monthly Revenue', 
                    value: `$${analytics?.monthlyRevenue?.toFixed(2) || '0.00'}`, 
                    change: '+5.7%', 
                    icon: <FileBarChart size={20} />,
                    color: 'from-purple-500 to-violet-500'
                  },
                  { 
                    title: 'Queries (24h)', 
                    value: analytics?.queriesLast24h || 0, 
                    change: '+21.3%', 
                    icon: <Zap size={20} />,
                    color: 'from-amber-500 to-orange-500'
                  }
                ].map((metric, index) => (
                  <motion.div
                    key={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full">
                      <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {metric.title}
                        </CardTitle>
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${metric.color}`}>
                          {metric.icon}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="text-green-500">{metric.change}</span> from last month
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck size={20} />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {analytics?.systemStatus && Object.entries(analytics.systemStatus).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <Badge variant={value ? 'default' : 'destructive'}>
                            {value ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity size={20} />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics?.recentActivity.slice(0, 3).map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                          <UserCheck size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-sm text-slate-500">{activity.targetResource}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* API Status */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server size={20} />
                    API Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {analytics?.apiStatus && Object.entries(analytics.apiStatus).map(([provider, status]) => (
                      <Card key={provider} className={`border ${status ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'}`}>
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
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Users Section */}
          {activeSection === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">User Management</h2>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => refetchUsers()}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-xl p-6">
                  <div className="flex flex-col gap-4">
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
                          <TableRow className="bg-slate-50 dark:bg-slate-800">
                            <TableHead>User</TableHead>
                            <TableHead className="hidden sm:table-cell">Tier</TableHead>
                            <TableHead className="hidden md:table-cell">Queries</TableHead>
                            <TableHead className="hidden lg:table-cell">Credits</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
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
                              <TableCell className="hidden lg:table-cell font-mono">
                                {user.credits}
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
                                    Reset Limit
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpgradeUser(user.id, 'premium')}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                  >
                                    Upgrade
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={user.status === 'banned' ? 'default' : 'destructive'}
                                    onClick={() => handleBanUser(user.id, user.status !== 'banned')}
                                  >
                                    {user.status === 'banned' ? 'Unban' : 'Ban'}
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
            </motion.div>
          )}

          {/* Payments Section */}
          {activeSection === 'subscriptions' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Payments & Subscriptions</h2>
                <Button 
                  onClick={() => refetchSubscriptions()}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh
                </Button>
              </div>

              <Tabs defaultValue="current">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="current">Current Subscriptions</TabsTrigger>
                  <TabsTrigger value="webhooks">Webhook Logs</TabsTrigger>
                  <TabsTrigger value="failed">Failed Payments</TabsTrigger>
                  <TabsTrigger value="manual">Manual Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="current">
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Subscriptions</CardTitle>
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
                                <TableHead>PayPal ID</TableHead>
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
                                    ```text
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
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="webhooks">
                  <Card>
                    <CardHeader>
                      <CardTitle>Webhook Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="failed">
                  <Card>
                    <CardHeader>
                      <CardTitle>Failed & Cancelled Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold">Failed Payment History</h3>
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
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="manual">
                  <Card>
                    <CardHeader>
                      <CardTitle>Manual Subscription Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Manual Subscription Change</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">User Email</label>
                              <Input
                                type="email"
                                placeholder="user@example.com"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">New Tier</label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select tier" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                  <SelectItem value="lifetime">Lifetime</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Reason</label>
                              <Input
                                placeholder="Reason for manual change..."
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
                              <Input
                                type="email"
                                placeholder="user@example.com"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Access Level</label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select access level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="premium_lifetime">Premium Lifetime</SelectItem>
                                  <SelectItem value="enterprise_lifetime">Enterprise Lifetime</SelectItem>
                                  <SelectItem value="custom">Custom Access</SelectItem>
                                </SelectContent>
                              </Select>
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
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {/* APIs Section */}
          {activeSection === 'apis' && (
            <motion.div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">API Management</h2>
                <Button
                  onClick={() => refetchAnalytics()}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh Status
                </Button>
              </div>

              <Tabs defaultValue="status">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="status">API Status</TabsTrigger>
                  <TabsTrigger value="routing">Model Routing</TabsTrigger>
                  <TabsTrigger value="keys">API Keys</TabsTrigger>
                  <TabsTrigger value="errors">Error Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="status">
                  <Card>
                    <CardHeader>
                      <CardTitle>API Provider Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(apiStatusData).map(([provider, status]) => (
                          <Card key={provider} className={`border-2 ${status ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'}`}>
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
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="routing">
                  <Card>
                    <CardHeader>
                      <CardTitle>Model Routing & Priority</CardTitle>
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
                                <div key={model.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 rounded">
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

                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle>Load Balancing Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Fallback Strategy</label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select strategy" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="priority">Priority Order</SelectItem>
                                  <SelectItem value="round_robin">Round Robin</SelectItem>
                                  <SelectItem value="least_load">Least Load</SelectItem>
                                  <SelectItem value="fastest">Fastest Response</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Retry Attempts</label>
                              <Input
                                type="number"
                                defaultValue="3"
                                min="1"
                                max="5"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Timeout (seconds)</label>
                              <Input
                                type="number"
                                defaultValue="30"
                                min="5"
                                max="120"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Rate Limit (req/min)</label>
                              <Input
                                type="number"
                                defaultValue="100"
                                min="10"
                                max="1000"
                              />
                            </div>
                          </div>
                          <Button className="mt-4">Save Settings</Button>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="keys">
                  <Card>
                    <CardHeader>
                      <CardTitle>API Key Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(apiStatusData).map(([provider, status]) => (
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
                                    <Input
                                      type="password"
                                      defaultValue={status ? "••••••••••••••••" : ""}
                                      placeholder="Enter API key..."
                                    />
                                    <Button size="sm" variant="outline">Test</Button>
                                  </div>
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
                                <Input
                                  placeholder="e.g., Custom API"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">API Type</label>
                                <Select defaultValue="openai">
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select API type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="openai">OpenAI Compatible</SelectItem>
                                    <SelectItem value="anthropic">Anthropic</SelectItem>
                                    <SelectItem value="cohere">Cohere</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">API Key</label>
                                <Input
                                  type="password"
                                  placeholder="Enter API key..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Endpoint URL</label>
                                <Input
                                  type="url"
                                  placeholder="https://api.example.com/v1/chat"
                                />
                              </div>
                            </div>
                            <Button>Add API Provider</Button>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="errors">
                  <Card>
                    <CardHeader>
                      <CardTitle>API Error Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {/* Activity Logs Section */}
          {activeSection === 'activity' && (
            <motion.div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Activity Logs</h2>
                <Button
                  onClick={() => refetchAnalytics()}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh Logs
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Admin Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
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
                        {analytics?.recentActivity.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>Admin #{log.adminUserId}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {log.targetResource}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              {log.details}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Plans Section */}
          {activeSection === 'plans' && (
            <motion.div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Plan Management</h2>
                <Button
                  onClick={() => setEditingPlan({ tier: '', maxQueries: 0, maxFileSize: 10, features: {} })}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                >
                  Create New Plan
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { tier: 'free', icon: '&#127378;', price: 0 },
                  { tier: 'premium', icon: '&#11088;', price: 9.99 },
                  { tier: 'enterprise', icon: '&#127982;', price: 49.99 }
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
                          <span>{tier === 'free' ? '&#10060;' : '&#9989;'}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span>Priority Support:</span>
                          <span>{tier === 'enterprise' ? '&#9989;' : '&#10060;'}</span>
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
                              prioritySupport: tier === 'enterprise',
                              analytics: tier === 'enterprise'
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
            </motion.div>
          )}

          {/* Promos Section */}
          {activeSection === 'promos' && (
            <motion.div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Promo Code Management</h2>
                <Button
                  onClick={() => setCreatingPromo(true)}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                >
                  Create Promo Code
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Active Promo Codes</CardTitle>
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
                            <TableCell>{promo.usedCount}/{promo.maxUses || '&#8734;'}</TableCell>
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
              </Card>
            </motion.div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <motion.div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">System Settings</h2>
                <p className="text-slate-600 dark:text-slate-400">Configure global system preferences</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>System Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Security Settings</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div>
                            <div className="font-medium">Two-Factor Authentication</div>
                            <div className="text-sm text-slate-500">Require 2FA for admin access</div>
                          </div>
                          <Button size="sm" variant="outline">Enable</Button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div>
                            <div className="font-medium">Session Timeout</div>
                            <div className="text-sm text-slate-500">Automatic logout after inactivity</div>
                          </div>
                          <Select defaultValue="30">
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                                  <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Rate Limiting</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">Free Tier</label>
                          <Input type="number" defaultValue="10" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Premium Tier</label>
                          <Input type="number" defaultValue="1000" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Enterprise Tier</label>
                          <Input type="number" defaultValue="0" placeholder="Unlimited" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Audit Logs</h3>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div>
                          <div className="font-medium">Log Retention</div>
                          <div className="text-sm text-slate-500">How long to keep audit logs</div>
                        </div>
                        <Select defaultValue="90">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="180">180 days</SelectItem>
                            <SelectItem value="365">1 year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button>Save Settings</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <h3 className="font-medium text-red-700 dark:text-red-300 mb-2">Reset System</h3>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                        This will reset all settings to their default values. Proceed with caution.
                      </p>
                      <Button variant="destructive" size="sm">Reset Settings</Button>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <h3 className="font-medium text-red-700 dark:text-red-300 mb-2">Clear All Data</h3>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                        Warning: This will permanently delete all user data and cannot be undone.
                      </p>
                      <Button variant="destructive" size="sm">Purge All Data</Button>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <h3 className="font-medium text-amber-700 dark:text-amber-300 mb-2">Export Data</h3>
                      <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                        Download a backup of all system data.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Export Users</Button>
                        <Button variant="outline" size="sm">Export Logs</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </div>
      </div>

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
                      checked={editingPlan.features.apiAccess || false}
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
                      checked={editingPlan.features.prioritySupport || false}
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
                      checked={editingPlan.features.analytics || false}
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
  );
}