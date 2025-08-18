import { useState } from 'react';
import { Page, Card, Button, Text, BlockStack, Banner } from '@shopify/polaris';
import { useFetcher } from '@remix-run/react';

export default function ImportProducts() {
  const fetcher = useFetcher();
  const [importResult, setImportResult] = useState<any>(null);

  const handleImport = () => {
    setImportResult(null);
    fetcher.submit({}, { method: 'post', action: '/api/import-products' });
  };

  // Update result when fetch completes
  if (fetcher.data && !importResult) {
    setImportResult(fetcher.data);
  }

  const isLoading = fetcher.state === 'submitting';

  return (
    <Page title="Importar Productos">
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Importar desde tienda proveedora
            </Text>
            <Text as="p" variant="bodyMd">
              Importa productos desde la tienda proveedora (droptest444) a tu tienda.
            </Text>
            <Button
              primary
              loading={isLoading}
              onClick={handleImport}
            >
              Importar Productos
            </Button>
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