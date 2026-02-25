import React, { useState } from 'react';
import { Crown, Users, FileText, CheckCircle2, AlertTriangle, Zap, Gem } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PLAN_TIERS, type PlanTier, type BillingCycle } from '@/hooks/useQueries';
import type { Faculty } from '@/backend';

interface SubscriptionSectionProps {
  allFaculty: Faculty[];
  pdfCount: number;
}

const PLAN_COLORS: Record<string, { bg: string; border: string; badge: string; icon: string; activeBorder: string; button: string }> = {
  basic: {
    bg: 'bg-primary/5',
    border: 'border-primary/30',
    activeBorder: 'border-primary ring-2 ring-primary/20',
    badge: 'bg-primary/10 text-primary',
    icon: 'text-primary',
    button: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  },
  premium: {
    bg: 'bg-accent/5',
    border: 'border-accent/40',
    activeBorder: 'border-accent ring-2 ring-accent/20',
    badge: 'bg-accent/15 text-accent-foreground',
    icon: 'text-accent',
    button: 'bg-accent hover:bg-accent/90 text-accent-foreground',
  },
  diamond: {
    bg: 'bg-sky-500/5',
    border: 'border-sky-400/40',
    activeBorder: 'border-sky-500 ring-2 ring-sky-400/20',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    icon: 'text-sky-500',
    button: 'bg-sky-600 hover:bg-sky-700 text-white',
  },
};

