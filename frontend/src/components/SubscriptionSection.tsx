import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Crown, Zap, Star } from 'lucide-react';

type BillingCycle = 'monthly' | 'quarterly' | 'halfyearly' | 'yearly';
type PlanTier = 'basic' | 'premium' | 'diamond';

interface PlanConfig {
  name: string;
  icon: React.ReactNode;
  facultyLimit: number;
  pdfLimit: number;
  features: string[];
  prices: Record<BillingCycle, number>;
}

const PLANS: Record<PlanTier, PlanConfig> = {
  basic: {
    name: 'Basic',
    icon: <Zap className="h-5 w-5" />,
    facultyLimit: 30,
    pdfLimit: 100,
    features: ['30 Faculty Members', '100 PDFs', 'Basic Annotations', 'Email Support'],
    prices: { monthly: 999, quarterly: 2699, halfyearly: 4999, yearly: 8999 },
  },
  premium: {
    name: 'Premium',
    icon: <Star className="h-5 w-5" />,
    facultyLimit: 100,
    pdfLimit: 500,
    features: ['100 Faculty Members', '500 PDFs', 'Advanced Annotations', 'Priority Support', 'Analytics'],
    prices: { monthly: 2499, quarterly: 6999, halfyearly: 12999, yearly: 22999 },
  },
  diamond: {
    name: 'Diamond',
    icon: <Crown className="h-5 w-5" />,
    facultyLimit: 500,
    pdfLimit: 2000,
    features: ['500 Faculty Members', '2000 PDFs', 'All Annotation Tools', '24/7 Support', 'Analytics', 'Custom Branding'],
    prices: { monthly: 5999, quarterly: 16999, halfyearly: 31999, yearly: 55999 },
  },
};

const BILLING_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  halfyearly: 'Half-yearly',
  yearly: 'Yearly',
};

const STORAGE_KEY = 'adminSubscription';

interface SubscriptionState {
  tier: PlanTier;
  billing: BillingCycle;
}

interface SubscriptionSectionProps {
  facultyCount?: number;
  pdfCount?: number;
}

export default function SubscriptionSection({ facultyCount = 0, pdfCount = 0 }: SubscriptionSectionProps) {
  const [subscription, setSubscription] = useState<SubscriptionState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { tier: 'basic', billing: 'monthly' };
  });

  const [selectedBilling, setSelectedBilling] = useState<Record<PlanTier, BillingCycle>>({
    basic: subscription.billing,
    premium: subscription.billing,
    diamond: subscription.billing,
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
  }, [subscription]);

  const handleSelectPlan = (tier: PlanTier) => {
    setSubscription({ tier, billing: selectedBilling[tier] });
  };

  const activePlan = PLANS[subscription.tier];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(PLANS) as [PlanTier, PlanConfig][]).map(([tier, plan]) => {
          const isActive = subscription.tier === tier;
          const billing = selectedBilling[tier];
          const price = plan.prices[billing];

          return (
            <Card
              key={tier}
              className={`relative transition-all ${
                isActive
                  ? 'border-primary ring-2 ring-primary/20 shadow-elevated'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3">Current Plan</Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className={isActive ? 'text-primary' : 'text-muted-foreground'}>
                    {plan.icon}
                  </span>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <div className="mt-2">
                  <Select
                    value={billing}
                    onValueChange={(val) =>
                      setSelectedBilling((prev) => ({ ...prev, [tier]: val as BillingCycle }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(BILLING_LABELS) as [BillingCycle, string][]).map(
                        ([cycle, label]) => (
                          <SelectItem key={cycle} value={cycle} className="text-xs">
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-foreground">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">
                    /{BILLING_LABELS[billing].toLowerCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-foreground">{plan.facultyLimit}</div>
                    <div className="text-xs text-muted-foreground">Faculty</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-foreground">{plan.pdfLimit}</div>
                    <div className="text-xs text-muted-foreground">PDFs</div>
                  </div>
                </div>

                {isActive && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Faculty Usage</span>
                        <span>{facultyCount}/{plan.facultyLimit}</span>
                      </div>
                      <Progress value={(facultyCount / plan.facultyLimit) * 100} className="h-1.5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>PDF Usage</span>
                        <span>{pdfCount}/{plan.pdfLimit}</span>
                      </div>
                      <Progress value={(pdfCount / plan.pdfLimit) * 100} className="h-1.5" />
                    </div>
                  </div>
                )}

                <ul className="space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-success flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isActive ? 'secondary' : 'default'}
                  size="sm"
                  className="w-full"
                  onClick={() => handleSelectPlan(tier)}
                  disabled={isActive}
                >
                  {isActive ? 'Current Plan' : `Switch to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
