import React, { useState } from 'react';
import { Monitor, Trash2, RefreshCw, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetDevices, useGetDeviceCount, useRemoveDevice } from '@/hooks/useQueries';

const DEVICE_LIMIT = 10;

interface DeviceRecord {
  fingerprint: string;
  timestamp: bigint;
}

function getLicenseId(): string {
  return localStorage.getItem('eduboard_license_id') || window.location.hostname || 'eduboard-default-license';
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000; // nanoseconds to milliseconds
  const date = new Date(ms);
  if (isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DeviceManagementSection() {
  const licenseId = getLicenseId();
  const { data: devicesRaw = [], isLoading: devicesLoading, refetch } = useGetDevices();
  const { data: deviceCountRaw = 0 } = useGetDeviceCount();
  const removeDevice = useRemoveDevice();
  const [removingFingerprint, setRemovingFingerprint] = useState<string | null>(null);

  // Cast to typed device records
  const devices = devicesRaw as DeviceRecord[];
  const count = typeof deviceCountRaw === 'bigint' ? Number(deviceCountRaw) : Number(deviceCountRaw);
  const usagePercent = Math.min((count / DEVICE_LIMIT) * 100, 100);
  const isNearLimit = count >= 8;
  const isAtLimit = count >= DEVICE_LIMIT;

  const handleRemove = async (fingerprint: string) => {
    setRemovingFingerprint(fingerprint);
    try {
      await removeDevice.mutateAsync(fingerprint);
    } finally {
      setRemovingFingerprint(null);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Monitor className="h-5 w-5 text-accent" />
              Device Management
            </CardTitle>
            <CardDescription>
              Manage registered devices for this license. Maximum 10 devices allowed.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={isAtLimit ? 'destructive' : isNearLimit ? 'secondary' : 'outline'}
              className="text-sm px-3 py-1.5 font-semibold"
            >
              <Monitor className="h-3.5 w-3.5 mr-1.5" />
              {count} / {DEVICE_LIMIT} devices used
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">License usage</span>
            <span className={`font-semibold ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-foreground'}`}>
              {count} of {DEVICE_LIMIT} slots used
            </span>
          </div>
          <Progress
            value={usagePercent}
            className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-warning' : '[&>div]:bg-accent'}`}
          />
          {isAtLimit && (
            <div className="flex items-center gap-2 text-destructive text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Device limit reached. Remove a device to allow new registrations.
            </div>
          )}
          {isNearLimit && !isAtLimit && (
            <div className="flex items-center gap-2 text-warning text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Approaching device limit ({DEVICE_LIMIT - count} slot{DEVICE_LIMIT - count !== 1 ? 's' : ''} remaining).
            </div>
          )}
        </div>

        {/* Device Table */}
        {devicesLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading devices...
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
            <ShieldCheck className="h-10 w-10 text-accent/50" />
            <p className="text-sm">No devices registered yet.</p>
            <p className="text-xs">Devices will appear here when users log in from new devices.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Device Fingerprint</TableHead>
                  <TableHead className="font-semibold">Registered On</TableHead>
                  <TableHead className="font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device, index) => (
                  <TableRow key={device.fingerprint} className="hover:bg-muted/20">
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-accent flex-shrink-0" />
                        <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground">
                          {device.fingerprint.slice(0, 16)}…
                        </code>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(device.timestamp)}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            disabled={removingFingerprint === device.fingerprint}
                          >
                            {removingFingerprint === device.fingerprint ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Device</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this device from the license?
                              <br />
                              <code className="text-xs font-mono bg-muted px-2 py-1 rounded mt-2 inline-block">
                                {device.fingerprint.slice(0, 24)}…
                              </code>
                              <br />
                              <br />
                              The device will be blocked from accessing the portal until it re-registers
                              (consuming a new device slot).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(device.fingerprint)}
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              Remove Device
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* License ID info */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <span className="font-semibold">License ID:</span>{' '}
          <code className="font-mono">{licenseId}</code>
        </div>
      </CardContent>
    </Card>
  );
}
