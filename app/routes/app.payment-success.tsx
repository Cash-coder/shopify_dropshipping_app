import { useEffect, useState } from 'react';
import { Page, Card, Text, BlockStack, Button, Spinner } from '@shopify/polaris';
import { useNavigate } from '@remix-run/react';
import { useSubscription } from '../context/SubscriptionContext';

export default function PaymentSuccess() {
  const { refetch, isActive, isLoading } = useSubscription();
  const [hasRefetched, setHasRefetched] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Immediately refetch subscription status after successful payment
    if (!hasRefetched) {
      console.log('🔄 Refetching subscription status after payment...');
      refetch();
      setHasRefetched(true);
    }
  }, [refetch, hasRefetched]);

  // Auto-redirect when subscription becomes active
  useEffect(() => {
    if (isActive && hasRefetched) {
      console.log('✅ Subscription detected as active, redirecting to app...');
      const timer = setTimeout(() => {
        window.location.href = '/app'; // Force full page reload to reset context
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isActive, hasRefetched]);

  // Retry logic with limit
  useEffect(() => {
    if (hasRefetched && !isActive && !isLoading && retryCount < 5) {
      const timer = setTimeout(() => {
        console.log(`🔄 Retrying subscription check... (${retryCount + 1}/5)`);
        refetch();
        setRetryCount(prev => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [refetch, isActive, isLoading, hasRefetched, retryCount]);

  if (isLoading) {
    return (
      <Page>
        <Card>
          <BlockStack gap="400" align="center">
            <Spinner size="large" />
            <Text as="h2" variant="headingMd">
              Verifying your subscription...
            </Text>
            <Text as="p" variant="bodyMd">
              Please wait while we confirm your payment.
            </Text>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd" tone="success">
            Payment Successful!
          </Text>
          <Text as="p" variant="bodyMd">
            Thank you for your subscription. Your payment has been processed successfully.
          </Text>
          {isActive ? (
            <>
              <Text as="p" variant="bodyMd" tone="success">
                ✅ Your subscription is now active! Redirecting you to the app...
              </Text>
              <Spinner size="small" />
            </>
          ) : retryCount >= 5 ? (
            <>
              <Text as="p" variant="bodyMd" tone="critical">
                ⚠️ We're having trouble verifying your subscription. Please try refreshing the page or contact support.
              </Text>
              <Button primary url="/app">
                Continue to App Anyway
              </Button>
            </>
          ) : (
            <Text as="p" variant="bodyMd" tone="warning">
              ⏳ We're still processing your subscription. This may take a few moments. (Attempt {retryCount + 1}/5)
            </Text>
          )}
          {!isActive && retryCount < 5 && (
            <Button url="/app">
              Continue to App
            </Button>
          )}
        </BlockStack>
      </Card>
    </Page>
  );
}