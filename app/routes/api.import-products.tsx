import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getSupplierProducts, importProductToStore } from '../services/product-import.server';

export async function action({ request }: ActionFunctionArgs) {
  try {
    console.log('Starting product import process');
    
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

    // Import each product
    let imported = 0;
    let errors = [];

    for (const product of supplierProducts) {
      try {
        await importProductToStore(request, product);
        imported++;
      } catch (error) {
        console.error(`Failed to import ${product.title}:`, error);
        errors.push(`${product.title}: ${error}`);
      }
    }

    return json({
      message: `Successfully imported ${imported} products`,
      imported,
      total: supplierProducts.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Product import error:', error);
    return json({ error: 'Failed to import products' }, { status: 500 });
  }
}