import { useState, useEffect } from 'react';
import { Page, Card, Text, BlockStack, Button, TextField, ChoiceList } from '@shopify/polaris';
import { TitleBar } from "@shopify/app-bridge-react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function SubscriptionPage() {
  const [data, setData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [billingType, setBillingType] = useState(['CIF']);
  const [billingNumber, setBillingNumber] = useState('');
  const [billingName, setBillingName] = useState('');

  useEffect(() => {
    // Delay API call to avoid shop null authentication issues on page load
    const timer = setTimeout(() => {
      const shop = new URL(window.location.href).searchParams.get('shop');
      fetch(`/api/subscription-details?shop=${shop || ''}`)
        .then(res => res.json())
        .then(data => {
          setData(data);
          if (data.billingInfo) {
            setBillingType([data.billingInfo.type]);
            setBillingNumber(data.billingInfo.number);
            setBillingName(data.billingInfo.name || '');
          }
        })
        .catch(() => setData({}));
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/update-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: billingType[0],
          number: billingNumber,
          name: billingName
        })
      });
      
      if (response.ok) {
        setData({
          ...data,
          billingInfo: { type: billingType[0], number: billingNumber, name: billingName }
        });
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating billing info:', error);
    }
  };

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
              
              {editing ? (
                <BlockStack gap="300">
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
                    label={billingType[0] === 'CIF' ? 'Nombre de la empresa/persona jurídica' : 'Nombre de la persona física'}
                    value={billingName}
                    onChange={setBillingName}
                    placeholder={billingType[0] === 'CIF' ? 'Nombre de la empresa' : 'Nombre y apellidos'}
                    autoComplete="off"
                  />
                  
                  <TextField
                    label="Número de documento"
                    value={billingNumber}
                    onChange={setBillingNumber}
                    placeholder={billingType[0] === 'CIF' ? 'Ej: B12345678' : 'Ej: 12345678Z'}
                    autoComplete="off"
                  />
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Button primary onClick={handleSave}>
                      Guardar
                    </Button>
                    <Button onClick={() => setEditing(false)}>
                      Cancelar
                    </Button>
                  </div>
                </BlockStack>
              ) : (
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    Datos de facturación: {data.billingInfo ? `${data.billingInfo.name || 'Sin nombre'} - ${data.billingInfo.type} - ${data.billingInfo.number}` : 'No configurado'}
                  </Text>
                  <Button onClick={() => setEditing(true)}>
                    Editar datos de facturación
                  </Button>
                </BlockStack>
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