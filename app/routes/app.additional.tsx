import { useState } from 'react';
import { Page, Card, Button, Text, BlockStack, Banner, RadioButton, TextField, FormLayout } from '@shopify/polaris';
import { useFetcher } from '@remix-run/react';
import { TitleBar } from "@shopify/app-bridge-react";

export default function ImportProducts() {
  const fetcher = useFetcher();
  const [importResult, setImportResult] = useState<any>(null);
  const [markupType, setMarkupType] = useState('none');
  const [markupValue, setMarkupValue] = useState('');

  const handleImport = () => {
    setImportResult(null);
    const formData = new FormData();
    formData.append('markupType', markupType);
    formData.append('markupValue', markupValue);
    fetcher.submit(formData, { method: 'post', action: '/api/import-products' });
  };

  // Update result when fetch completes
  if (fetcher.data && !importResult) {
    setImportResult(fetcher.data);
  }

  const isLoading = fetcher.state === 'submitting';

  return (
    <Page>
      <TitleBar title="Importar Productos" />
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Importar productos desde Escriv-Ecom a tu tienda
            </Text>
            <Text as="p" variant="bodyMd">
              El precio original del proveedor se guardará como "costo por artículo" o "Cost per item" y a continuación podrás aplicar un margen de ganancia a cada producto.
            </Text>
            
            <FormLayout>
              <Text as="h3" variant="headingSm">
                Configuración de Precios
              </Text>
              
              <BlockStack gap="200">
                <RadioButton
                  label="No cambiar precios - configurar manualmente más tarde"
                  checked={markupType === 'none'}
                  id="none"
                  name="markupType"
                  onChange={() => setMarkupType('none')}
                />
                
                <RadioButton
                  label="Agregar margen fijo (€)"
                  checked={markupType === 'fixed'}
                  id="fixed"
                  name="markupType"
                  onChange={() => setMarkupType('fixed')}
                />
                
                <RadioButton
                  label="Agregar margen porcentual (%)"
                  checked={markupType === 'percentage'}
                  id="percentage"
                  name="markupType"
                  onChange={() => setMarkupType('percentage')}
                />
              </BlockStack>
              
              {(markupType === 'fixed' || markupType === 'percentage') && (
                <TextField
                  label={markupType === 'fixed' ? 'Cantidad fija en euros' : 'Porcentaje de margen'}
                  type="number"
                  value={markupValue}
                  onChange={(value) => setMarkupValue(value)}
                  placeholder={markupType === 'fixed' ? '10.00' : '25'}
                  suffix={markupType === 'fixed' ? '€' : '%'}
                  autoComplete="off"
                />
              )}
            </FormLayout>
            
            <Button
              primary
              loading={isLoading}
              onClick={handleImport}
              disabled={isLoading || ((markupType === 'fixed' || markupType === 'percentage') && !markupValue)}
            >
              {isLoading ? 'Importando productos...' : 'Importar Productos'}
            </Button>

            {isLoading && (
              <Banner status="info">
                <Text as="p">Importando productos desde el proveedor, esto puede llevar un momento...</Text>
              </Banner>
            )}
          </BlockStack>
        </Card>

        {importResult && (
          <Card>
            <BlockStack gap="300">
              {importResult.error ? (
                <Banner status="critical">
                  <Text as="p">{importResult.error}</Text>
                </Banner>
              ) : (
                <>
                  <Banner status="success">
                    <Text as="p">{importResult.message}</Text>
                  </Banner>
                  
                  {importResult.errors && importResult.errors.length > 0 && (
                    <Banner status="warning">
                      <Text as="p">Algunos productos no se pudieron importar:</Text>
                      <ul>
                        {importResult.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </Banner>
                  )}
                </>
              )}
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
