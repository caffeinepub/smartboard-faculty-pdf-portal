import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Monitor, Trash2, Loader2 } from 'lucide-react';
import { useGetDevices, useGetDeviceCount, useRemoveDevice, type DeviceRecord } from '../hooks/useQueries';

const DEVICE_LIMIT = 10;

export default function DeviceManagementSection() {
  const { data: devices = [], isLoading: devicesLoading } = useGetDevices();
  const { data: deviceCount = 0 } = useGetDeviceCount();
  const removeDevice = useRemoveDevice();

  const handleRemove = async (fingerprint: string) => {
    try {
      await removeDevice.mutateAsync(fingerprint);
    } catch (err) {
      console.error('Failed to remove device:', err);
    }
  };

  const usagePercent = Math.min((Number(deviceCount) / DEVICE_LIMIT) * 100, 100);

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          <CardTitle>Device Management</CardTitle>
        </div>
        <CardDescription>
          Manage registered devices. Maximum {DEVICE_LIMIT} devices allowed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Device Usage</span>
            <span className="font-medium">
              {Number(deviceCount)}/{DEVICE_LIMIT}
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          {Number(deviceCount) >= DEVICE_LIMIT && (
            <Badge variant="destructive" className="text-xs">
              Device limit reached
            </Badge>
          )}
        </div>

        {devicesLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No devices registered yet.
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Device Fingerprint</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device: DeviceRecord) => (
                  <TableRow key={device.fingerprint}>
                    <TableCell className="font-mono text-xs truncate max-w-xs">
                      {device.fingerprint}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={removeDevice.isPending}
                          >
                            {removeDevice.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Device</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this device? It will need to
                              re-register to access the portal.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(device.fingerprint)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
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
      </CardContent>
    </Card>
  );
}
