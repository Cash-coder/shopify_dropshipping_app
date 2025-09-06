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
  const [billingName, setBillingName] = useState('');

  useEffect(() => {
    // Delay API call to avoid shop null authentication issues on page load
    const timer = setTimeout(() => {
      const shop = new URL(window.location.href).searchParams.get('shop');
      fetch(`/api/subscription-details?shop=${shop || ''}`)
        .then(res => res.json())
        .then(data => {
          setBillingData(data.billingInfo);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    setSaving(true);
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
        setBillingData({ type: billingType[0], number: billingNumber, name: billingName });
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
            
            <Button 
              primary 
              onClick={handleSave}
              loading={saving}
              disabled={!billingNumber.trim() || !billingName.trim()}
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