import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Check, Crown, Zap, Star, KeyRound } from 'lucide-react';
import { PLAN_TIERS, BillingCycle } from '@/hooks/useQueries';

type PlanName = 'basic' | 'premium' | 'diamond';

const PLAN_ICONS: Record<PlanName, React.ReactNode> = {
  basic: <Zap className="h-5 w-5" />,
  premium: <Star className="h-5 w-5" />,
  diamond: <Crown className="h-5 w-5" />,
};

const STORAGE_KEY = 'adminSubscription';

interface SubscriptionState {
  tier: PlanName;
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

  const [selectedBilling, setSelectedBilling] = useState<Record<PlanName, BillingCycle>>(() => {
    return {
      basic: subscription.billing,
      premium: subscription.billing,
      diamond: subscription.billing,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
    // Also persist plan name for faculty/pdf limit checks
    localStorage.setItem('eduboard_plan', subscription.tier);
  }, [subscription]);

  const handleSelectPlan = (tier: PlanName) => {
    setSubscription({ tier, billing: selectedBilling[tier] });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_TIERS.map((plan) => {
          const tier = plan.name as PlanName;
          const isActive = subscription.tier === tier;
          const billing = selectedBilling[tier];
          const cycleOption = plan.billingCycles.find((c) => c.key === billing) ?? plan.billingCycles[0];
          const price = cycleOption.priceInr;

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
                    {PLAN_ICONS[tier]}
                  </span>
                  <CardTitle className="text-lg">{plan.label}</CardTitle>
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
                      {plan.billingCycles.map((cycle) => (
                        <SelectItem key={cycle.key} value={cycle.key} className="text-xs">
                          {cycle.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-foreground">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">
                    /{cycleOption.label.toLowerCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Key stats grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <div className="text-base font-bold text-foreground">{plan.maxFaculty}</div>
                    <div className="text-xs text-muted-foreground">Faculty</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <div className="text-base font-bold text-foreground">{plan.maxPdfs.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">PDFs</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <KeyRound className="h-3 w-3 text-primary" />
                      <div className="text-base font-bold text-foreground">{plan.licenseCount}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Licenses</div>
                  </div>
                </div>

                {/* Usage progress bars for active plan */}
                {isActive && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Faculty Usage</span>
                        <span>{facultyCount}/{plan.maxFaculty}</span>
                      </div>
                      <Progress value={(facultyCount / plan.maxFaculty) * 100} className="h-1.5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>PDF Usage</span>
                        <span>{pdfCount}/{plan.maxPdfs}</span>
                      </div>
                      <Progress value={(pdfCount / plan.maxPdfs) * 100} className="h-1.5" />
                    </div>
                  </div>
                )}

                {/* Feature list */}
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
                  {isActive ? 'Current Plan' : `Switch to ${plan.label}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
