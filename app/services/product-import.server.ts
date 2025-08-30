import { authenticate } from "../shopify.server";


const GET_PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          handle
          productType
          vendor
          tags
          totalInventory
          images(first: 10) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                sku
                inventoryQuantity
              }
            }
          }
        }
      }
    }
  }
`;

const CREATE_PRODUCT_MUTATION = `
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function getSupplierProducts(supplierAccessToken: string) {
  // const SUPPLIER_STORE = "droptest444.myshopify.com";
  try {
    console.log('Fetching products from supplier store:', process.env.SUPPLIER_STORE_NAME);
    console.log('Using access token:', supplierAccessToken ? 'Token provided' : 'No token');

    const response = await fetch(`https://${process.env.SUPPLIER_STORE_NAME}.myshopify.com/admin/api/${process.env.API_VERSION}/graphql.json`, {
      //                          https://{{supplier_store_name}}.myshopify.com/admin/api/{{api_version}}/graphql.json
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': supplierAccessToken,
      },
      body: JSON.stringify({
        query: GET_PRODUCTS_QUERY,
        variables: { first: 50 }
      })
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('GraphQL result:', JSON.stringify(result, null, 2));

    const products = result.data?.products?.edges?.map((edge: any) => edge.node) || [];
    console.log('Found products:', products.length);
    
    // Log first product data to see what we're getting
    if (products.length > 0) {
      console.log('Sample product data:', JSON.stringify(products[0], null, 2));
    }
    
    return products;
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    throw new Error('Failed to fetch supplier products');
  }
}

export async function importProductToStore(request: Request, product: any) {
  try {
    const { session } = await authenticate.admin(request);

    console.log('Importing product:', product.title);
    // console.log('Has images:', product.images?.edges?.length || 0);
    // console.log('Has variants:', product.variants?.edges?.length || 0);
    // console.log('First variant price:', product.variants?.edges?.[0]?.node?.price);
    console.log("-----------------------------");
    // Use REST API for simpler product creation with variants and images
    const firstVariant = product.variants.edges[0]?.node;
    
    const productData = {
      product: {
        title: product.title,
        body_html: product.description,
        handle: product.handle + '-imported',
        product_type: product.productType,
        vendor: product.vendor,
        tags: product.tags.join(','),
        variants: [{
          price: firstVariant?.price || '0.00',
          sku: firstVariant?.sku || '',
          inventory_management: 'shopify',
          inventory_quantity: product.totalInventory
        }],
        images: product.images.edges.map((img: any) => ({
          src: img.node.url,
          alt: img.node.altText
        }))
      }
    };

    const response = await fetch(`https://${session.shop}/admin/api/2025-07/products.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': session.accessToken,
      },
      body: JSON.stringify(productData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`REST API error: ${JSON.stringify(result)}`);
    }

    console.log('Product created with price and images:', result.product?.title);
    return result.product;
  } catch (error) {
    console.error('Error importing product:', error);
    throw error;
  }
}