import { useState, useEffect, useRef } from 'react';
import { useActor } from './useActor';
import { getDeviceFingerprint } from '@/utils/deviceFingerprint';

export type DeviceRegistrationStatus =
  | 'idle'
  | 'checking'
  | 'allowed'
  | 'limit-exceeded'
  | 'error';

const LICENSE_ID_KEY = 'eduboard_license_id';

// Maximum time (ms) to wait for device registration before allowing access
const REGISTRATION_TIMEOUT_MS = 12000;

/**
 * Derives a stable license ID from the canister/app identity.
 * Uses the hostname as a stable identifier for the license.
 */
function getLicenseId(): string {
  const stored = localStorage.getItem(LICENSE_ID_KEY);
  if (stored) return stored;
  // Use hostname as the license identifier — stable per deployment
  const licenseId = window.location.hostname || 'eduboard-default-license';
  localStorage.setItem(LICENSE_ID_KEY, licenseId);
  return licenseId;
}

export function useDeviceRegistration() {
  const { actor, isFetching: actorFetching } = useActor();
  const [status, setStatus] = useState<DeviceRegistrationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasRegistered = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Safety timeout: if registration takes too long, allow access anyway
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setStatus((prev) => {
        if (prev === 'idle' || prev === 'checking') {
          console.warn('[DeviceRegistration] Timeout reached — allowing access as fallback');
          return 'allowed';
        }
        return prev;
      });
    }, REGISTRATION_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (actorFetching || !actor || hasRegistered.current) return;

    hasRegistered.current = true;

    // The backend does not expose a registerDevice method in the current interface.
    // Allow access immediately and clear the safety timeout.
    setStatus('allowed');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Store license ID for reference
    getLicenseId();
    getDeviceFingerprint();
  }, [actor, actorFetching]);

  return {
    status,
    errorMessage,
    isChecking: status === 'idle' || status === 'checking',
    isAllowed: status === 'allowed',
    isLimitExceeded: status === 'limit-exceeded',
  };
}
