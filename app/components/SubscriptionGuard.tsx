import { ReactNode, useEffect, useState } from 'react';
import { Page, Card, Text, Spinner, BlockStack, Button, TextField, ChoiceList } from '@shopify/polaris';
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
  const [billingType, setBillingType] = useState(['CIF']);
  const [billingNumber, setBillingNumber] = useState('');

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
      const billingData = {
        type: billingType[0],
        number: billingNumber
      };
      paymentFetcher.submit(billingData, { method: 'post', action: '/api/create-payment' });
    };

    return fallback || (
      <Page>
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd" tone="warning">
              Se requiere Suscripción
            </Text>
            <Text as="p" variant="bodyMd">
              Completa tus datos de facturación para suscribirte.
            </Text>
            
            <ChoiceList
              title="Tipo de documento"
              choices={[
                { label: 'CIF', value: 'CIF' },
                { label: 'DNI/NIE', value: 'DNI/NIE' },
              ]}
              selected={billingType}
              onChange={setBillingType}
            />
            
            <TextField
              label="Número de documento"
              value={billingNumber}
              onChange={setBillingNumber}
              placeholder={billingType[0] === 'CIF' ? 'Ej: B12345678' : 'Ej: 12345678Z'}
              autoComplete="off"
            />
            
            <Button 
              primary 
              onClick={handlePayment}
              loading={paymentFetcher.state === 'submitting'}
              disabled={!billingNumber.trim()}
            >
              Suscribirse Ahora
            </Button>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  return <>{children}</>;
}