function UsageBar({
  label,
  current,
  max,
  icon: Icon,
}: {
  label: string;
  current: number;
  max: number;
  icon: React.ElementType;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const isWarning = pct >= 80 && pct < 100;
  const isAtLimit = pct >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        <span className="flex items-center gap-1.5">
          {isAtLimit && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
          {isWarning && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
          <span
            className={`font-semibold tabular-nums ${
              isAtLimit ? 'text-destructive' : isWarning ? 'text-warning' : 'text-foreground'
            }`}
          >
            {current} / {max}
          </span>
        </span>
      </div>
      <Progress
        value={pct}
        className={`h-2 ${
          isAtLimit
            ? '[&>div]:bg-destructive'
            : isWarning
            ? '[&>div]:bg-warning'
            : '[&>div]:bg-primary'
        }`}
      />
      {isAtLimit && (
        <p className="text-xs text-destructive font-medium">
          Limit reached — upgrade your plan to add more.
        </p>
      )}
    </div>
  );
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

function PlanCard({
  plan,
  isActive,
  activeBillingCycle,
  facultyCount,
  pdfCount,
  onSelect,
}: {
  plan: PlanTier;
  isActive: boolean;
  activeBillingCycle: BillingCycle;
  facultyCount: number;
  pdfCount: number;
  onSelect: (planName: string, cycle: BillingCycle) => void;
}) {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');
  const colors = PLAN_COLORS[plan.name];

  const currentCycleData = plan.billingCycles.find((c) => c.key === selectedCycle)!;
  const isCurrentSelection = isActive && activeBillingCycle === selectedCycle;

  const PlanIcon =
    plan.name === 'diamond' ? Gem : plan.name === 'premium' ? Crown : Zap;

  return (
    <TooltipProvider>
      <div
        className={`
          relative rounded-xl border-2 p-5 transition-all duration-200 flex flex-col
          ${isActive ? `${colors.activeBorder} ${colors.bg}` : `border-border bg-card hover:${colors.border}`}
        `}
      >
        {isActive && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground text-xs px-2.5 py-0.5 shadow-sm whitespace-nowrap">
              Current Plan
            </Badge>
          </div>
        )}

        <div className="space-y-4 flex-1 flex flex-col">
          {/* Plan Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlanIcon className={`h-5 w-5 ${colors.icon}`} />
              <span className="font-display font-bold text-lg text-foreground">{plan.label}</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
              {plan.name.toUpperCase()}
            </span>
          </div>

          {/* Billing Cycle Selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Billing Cycle
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {plan.billingCycles.map((cycle) => (
                <button
                  key={cycle.key}
                  onClick={() => setSelectedCycle(cycle.key)}
                  className={`
                    text-xs px-2 py-1.5 rounded-md border font-medium transition-all duration-150
                    ${
                      selectedCycle === cycle.key
                        ? `${colors.badge} border-current`
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground bg-background'
                    }
                  `}
                >
                  {cycle.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Display */}
          <div className="text-center py-2 rounded-lg bg-background/60 border border-border/50">
            <div className={`text-2xl font-bold ${colors.icon}`}>
              {formatPrice(currentCycleData.priceInr)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              per {currentCycleData.label.toLowerCase()}
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-2.5 rounded-lg bg-background/60 border border-border/50 cursor-default">
                  <Users className="h-4 w-4 text-muted-foreground mb-1" />
                  <span className="font-bold text-lg text-foreground">{plan.maxFaculty}</span>
                  <span className="text-xs text-muted-foreground">Faculty</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Up to {plan.maxFaculty} active faculty members</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-2.5 rounded-lg bg-background/60 border border-border/50 cursor-default">
                  <FileText className="h-4 w-4 text-muted-foreground mb-1" />
                  <span className="font-bold text-lg text-foreground">{plan.maxPdfs}</span>
                  <span className="text-xs text-muted-foreground">PDFs</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Up to {plan.maxPdfs} PDF uploads</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Features */}
          <ul className="space-y-1.5 flex-1">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          {/* Usage if active */}
          {isActive && (
            <div className="pt-2 border-t border-border/50 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Current Usage
              </p>
              <UsageBar
                label="Faculty"
                current={facultyCount}
                max={plan.maxFaculty}
                icon={Users}
              />
              <UsageBar
                label="PDFs"
                current={pdfCount}
                max={plan.maxPdfs}
                icon={FileText}
              />
            </div>
          )}

          {/* Select Button */}
          <button
            onClick={() => onSelect(plan.name, selectedCycle)}
            disabled={isCurrentSelection}
            className={`
              mt-auto w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-150
              ${
                isCurrentSelection
                  ? 'bg-muted text-muted-foreground cursor-default border border-border'
                  : `${colors.button} shadow-sm hover:shadow-md`
              }
            `}
          >
            {isCurrentSelection ? 'Current Plan' : isActive ? 'Change Cycle' : 'Select Plan'}
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Local storage key for persisting selected plan
const SELECTED_PLAN_KEY = 'eduboard_selected_plan';

interface SelectedPlan {
  planName: 'basic' | 'premium' | 'diamond';
  billingCycle: BillingCycle;
}

function loadSelectedPlan(): SelectedPlan | null {
  try {
    const raw = localStorage.getItem(SELECTED_PLAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SelectedPlan;
  } catch {
    return null;
  }
}

function saveSelectedPlan(plan: SelectedPlan) {
  try {
    localStorage.setItem(SELECTED_PLAN_KEY, JSON.stringify(plan));
  } catch {
    // ignore
  }
}

export default function SubscriptionSection({
  allFaculty,
  pdfCount,
}: SubscriptionSectionProps) {
  const activeFacultyCount = allFaculty.filter((f) => f.active).length;

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>(
    () => loadSelectedPlan() ?? { planName: 'basic', billingCycle: 'monthly' }
  );

  const handleSelectPlan = (planName: string, cycle: BillingCycle) => {
    const newPlan: SelectedPlan = {
      planName: planName as SelectedPlan['planName'],
      billingCycle: cycle,
    };
    setSelectedPlan(newPlan);
    saveSelectedPlan(newPlan);
  };

  const activePlanTier = PLAN_TIERS.find((p) => p.name === selectedPlan.planName)!;
  const activeCycleData = activePlanTier.billingCycles.find(
    (c) => c.key === selectedPlan.billingCycle
  )!;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Crown className="h-5 w-5 text-accent" />
          Subscription Plan
        </CardTitle>
        <CardDescription>
          Choose your plan and billing cycle. Current plan:{' '}
          <span className="font-semibold text-foreground">
            {activePlanTier.label} — {activeCycleData.label} ({formatPrice(activeCycleData.priceInr)} / {activeCycleData.label.toLowerCase()})
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLAN_TIERS.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              isActive={plan.name === selectedPlan.planName}
              activeBillingCycle={selectedPlan.billingCycle}
              facultyCount={activeFacultyCount}
              pdfCount={pdfCount}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
