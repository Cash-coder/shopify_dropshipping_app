import { ReactNode, useEffect } from 'react';
import { Page, Card, Text, Spinner, BlockStack, Button } from '@shopify/polaris';
import { useFetcher } from '@remix-run/react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useSubscription } from '../context/SubscriptionContext';

interface SubscriptionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionGuard({ children, fallback }: SubscriptionGuardProps) {
  const { isActive, isLoading, error } = useSubscription();
  const paymentFetcher = useFetcher<{ url?: string; error?: string }>();
  const app = useAppBridge();

  useEffect(() => {
    if (paymentFetcher.data?.url) {
      // Use modern approach to handle external redirects in embedded apps
      try {
        // For Shopify embedded apps, use shopify:// protocol for better redirect handling
        if (app && typeof app.dispatch === 'function') {
          app.dispatch({
            type: 'Redirect',
            payload: { 
              url: paymentFetcher.data.url,
              newContext: true 
            }
          });
        } else {
          // Direct window redirect as fallback
          window.top!.location.href = paymentFetcher.data.url;
        }
      } catch (error) {
        console.warn('App Bridge redirect failed, using direct redirect:', error);
        window.top!.location.href = paymentFetcher.data.url;
      }
    }
  }, [paymentFetcher.data?.url, app]);

  if (isLoading) {
    return (
      <Page>
        <Card>
          <BlockStack align="center" inlineAlign="center" gap="400">
            <Spinner size="large" />
            <Text as="p" variant="bodyMd">
              Checking subscription status...
            </Text>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd" tone="critical">
              Error
            </Text>
            <Text as="p" variant="bodyMd">
              {error}
            </Text>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  if (!isActive) {
    const handlePayment = () => {
      paymentFetcher.submit({}, { method: 'post', action: '/api/create-payment' });
    };

    return fallback || (
      <Page>
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd" tone="warning">
              Payment Required
            </Text>
            <Text as="p" variant="bodyMd">
              Your subscription is not active. Please complete your payment to access the app.
            </Text>
            <Button 
              primary 
              onClick={handlePayment}
              loading={paymentFetcher.state === 'submitting'}
            >
              Subscribe Now
            </Button>
            <Button 
              variant="plain"
              url="/debug/subscriptions"
              target="_blank"
            >
              Debug Subscriptions
            </Button>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  return <>{children}</>;
}