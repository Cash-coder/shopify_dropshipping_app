import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useFetcher } from '@remix-run/react';

interface SubscriptionContextType {
  isActive: boolean;
  isLoading: boolean;
  error?: string;
  refetch: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const fetcher = useFetcher<{ isActive: boolean; error?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  const refetch = (force = false) => {
    const now = Date.now();
    // Prevent too frequent checks (minimum 2 seconds between checks) unless forced
    if (!force && now - lastCheckTime < 2000) {
      console.log('⏸️ Skipping subscription check - too soon since last check');
      return;
    }
    
    console.log('🔄 Starting subscription check using session');
    setIsLoading(true);
    setLastCheckTime(now);
    fetcher.submit(
      {},
      { method: 'post', action: '/api/subscription-status' }
    );
  };

  useEffect(() => {
    refetch();
  }, []);

  useEffect(() => {
    if (fetcher.state === 'idle') {
      console.log('📊 Subscription check result:', fetcher.data);
      setIsLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && fetcher.state !== 'loading' && fetcher.state !== 'submitting') {
        console.log('⏰ Subscription check timeout - forcing loading to false');
        setIsLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isLoading, fetcher.state]);

  const value: SubscriptionContextType = {
    isActive: fetcher.data?.isActive ?? false,
    isLoading: fetcher.state === 'loading' || fetcher.state === 'submitting' || isLoading,
    error: fetcher.data?.error,
    refetch,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}