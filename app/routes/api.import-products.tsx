import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getSupplierProducts, importProductToStore } from '../services/product-import.server';
import { authenticate } from '../shopify.server';

export async function action({ request }: ActionFunctionArgs) {
  
  const WAREHOUSE_NAME = 'Almacén Escriv Ecom';
  
  try {
    console.log('Starting product import process');
    
    // Get markup options from form data
    const formData = await request.formData();
    const markupType = formData.get('markupType') as string || 'none';
    const markupValue = parseFloat(formData.get('markupValue') as string || '0');
    
    console.log('Markup settings:', { markupType, markupValue });
    
    // For now, we'll need a supplier access token
    // In production, this would be stored securely
    const SUPPLIER_ACCESS_TOKEN = process.env.SUPPLIER_ACCESS_TOKEN;
    
    console.log('Checking access token:', SUPPLIER_ACCESS_TOKEN ? 'Found' : 'Missing');
    
    if (!SUPPLIER_ACCESS_TOKEN) {
      console.log('No supplier access token configured');
      return json({ error: 'Supplier access token not configured' }, { status: 500 });
    }

    // Get products from supplier store
    console.log('Fetching products from supplier...');
    const supplierProducts = await getSupplierProducts(SUPPLIER_ACCESS_TOKEN);
    
    if (supplierProducts.length === 0) {
      return json({ message: 'No products found in supplier store', imported: 0 });
    }

    // Get session once for all imports
    const { session } = await authenticate.admin(request);
    
    // Check if our custom location exists, if not create it
    const checkLocationResponse = await fetch(`https://${session.shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': session.accessToken,
      },
      body: JSON.stringify({
        query: `query { locations(first: 10) { edges { node { id name } } } }`
      })
    });
    const locationResult = await checkLocationResponse.json();
    const locations = locationResult.data?.locations?.edges || [];
    
    let locationId = locations.find(loc => loc.node.name === 'Almacen Escriv Ecom')?.node?.id;
    
    if (!locationId) {
      console.log('Creating custom location: Almacen Escriv Ecom');
      const createLocationResponse = await fetch(`https://${session.shop}/admin/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': session.accessToken,
        },
        body: JSON.stringify({
          query: `mutation locationAdd($input: LocationAddInput!) {
            locationAdd(input: $input) {
              location {
                id
                name
                address {
                  address1
                  city
                  countryCode
                }
              }
              userErrors {
                field
                message
              }
            }
          }`,
          variables: {
            input: {
              name: WAREHOUSE_NAME,
              address: {
                address1: 'Warehouse Address',
                city: 'Valencia',
                countryCode: 'ES'
              }
            }
          }
        })
      });
      
      const createResult = await createLocationResponse.json();
      if (createResult.errors || createResult.data?.locationAdd?.userErrors?.length > 0) {
        console.error('Failed to create location:', createResult.errors || createResult.data.locationAdd.userErrors);
        // Fall back to first available location
        locationId = locations[0]?.node?.id;
      } else {
        locationId = createResult.data.locationAdd.location.id;
        console.log('Created location with ID:', locationId);
      }
    } else {
      console.log('Using existing custom location:', locationId);
    }
    
    console.log('Using location ID for inventory:', locationId);
    
    // Import each product
    let imported = 0;
    let errors = [];

    for (const product of supplierProducts) {
      try {
        await importProductToStore(request, product, session, locationId, markupType, markupValue);
        imported++;
      } catch (error) {
        console.error(`Failed to import ${product.title}:`, error);

        // Check if it's a duplicate product error (already includes the title)
        if (error.message?.includes('Este producto ya existe en tu tienda:')) {
          errors.push(`Error: ${error.message}`);
        } else {
          errors.push(`${product.title}: ${error}`);
        }
      }
    }

    return json({
      message: `Importados exitosamente ${imported} productos`,
      imported,
      total: supplierProducts.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Product import error:', error);
    return json({ error: 'Failed to import products' }, { status: 500 });
  }
}