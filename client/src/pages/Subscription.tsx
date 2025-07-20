import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Shield, Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

interface PlanFeatures {
  maxQueries: number;
  maxFileSize: number;
  aiProviders: string[];
  advancedAnalysis: boolean;
  prioritySupport: boolean;
  exportFormats: string[];
  collaborativeFeatures: boolean;
  apiAccess: boolean;
}

interface PlanLimit {
  id: number;
  tier: 'free' | 'premium' | 'enterprise';
  features: PlanFeatures;
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

const planPricing = {
  free: { price: 0, period: 'Forever' },
  premium: { price: 19.99, period: 'Monthly' },
  enterprise: { price: 99.99, period: 'Monthly' }
};

const planIcons = {
  free: Star,
  premium: Zap,
  enterprise: Crown
};

export default function Subscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);

  const { data: currentSubscription } = useQuery({
    queryKey: ['/api/subscription/current'],
    enabled: !!user
  });

  const { data: freePlan } = useQuery({
    queryKey: ['/api/plan-limits/free'],
    enabled: !!user
  });

  const { data: premiumPlan } = useQuery({
    queryKey: ['/api/plan-limits/premium'],
    enabled: !!user
  });

  const { data: enterprisePlan } = useQuery({
    queryKey: ['/api/plan-limits/enterprise'],
    enabled: !!user
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ tier }: { tier: string }) => {
      // Simulate PayPal subscription creation
      const paypalSubscriptionId = `PAYPAL_${tier.toUpperCase()}_${Date.now()}`;
      
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user?.firebaseUid!,
        },
        body: JSON.stringify({
          paypalSubscriptionId,
          tier
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Activated!",
        description: "Your plan has been successfully upgraded.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onError: () => {
      toast({
        title: "Subscription Failed",
        description: "There was an error processing your subscription.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoading(null);
    }
  });

  const handleSubscribe = (tier: string) => {
    setLoading(tier);
    subscribeMutation.mutate({ tier });
  };

  const formatFeatureValue = (key: string, value: any) => {
    if (key === 'maxQueries' && value === -1) return 'Unlimited';
    if (key === 'maxFileSize') return `${value}MB`;
    if (Array.isArray(value)) return value.join(', ');
    return value.toString();
  };

  const PlanCard = ({ plan, tier }: { plan: PlanLimit; tier: 'free' | 'premium' | 'enterprise' }) => {
    const Icon = planIcons[tier];
    const pricing = planPricing[tier];
    const isCurrentPlan = user?.tier === tier;
    const isUpgrade = user?.tier === 'free' && tier !== 'free';
    
    return (
      <Card className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''} ${tier === 'premium' ? 'border-primary shadow-lg' : ''}`}>
        {tier === 'premium' && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
          </div>
        )}
        
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Icon className={`h-8 w-8 ${
              tier === 'free' ? 'text-gray-500' :
              tier === 'premium' ? 'text-blue-500' :
              'text-purple-500'
            }`} />
          </div>
          <CardTitle className="capitalize text-2xl">{tier}</CardTitle>
          <div className="text-3xl font-bold">
            ${pricing.price}
            <span className="text-sm font-normal text-muted-foreground">/{pricing.period}</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                {plan.features.maxQueries === -1 ? 'Unlimited' : plan.features.maxQueries} queries/month
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">{plan.features.maxFileSize}MB file uploads</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">{plan.features.aiProviders.length} AI provider(s)</span>
            </div>
            
            {plan.features.advancedAnalysis && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Advanced bioinformatics analysis</span>
              </div>
            )}
            
            {plan.features.prioritySupport && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Priority support</span>
              </div>
            )}
            
            {plan.features.collaborativeFeatures && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Collaborative features</span>
              </div>
            )}
            
            {plan.features.apiAccess && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">API access</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Export: {plan.features.exportFormats.join(', ')}</span>
            </div>
          </div>
          
          <div className="pt-4">
            {isCurrentPlan ? (
              <Button className="w-full" disabled>
                <Shield className="h-4 w-4 mr-2" />
                Current Plan
              </Button>
            ) : (
              <Button
                className="w-full"
                variant={tier === 'premium' ? 'default' : 'outline'}
                onClick={() => handleSubscribe(tier)}
                disabled={loading === tier || !isUpgrade}
              >
                {loading === tier ? 'Processing...' : 
                 tier === 'free' ? 'Downgrade' : 'Upgrade'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Please sign in to view subscription options.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your BioScriptor Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock the full potential of AI-powered bioinformatics analysis with our flexible pricing plans.
          </p>
        </div>

        {/* Current Subscription Info */}
        {currentSubscription && (
          <div className="mb-8">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <Badge>{currentSubscription.tier}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                      {currentSubscription.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span>{new Date(currentSubscription.startDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {freePlan && <PlanCard plan={freePlan} tier="free" />}
          {premiumPlan && <PlanCard plan={premiumPlan} tier="premium" />}
          {enterprisePlan && <PlanCard plan={enterprisePlan} tier="enterprise" />}
        </div>

        {/* Usage Information */}
        <div className="mt-12 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Your Current Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{user.queryCount}</div>
                  <div className="text-sm text-muted-foreground">Queries Used</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary capitalize">{user.tier}</div>
                  <div className="text-sm text-muted-foreground">Current Tier</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {user.tier === 'free' ? '50' : user.tier === 'premium' ? '500' : '∞'}
                  </div>
                  <div className="text-sm text-muted-foreground">Query Limit</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="mt-12 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p><strong>AI Providers:</strong> Free (Ollama), Premium (Groq, Together, Ollama), Enterprise (All providers)</p>
                <p><strong>File Support:</strong> FASTA, GenBank, PDB, CSV formats supported on all plans</p>
                <p><strong>Security:</strong> Military-grade security and fault-tolerant architecture on all plans</p>
                <p><strong>Support:</strong> Community support (Free), Email support (Premium), Priority support (Enterprise)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}