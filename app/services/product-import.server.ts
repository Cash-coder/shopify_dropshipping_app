import { authenticate } from "../shopify.server";

const SUPPLIER_STORE = "droptest444.myshopify.com";

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
          category {
            id
            name
          }
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
                inventoryItem {
                  measurement {
                    weight {
                      value
                      unit
                    }
                  }
                }
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
  try {
    console.log('Fetching products from supplier store:', SUPPLIER_STORE);
    console.log('Using access token:', supplierAccessToken ? 'Token provided' : 'No token');

    const response = await fetch(`https://${SUPPLIER_STORE}/admin/api/2025-07/graphql.json`, {
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
    console.error('❌ Error fetching supplier products:', error);
    throw new Error('Failed to fetch supplier products');
  }
}

export async function importProductToStore(request: Request, product: any) {
  try {
    const { admin } = await authenticate.admin(request);

    console.log('Importing product:', product.title);
    
    const firstVariant = product.variants.edges[0]?.node;
    console.log('Price:', firstVariant?.price, 'SKU:', firstVariant?.sku, 'Inventory:', firstVariant?.inventoryQuantity);
    console.log('Category:', product.category?.name, 'Weight:', firstVariant?.inventoryItem?.measurement?.weight?.value, firstVariant?.inventoryItem?.measurement?.weight?.unit);

    // Use modern productSet mutation for complete product creation
    const CREATE_PRODUCT_WITH_VARIANTS = `
      mutation productSet($input: ProductSetInput!, $synchronous: Boolean!) {
        productSet(input: $input, synchronous: $synchronous) {
          product {
            id
            title
            handle
            variants(first: 10) {
              nodes {
                id
                sku
                price
                inventoryQuantity
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Get unique variant titles for options
    const variantTitles = product.variants.edges.map((edge: any) => edge.node.title || "Default Title");
    const uniqueTitles = [...new Set(variantTitles)];

    const productInput = {
      title: product.title,
      descriptionHtml: product.description,
      handle: product.handle + '-imported',
      productType: product.productType,
      vendor: product.vendor,
      tags: product.tags,
      category: product.category?.id || null,
      productOptions: [{
        name: "Title",
        values: uniqueTitles.map(title => ({ name: title }))
      }],
      variants: product.variants.edges.map((variantEdge: any, index: number) => {
        const variant = variantEdge.node;
        return {
          price: variant.price,
          inventoryItem: {
            sku: variant.sku,
            tracked: false,
            measurement: variant.inventoryItem?.measurement?.weight ? {
              weight: {
                unit: variant.inventoryItem.measurement.weight.unit || "GRAMS",
                value: variant.inventoryItem.measurement.weight.value
              }
            } : null
          },
          optionValues: [{
            name: variant.title || `Default Title ${index + 1}`,
            optionName: "Title"
          }]
        };
      })
    };

    console.log('Creating product with variants:', productInput.variants.length);

    const response = await admin.graphql(CREATE_PRODUCT_WITH_VARIANTS, {
      variables: { 
        input: productInput,
        synchronous: true
      }
    });

    const responseData = await response.json();
    const { product: createdProduct, userErrors } = responseData.data?.productSet || {};

    if (userErrors && userErrors.length > 0) {
      throw new Error(userErrors.map((e: any) => e.message).join(', '));
    }

    // Add images separately since ProductSetInput doesn't support media
    if (product.images.edges.length > 0 && createdProduct?.id) {
      const CREATE_MEDIA = `
        mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
          productCreateMedia(productId: $productId, media: $media) {
            media {
              id
            }
            mediaUserErrors {
              field
              message
            }
          }
        }
      `;

      const media = product.images.edges.map((img: any) => ({
        originalSource: img.node.url,
        alt: img.node.altText,
        mediaContentType: "IMAGE"
      }));

      await admin.graphql(CREATE_MEDIA, {
        variables: { productId: createdProduct.id, media }
      });

      console.log('Images added to product');
    }

    console.log('✅ Product created with all data:', createdProduct?.title);
    console.log('Variants created:', createdProduct?.variants?.nodes?.length || 0);
    
    return createdProduct;
  } catch (error) {
    console.error('Error importing product:', error);
    throw error;
  }
}