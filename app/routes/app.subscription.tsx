import { useState, useEffect } from 'react';
import { Page, Card, Text, BlockStack } from '@shopify/polaris';
import { TitleBar } from "@shopify/app-bridge-react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function SubscriptionPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/subscription-details')
      .then(res => res.json())
      .then(setData);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Page>
      <TitleBar title="Estado de Suscripción" />
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Tu Suscripción</Text>
          
          {data ? (
            <BlockStack gap="200">
              <Text as="p" variant="bodyLg">
                Estado de Suscripción: {data.isActive ? 'Activa' : 'Inactiva'}
                {data.subscription?.currentPeriodEnd && data.isActive && 
                  `, renovación el ${formatDate(data.subscription.currentPeriodEnd)}`
                }
              </Text>
              
              {data.billingInfo && (
                <Text as="p" variant="bodyMd">
                  Datos de facturación: {data.billingInfo.type} - {data.billingInfo.number}
                </Text>
              )}
            </BlockStack>
          ) : (
            <Text as="p">Cargando...</Text>
          )}
        </BlockStack>
      </Card>
    </Page>
  );
}