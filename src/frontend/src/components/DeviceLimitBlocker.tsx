import React from 'react';
import { ShieldX, MonitorX, Phone } from 'lucide-react';

export default function DeviceLimitBlocker() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-destructive/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full mx-4 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <MonitorX className="w-12 h-12 text-destructive" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
              <ShieldX className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl font-bold text-foreground mb-3">
          Device Limit Reached
        </h1>

        {/* Divider */}
        <div className="w-16 h-1 bg-destructive rounded-full mx-auto mb-6" />

        {/* Message */}
        <div className="bg-destructive/8 border border-destructive/20 rounded-xl p-6 mb-6">
          <p className="text-foreground text-base leading-relaxed font-medium">
            This license is already in use on{' '}
            <span className="text-destructive font-bold">10 devices</span>.
          </p>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            The maximum number of devices allowed per license has been reached.
            No additional devices can be registered until an existing device is removed.
          </p>
        </div>

        {/* Contact info */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Phone className="w-4 h-4 text-accent" />
          <span>Please contact your administrator to free up a device slot.</span>
        </div>

        {/* License info */}
        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">EduBoard Smart Faculty Portal</span>
            {' — '}License limit: 10 devices per license
          </p>
        </div>
      </div>
    </div>
  );
}
