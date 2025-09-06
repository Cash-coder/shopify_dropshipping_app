import { ReactNode, useState, useEffect } from 'react';
import { Page, Card, Text, BlockStack, Button, TextField, ChoiceList } from '@shopify/polaris';

interface BillingGuardProps {
  children: ReactNode;
}

export function BillingGuard({ children }: BillingGuardProps) {
  const [billingData, setBillingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billingType, setBillingType] = useState(['CIF']);
  const [billingNumber, setBillingNumber] = useState('');

  useEffect(() => {
    fetch('/api/subscription-details')
      .then(res => res.json())
      .then(data => {
        setBillingData(data.billingInfo);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/update-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: billingType[0],
          number: billingNumber
        })
      });
      
      if (response.ok) {
        setBillingData({ type: billingType[0], number: billingNumber });
      }
    } catch (error) {
      console.error('Error saving billing info:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Text as="p">Cargando...</Text>;
  }

  if (!billingData) {
    return (
      <Page>
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd" tone="warning">
              Datos de Facturación Requeridos
            </Text>
            <Text as="p" variant="bodyMd">
              Para usar la aplicación, necesitamos tus datos de facturación.
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
              onClick={handleSave}
              loading={saving}
              disabled={!billingNumber.trim()}
            >
              Guardar y Continuar
            </Button>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  return <>{children}</>;
}