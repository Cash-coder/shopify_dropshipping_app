import { useState } from 'react';
import { Card, Text, BlockStack, Button, RadioButton, Box } from '@shopify/polaris';

interface PlanSelectionProps {
  onSelectPlan: (plan: 'standard' | 'premium') => void;
  loading?: boolean;
}

export function PlanSelection({ onSelectPlan, loading = false }: PlanSelectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium'>('standard');

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Selecciona tu Plan de Suscripción
      </Text>

      <BlockStack gap="300">
        <Card>
          <BlockStack gap="300">
            <Box>
              <RadioButton
                label=""
                id="standard"
                checked={selectedPlan === 'standard'}
                onChange={() => setSelectedPlan('standard')}
              />
            </Box>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Plan Estándar</Text>
              <Text as="p" variant="bodyMd">€50/mes</Text>
              <Text as="p" variant="bodyMd">
                • Acceso completo a la plataforma
                • Importación de productos
                • Escriv Ecom Dashboard CRM
              </Text>
            </BlockStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Box>
              <RadioButton
                label=""
                id="premium"
                checked={selectedPlan === 'premium'}
                onChange={() => setSelectedPlan('premium')}
              />
            </Box>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Plan Premium</Text>
              <Text as="p" variant="bodyMd">€150/mes</Text>
              <Text as="p" variant="bodyMd">
                • Todo lo del Plan Estándar
                • Todos los envíos son GRATIS!
                • No pagas IVA en cada producto!
              </Text>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>

      <Button
        primary
        size="large"
        onClick={() => onSelectPlan(selectedPlan)}
        loading={loading}
      >
        Suscribirse al {selectedPlan === 'standard' ? 'Plan Estándar' : 'Plan Premium'}
      </Button>
    </BlockStack>
  );
}