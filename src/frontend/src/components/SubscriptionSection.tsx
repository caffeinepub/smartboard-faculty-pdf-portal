import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PLAN_TIERS } from "@/hooks/useQueries";
import {
  Check,
  Copy,
  CreditCard,
  Crown,
  FileText,
  Landmark,
  Monitor,
  Printer,
  Smartphone,
  Star,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type PlanName = "basic" | "premium" | "diamond";
type PaymentMode = "upi" | "card" | "netbanking" | "banktransfer" | "dd";
type BillingCycle = "monthly" | "quarterly" | "halfyearly" | "yearly";

const BANK_DETAILS = {
  accountNo: "923010040162770",
  ifsc: "UTIB0001496",
  bankName: "AXIS BANK",
  beneficiary: "EduBoards",
};

const BANK_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&data=${encodeURIComponent(
  "upi://pay?pa=923010040162770@axisbank&pn=EduBoards&cu=INR",
)}`;

const PLAN_ICONS: Record<PlanName, React.ReactNode> = {
  basic: <Zap className="h-5 w-5" />,
  premium: <Star className="h-5 w-5" />,
  diamond: <Crown className="h-5 w-5" />,
};

const BILLING_CYCLES: { key: BillingCycle; label: string }[] = [
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "halfyearly", label: "Half-Yearly" },
  { key: "yearly", label: "Yearly" },
];

const PLAN_PRICES: Record<PlanName, Record<BillingCycle, number>> = {
  basic: { monthly: 8000, quarterly: 25000, halfyearly: 50000, yearly: 100000 },
  premium: {
    monthly: 16500,
    quarterly: 50000,
    halfyearly: 100000,
    yearly: 200000,
  },
  diamond: {
    monthly: 33000,
    quarterly: 100000,
    halfyearly: 200000,
    yearly: 400000,
  },
};

const PAYMENT_MODES: {
  key: PaymentMode;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "upi",
    label: "UPI (Google Pay, PhonePe, Paytm)",
    icon: <Smartphone className="h-4 w-4" />,
  },
  {
    key: "banktransfer",
    label: "Bank Transfer (NEFT / RTGS / IMPS)",
    icon: <Landmark className="h-4 w-4" />,
  },
  {
    key: "card",
    label: "Credit / Debit Card",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    key: "netbanking",
    label: "Net Banking (Online)",
    icon: <Landmark className="h-4 w-4" />,
  },
  {
    key: "dd",
    label: "Demand Draft / Cheque",
    icon: <FileText className="h-4 w-4" />,
  },
];

const BANKS = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Other"];
const STORAGE_KEY = "adminSubscription";

interface SubscriptionState {
  tier: PlanName;
}

interface SubscriptionSectionProps {
  facultyCount?: number;
  pdfCount?: number;
  deviceCount?: number;
}

interface InvoiceData {
  invoiceNo: string;
  date: string;
  plan: string;
  planLabel: string;
  cycleLabel: string;
  devices: number;
  faculty: number;
  pdfs: number;
  baseAmount: number;
  gst: number;
  total: number;
  paymentMode: string;
  txnRef: string;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
    >
      <Copy className="h-3 w-3" />
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function isPaymentValid(
  mode: PaymentMode,
  upiId: string,
  cardNumber: string,
  expiry: string,
  cvv: string,
  bank: string,
  txnRef: string,
): boolean {
  switch (mode) {
    case "upi":
      return upiId.trim().length > 0;
    case "card": {
      const digits = cardNumber.replace(/\s/g, "");
      const expiryValid = /^\d{2}\/\d{2}$/.test(expiry);
      const cvvValid = /^\d{3,4}$/.test(cvv);
      return digits.length === 16 && expiryValid && cvvValid;
    }
    case "netbanking":
      return bank.trim().length > 0;
    case "banktransfer":
      return txnRef.trim().length > 0;
    case "dd":
      return true;
    default:
      return false;
  }
}

export default function SubscriptionSection({
  facultyCount = 0,
  pdfCount = 0,
  deviceCount = 0,
}: SubscriptionSectionProps) {
  const [subscription, setSubscription] = useState<SubscriptionState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { tier: parsed.tier ?? "basic" };
      }
    } catch {}
    return { tier: "basic" };
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanName | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("banktransfer");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [bank, setBank] = useState("");
  const [txnRef, setTxnRef] = useState("");
  const [processing, setProcessing] = useState(false);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
    localStorage.setItem("eduboard_plan", subscription.tier);
  }, [subscription]);

  const openPaymentModal = (tier: PlanName) => {
    setSelectedPlan(tier);
    setBillingCycle("yearly");
    setPaymentMode("banktransfer");
    setUpiId("");
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setBank("");
    setTxnRef("");
    setModalOpen(true);
  };

  const paymentValid = selectedPlan
    ? isPaymentValid(paymentMode, upiId, cardNumber, expiry, cvv, bank, txnRef)
    : false;

  const handleConfirmPayment = async () => {
    if (!selectedPlan || !paymentValid) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));

    const plan = PLAN_TIERS.find((p) => p.name === selectedPlan);
    const cycleLabel =
      BILLING_CYCLES.find((c) => c.key === billingCycle)?.label ?? "";
    const payModeLabel =
      PAYMENT_MODES.find((m) => m.key === paymentMode)?.label ?? paymentMode;

    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const invoiceNo = `INV-${datePart}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const dateStr = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const userCount = (facultyCount || 0) + 1; // +1 for admin
    const invoiceTotal = userCount * 2500; // ₹2,500 per user inclusive of GST
    const gst = Math.round((invoiceTotal * 18) / 118);
    const baseAmount = invoiceTotal - gst;

    setSubscription({ tier: selectedPlan });
    setProcessing(false);
    setModalOpen(false);

    setInvoiceData({
      invoiceNo,
      date: dateStr,
      plan: selectedPlan,
      planLabel: plan?.label ?? selectedPlan,
      cycleLabel,
      devices: plan?.maxDevices ?? 0,
      faculty: plan?.maxFaculty ?? 0,
      pdfs: plan?.maxPdfs ?? 0,
      baseAmount,
      gst,
      total: invoiceTotal,
      paymentMode: payModeLabel,
      txnRef: txnRef || "-",
    });

    setTimeout(() => {
      setInvoiceOpen(true);
      toast.success(
        `Subscribed to ${plan?.label} (${cycleLabel}) — ₹${invoiceTotal.toLocaleString("en-IN")}`,
      );
    }, 200);
  };

  const selectedPlanData = selectedPlan
    ? PLAN_TIERS.find((p) => p.name === selectedPlan)
    : null;
  const selectedPrice = selectedPlan
    ? PLAN_PRICES[selectedPlan][billingCycle]
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_TIERS.map((plan) => {
          const tier = plan.name as PlanName;
          const isActive = subscription.tier === tier;

          return (
            <Card
              key={tier}
              data-ocid={`subscription.${tier}.card`}
              className={`relative transition-all ${
                isActive
                  ? "border-primary ring-2 ring-primary/20 shadow-elevated"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3">
                    Current Plan
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      isActive ? "text-primary" : "text-muted-foreground"
                    }
                  >
                    {PLAN_ICONS[tier]}
                  </span>
                  <CardTitle className="text-lg">{plan.label}</CardTitle>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Yearly
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-foreground">
                    ₹2,500
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">
                    /user (incl. GST)
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <div className="text-base font-bold text-foreground">
                      {plan.maxFaculty}
                    </div>
                    <div className="text-xs text-muted-foreground">Faculty</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <div className="text-base font-bold text-foreground">
                      {plan.maxPdfs.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">PDFs</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Monitor className="h-3 w-3 text-primary" />
                      <div className="text-base font-bold text-foreground">
                        {plan.maxDevices}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Devices</div>
                  </div>
                </div>

                {isActive && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Faculty Usage</span>
                        <span>
                          {facultyCount}/{plan.maxFaculty}
                        </span>
                      </div>
                      <Progress
                        value={(facultyCount / plan.maxFaculty) * 100}
                        className="h-1.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>PDF Usage</span>
                        <span>
                          {pdfCount}/{plan.maxPdfs}
                        </span>
                      </div>
                      <Progress
                        value={(pdfCount / plan.maxPdfs) * 100}
                        className="h-1.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Device Usage</span>
                        <span>
                          {deviceCount}/{plan.maxDevices}
                        </span>
                      </div>
                      <Progress
                        value={(deviceCount / plan.maxDevices) * 100}
                        className="h-1.5"
                      />
                    </div>
                  </div>
                )}

                <ul className="space-y-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Check className="h-3 w-3 text-success flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  data-ocid={`subscription.${tier}.submit_button`}
                  variant={isActive ? "secondary" : "default"}
                  size="sm"
                  className="w-full"
                  onClick={() => !isActive && openPaymentModal(tier)}
                  disabled={isActive}
                >
                  {isActive ? "Current Plan" : `Switch to ${plan.label}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          data-ocid="payment.modal"
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Subscribe to {selectedPlanData?.label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Plan summary */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-primary">
                  {selectedPlan && PLAN_ICONS[selectedPlan]}
                </span>
                <div>
                  <div className="font-semibold text-foreground">
                    {selectedPlanData?.label} Plan
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedPlanData?.maxFaculty} Faculty &bull;{" "}
                    {selectedPlanData?.maxPdfs?.toLocaleString()} PDFs &bull;{" "}
                    {selectedPlanData?.maxDevices} Devices
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  ₹{(((facultyCount || 0) + 1) * 2500).toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-muted-foreground">
                  ₹2,500 × {(facultyCount || 0) + 1} users (incl. GST)
                </div>
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Billing Cycle</Label>
              <Select
                value={billingCycle}
                onValueChange={(v) => setBillingCycle(v as BillingCycle)}
              >
                <SelectTrigger
                  data-ocid="payment.billing_cycle.select"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedPlan &&
                    BILLING_CYCLES.map((cycle) => (
                      <SelectItem key={cycle.key} value={cycle.key}>
                        {cycle.label} — ₹
                        {PLAN_PRICES[selectedPlan][cycle.key].toLocaleString(
                          "en-IN",
                        )}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Mode */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Payment Mode</Label>
              <RadioGroup
                value={paymentMode}
                onValueChange={(v) => {
                  setPaymentMode(v as PaymentMode);
                  setUpiId("");
                  setCardNumber("");
                  setExpiry("");
                  setCvv("");
                  setBank("");
                  setTxnRef("");
                }}
                className="space-y-2"
              >
                {PAYMENT_MODES.map((mode) => (
                  <label
                    key={mode.key}
                    htmlFor={`pay-${mode.key}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      paymentMode === mode.key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <RadioGroupItem
                      id={`pay-${mode.key}`}
                      value={mode.key}
                      data-ocid={`payment.${mode.key}.radio`}
                    />
                    <span className="text-muted-foreground">{mode.icon}</span>
                    <span className="text-sm font-medium text-foreground">
                      {mode.label}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Bank Transfer — QR + Account Details */}
            {paymentMode === "banktransfer" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-border shadow-sm">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Scan to Pay via UPI
                  </p>
                  <img
                    src={BANK_QR_URL}
                    alt="Bank Transfer QR Code"
                    width={220}
                    height={220}
                    className="rounded-lg border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Scan with any UPI app — Google Pay, PhonePe, Paytm, BHIM
                  </p>
                </div>

                <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    Receiver Bank Account Details
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Beneficiary</span>
                      <span className="font-semibold text-foreground">
                        {BANK_DETAILS.beneficiary}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Bank Name</span>
                      <span className="font-semibold text-foreground">
                        {BANK_DETAILS.bankName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-muted-foreground">
                        Account Number
                      </span>
                      <span className="font-mono font-semibold text-foreground flex items-center gap-1">
                        {BANK_DETAILS.accountNo}
                        <CopyButton value={BANK_DETAILS.accountNo} />
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">IFSC Code</span>
                      <span className="font-mono font-semibold text-foreground flex items-center gap-1">
                        {BANK_DETAILS.ifsc}
                        <CopyButton value={BANK_DETAILS.ifsc} />
                      </span>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    Transfer exactly{" "}
                    <strong>₹{selectedPrice.toLocaleString("en-IN")}</strong>{" "}
                    and enter your transaction reference (UTR) below to confirm
                    payment.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txn-ref" className="text-sm font-semibold">
                    Transaction Reference / UTR Number{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="txn-ref"
                    data-ocid="payment.txn_ref.input"
                    placeholder="e.g. AXISXXXXXXXX or UTR number"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required — enter your UTR/reference to verify the payment.
                  </p>
                </div>
              </div>
            )}

            {/* UPI */}
            {paymentMode === "upi" && (
              <div className="space-y-2">
                <Label htmlFor="upi-id" className="text-sm font-semibold">
                  Enter Your UPI ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="upi-id"
                  data-ocid="payment.upi_id.input"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your UPI ID to proceed with payment.
                </p>
              </div>
            )}

            {/* Card */}
            {paymentMode === "card" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="card-number"
                    className="text-sm font-semibold"
                  >
                    Card Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="card-number"
                    data-ocid="payment.card_number.input"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      const raw = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 16);
                      setCardNumber(raw.replace(/(\d{4})(?=\d)/g, "$1 "));
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-sm font-semibold">
                      Expiry (MM/YY) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="expiry"
                      data-ocid="payment.expiry.input"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={expiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (val.length >= 3)
                          val = `${val.slice(0, 2)}/${val.slice(2)}`;
                        setExpiry(val);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-sm font-semibold">
                      CVV <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="cvv"
                      data-ocid="payment.cvv.input"
                      placeholder="•••"
                      maxLength={4}
                      type="password"
                      value={cvv}
                      onChange={(e) =>
                        setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                    />
                  </div>
                </div>
                {/* Validation hint */}
                {!isPaymentValid(
                  "card",
                  upiId,
                  cardNumber,
                  expiry,
                  cvv,
                  bank,
                  txnRef,
                ) &&
                  (cardNumber.length > 0 ||
                    expiry.length > 0 ||
                    cvv.length > 0) && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="payment.card.error_state"
                    >
                      Please enter a valid 16-digit card number, MM/YY expiry,
                      and 3-4 digit CVV.
                    </p>
                  )}
              </div>
            )}

            {/* Net Banking */}
            {paymentMode === "netbanking" && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Select Bank <span className="text-destructive">*</span>
                </Label>
                <Select value={bank} onValueChange={setBank}>
                  <SelectTrigger
                    data-ocid="payment.bank.select"
                    className="w-full"
                  >
                    <SelectValue placeholder="Choose your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANKS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* DD / Cheque */}
            {paymentMode === "dd" && (
              <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">
                  Demand Draft / Cheque Instructions
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Draw a DD/Cheque in favour of <strong>EduBoards</strong>
                  </li>
                  <li>
                    Amount: ₹{selectedPrice.toLocaleString("en-IN")} (
                    {BILLING_CYCLES.find((c) => c.key === billingCycle)?.label})
                  </li>
                  <li>
                    Bank: <strong>{BANK_DETAILS.bankName}</strong> — A/C:{" "}
                    <strong>{BANK_DETAILS.accountNo}</strong>
                  </li>
                  <li>Courier to our registered office address.</li>
                  <li>
                    Your plan will be activated within 3 business days of
                    receipt.
                  </li>
                </ul>
              </div>
            )}

            {/* Payment validation message */}
            {!paymentValid && paymentMode !== "dd" && (
              <div
                className="rounded-lg bg-amber-50 border border-amber-200 p-3"
                data-ocid="payment.validation.error_state"
              >
                <p className="text-xs text-amber-800 font-medium">
                  {paymentMode === "upi" &&
                    "Please enter your UPI ID to proceed."}
                  {paymentMode === "card" &&
                    "Please fill in all card details (card number, expiry, CVV) to proceed."}
                  {paymentMode === "netbanking" &&
                    "Please select your bank to proceed."}
                  {paymentMode === "banktransfer" &&
                    "Please enter the Transaction Reference / UTR number after completing the bank transfer."}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                data-ocid="payment.cancel.button"
                variant="outline"
                className="flex-1"
                onClick={() => setModalOpen(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                data-ocid="payment.confirm.submit_button"
                className="flex-1 bg-primary text-primary-foreground"
                onClick={handleConfirmPayment}
                disabled={processing || !paymentValid}
                title={
                  !paymentValid
                    ? "Complete payment details to enable this button"
                    : undefined
                }
              >
                {processing ? "Processing…" : "Confirm & Subscribe"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Modal */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent
          data-ocid="invoice.modal"
          className="max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Payment Invoice
            </DialogTitle>
          </DialogHeader>

          {invoiceData && (
            <div className="space-y-6 py-2">
              {/* Invoice Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/uploads/Screenshot-2026-03-07-231232-1.png"
                    alt="EduBoards"
                    className="h-12 w-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div>
                    <div className="text-xl font-bold text-primary">
                      EduBoards
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Smart Board Portal for Education
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">
                    INVOICE
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {invoiceData.invoiceNo}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {invoiceData.date}
                  </div>
                  <Badge className="mt-2 bg-green-600 text-white text-xs px-3">
                    PAID
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Billed To
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    EduBoards Admin
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Administrator Account
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Payment Details
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      Mode:{" "}
                      <span className="text-foreground font-medium">
                        {invoiceData.paymentMode}
                      </span>
                    </div>
                    {invoiceData.txnRef !== "-" && (
                      <div>
                        Ref:{" "}
                        <span className="text-foreground font-mono">
                          {invoiceData.txnRef}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Plan Details Table */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Subscription Details
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-semibold text-foreground">
                          Description
                        </th>
                        <th className="text-right p-3 font-semibold text-foreground">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="p-3 text-muted-foreground">Plan</td>
                        <td className="p-3 text-right font-medium text-foreground">
                          {invoiceData.planLabel} Plan
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-muted-foreground">
                          Billing Cycle
                        </td>
                        <td className="p-3 text-right font-medium text-foreground">
                          {invoiceData.cycleLabel}
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-muted-foreground">
                          Total Users
                        </td>
                        <td className="p-3 text-right font-medium text-foreground">
                          {invoiceData.faculty + 1} users
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-muted-foreground">
                          Price per User
                        </td>
                        <td className="p-3 text-right font-medium text-foreground">
                          ₹2,500 (incl. GST)
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-muted-foreground">
                          Users × Rate
                        </td>
                        <td className="p-3 text-right font-medium text-primary">
                          {invoiceData.faculty + 1} × ₹2,500 = ₹
                          {((invoiceData.faculty + 1) * 2500).toLocaleString(
                            "en-IN",
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="rounded-lg bg-muted/30 border border-border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">
                    ₹{invoiceData.baseAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="font-medium text-foreground">
                    ₹{invoiceData.gst.toLocaleString("en-IN")}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between text-base font-bold">
                  <span className="text-foreground">Total Amount Paid</span>
                  <span className="text-primary">
                    ₹{invoiceData.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Footer note */}
              <div className="text-xs text-muted-foreground text-center border-t border-border pt-4">
                Thank you for subscribing to EduBoards. This is a
                computer-generated invoice.
                <br />
                For support, contact your EduBoards administrator.
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  data-ocid="invoice.close.button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setInvoiceOpen(false)}
                >
                  Close
                </Button>
                <Button
                  data-ocid="invoice.print.button"
                  className="flex-1 bg-primary text-primary-foreground gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                  Download / Print Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
