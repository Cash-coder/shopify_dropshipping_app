import { authenticate } from "../shopify.server";


const GET_PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first, query: "status:ACTIVE") {
      edges {
        node {
          id
          title
          description
          descriptionHtml
          handle
          productType
          vendor
          tags
          totalInventory
          status
          options {
            name
            values
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
                selectedOptions {
                  name
                  value
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
  mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
    productCreate(product: $product, media: $media) {
      product {
        id
        title
        handle
        options {
          name
          values
        }
        variants(first: 10) {
          nodes {
            id
            title
            price
            sku
            inventoryItem {
              id
            }
            selectedOptions {
              name
              value
            }
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

const CREATE_VARIANTS_MUTATION = `
  mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkCreate(productId: $productId, variants: $variants) {
      productVariants {
        id
        title
        price
        sku
        selectedOptions {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Update first variant with price and SKU (inventory handled separately)
const UPDATE_FIRST_VARIANT_MUTATION = `
  mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        price
        sku
        inventoryItem {
          id
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CREATE_LOCATION_MUTATION = `
  mutation locationAdd($input: LocationAddInput!) {
    locationAdd(input: $input) {
      location {
        id
        name
        address {
          address1
          city
          country
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ACTIVATE_INVENTORY_MUTATION = `
  mutation inventoryActivate($inventoryItemId: ID!, $locationId: ID!) {
    inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId) {
      inventoryLevel {
        id
        quantities(names: ["available"]) {
          name
          quantity
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ADJUST_INVENTORY_MUTATION = `
  mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
    inventoryAdjustQuantities(input: $input) {
      inventoryAdjustmentGroup {
        reason
        changes {
          name
          delta
          quantityAfterChange
          item {
            id
          }
          location {
            id
            name
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

const UPDATE_INVENTORY_ITEM_COST_MUTATION = `
  mutation inventoryItemUpdate($id: ID!, $input: InventoryItemInput!) {
    inventoryItemUpdate(id: $id, input: $input) {
      inventoryItem {
        id
        unitCost {
          amount
        }
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
        variables: { first: 10 }
      })
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    
    // Log first part of the response to debug
    console.log('GraphQL result keys:', Object.keys(result));
    if (result.data) {
      console.log('Data keys:', Object.keys(result.data));
      console.log('Products edges length:', result.data.products?.edges?.length || 'No edges');
    }
    if (result.errors) {
      console.log('GraphQL errors:', JSON.stringify(result.errors, null, 2));
    }

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


function calculateMarkupPrice(originalPrice: string, markupType: string, markupValue: number): string {
  const price = parseFloat(originalPrice);
  if (isNaN(price)) return originalPrice;
  
  switch (markupType) {
    case 'fixed':
      return (price + markupValue).toFixed(2);
    case 'percentage':
      return (price * (1 + markupValue / 100)).toFixed(2);
    case 'none':
    default:
      return originalPrice;
  }
}

export async function importProductToStore(request: Request, product: any, session?: any, locationId?: string, markupType: string = 'none', markupValue: number = 0, retryCount = 0) {
  const MAX_RETRIES = 2;
  
  try {
    // Use provided session or authenticate only when needed
    const currentSession = session || (await authenticate.admin(request)).session;
    
    console.log("\n----------------------------------------------------------\n");
    console.log('Importing product:', product.title);
    console.log('Product variants:', JSON.stringify(product.variants, null, 2));
    
    // Use GraphQL API for product creation with proper variant support
    
    const productInput = {
      title: product.title,
      descriptionHtml: product.descriptionHtml || product.description,
      handle: product.handle + '-imported',
      productType: product.productType,
      vendor: product.vendor,
      tags: product.tags,
      productOptions: product.options?.map((option: any) => ({
        name: option.name,
        values: option.values.map((value: string) => ({ name: value }))
      })) || []
    };

    // Prepare media data
    const mediaInput = product.images.edges.map((img: any) => ({
      alt: img.node.altText,
      mediaContentType: 'IMAGE',
      originalSource: img.node.url
    }));

    console.log('GraphQL Product Input to import:', JSON.stringify(productInput, null, 2));
    console.log('Media Input:', JSON.stringify(mediaInput, null, 2));

    const response = await fetch(`https://${currentSession.shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': currentSession.accessToken,
      },
      body: JSON.stringify({
        query: CREATE_PRODUCT_MUTATION,
        variables: { 
          product: productInput,
          media: mediaInput
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401 && retryCount < MAX_RETRIES) {
        console.log(`Authentication failed for ${product.title}, retrying with fresh session... (${retryCount + 1}/${MAX_RETRIES})`);
        // Get fresh session and retry
        return importProductToStore(request, product, undefined, locationId, retryCount + 1);
      }
      
      console.error(`Import failed for ${product.title}:`, {
        status: response.status,
        statusText: response.statusText,
        error: result
      });
      throw new Error(`API error (response code: ${response.status}): ${JSON.stringify(result)}`);
    }

    // Handle GraphQL errors
    if (result.errors) {
      console.error(`GraphQL errors for ${product.title}:`, result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    if (result.data?.productCreate?.userErrors?.length > 0) {
      console.error(`Product creation errors for ${product.title}:`, result.data.productCreate.userErrors);
      throw new Error(`Product creation errors: ${JSON.stringify(result.data.productCreate.userErrors)}`);
    }

    const createdProduct = result.data?.productCreate?.product;
    console.log('Product created successfully:', createdProduct?.title);
    
    // Update the first variant with correct price, SKU, and inventory quantity
    if (createdProduct?.variants?.nodes?.[0] && product.variants.edges.length > 0) {
      const firstVariant = product.variants.edges[0].node;
      const createdFirstVariant = createdProduct.variants.nodes[0];
      
      const originalPrice = firstVariant.price || '0.00';
      const finalPrice = calculateMarkupPrice(originalPrice, markupType, markupValue);
      
      console.log(`Updating first variant with original price ${originalPrice}, final price ${finalPrice}, SKU ${firstVariant.sku}, and quantity ${firstVariant.inventoryQuantity}...`);
      
      const updateVariantResponse = await fetch(`https://${currentSession.shop}/admin/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': currentSession.accessToken,
        },
        body: JSON.stringify({
          query: UPDATE_FIRST_VARIANT_MUTATION,
          variables: {
            productId: createdProduct.id,
            variants: [{
              id: createdFirstVariant.id,
              price: finalPrice,
              inventoryItem: {
                sku: firstVariant.sku || '',
                tracked: true,
                measurement: firstVariant.inventoryItem?.measurement?.weight ? {
                  weight: {
                    value: firstVariant.inventoryItem.measurement.weight.value,
                    unit: firstVariant.inventoryItem.measurement.weight.unit || 'KILOGRAMS'
                  }
                } : undefined
              }
            }]
          }
        })
      });

      const updateResult = await updateVariantResponse.json();
      
      if (updateResult.errors) {
        console.error('First variant update errors:', updateResult.errors);
      } else if (updateResult.data?.productVariantsBulkUpdate?.userErrors?.length > 0) {
        console.error('First variant update user errors:', updateResult.data.productVariantsBulkUpdate.userErrors);
      } else {
        console.log('First variant updated successfully');
        
        // Now update the cost per item separately
        if (createdFirstVariant.inventoryItem?.id) {
          console.log(`Updating cost per item for first variant to ${originalPrice}...`);
          
          const updateCostResponse = await fetch(`https://${currentSession.shop}/admin/api/2025-01/graphql.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': currentSession.accessToken,
            },
            body: JSON.stringify({
              query: UPDATE_INVENTORY_ITEM_COST_MUTATION,
              variables: {
                id: createdFirstVariant.inventoryItem.id,
                input: {
                  cost: parseFloat(originalPrice)
                }
              }
            })
          });
          
          const costResult = await updateCostResponse.json();
          
          if (costResult.errors) {
            console.error('Cost update errors:', costResult.errors);
          } else if (costResult.data?.inventoryItemUpdate?.userErrors?.length > 0) {
            console.error('Cost update user errors:', costResult.data.inventoryItemUpdate.userErrors);
          } else {
            console.log('Cost per item updated successfully');
          }
        }
        
        // Now adjust inventory quantity separately
        if (firstVariant.inventoryQuantity && firstVariant.inventoryQuantity > 0) {
          console.log(`Activating and adjusting inventory for first variant to ${firstVariant.inventoryQuantity}...`);
          console.log('Using inventoryItemId:', createdFirstVariant.inventoryItem?.id);
          console.log('Using locationId:', locationId);
          
          // First activate inventory at the location
          const activateInventoryResponse = await fetch(`https://${session.shop}/admin/api/2025-01/graphql.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': session.accessToken,
            },
            body: JSON.stringify({
              query: ACTIVATE_INVENTORY_MUTATION,
              variables: {
                inventoryItemId: createdFirstVariant.inventoryItem?.id,
                locationId: locationId
              }
            })
          });
          
          const activateResult = await activateInventoryResponse.json();
          console.log('Inventory activation response:', JSON.stringify(activateResult, null, 2));
          
          if (activateResult.errors) {
            console.error('Inventory activation errors:', activateResult.errors);
          } else if (activateResult.data?.inventoryActivate?.userErrors?.length > 0) {
            console.error('Inventory activation user errors:', activateResult.data.inventoryActivate.userErrors);
          } else {
            console.log('Inventory activated successfully');
          }
          
          const inventoryInput = {
            reason: 'correction',
            name: 'available',
            changes: [{
              delta: firstVariant.inventoryQuantity,
              inventoryItemId: createdFirstVariant.inventoryItem?.id,
              locationId: locationId
            }]
          };
          
          console.log('Inventory adjustment input:', JSON.stringify(inventoryInput, null, 2));
          console.log('Inventory adjustment mutation:', ADJUST_INVENTORY_MUTATION);
          
          const adjustInventoryResponse = await fetch(`https://${currentSession.shop}/admin/api/2025-01/graphql.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': currentSession.accessToken,
            },
            body: JSON.stringify({
              query: ADJUST_INVENTORY_MUTATION,
              variables: {
                input: inventoryInput
              }
            })
          });

          const adjustResult = await adjustInventoryResponse.json();
          console.log('Inventory adjustment response:', JSON.stringify(adjustResult, null, 2));
          
          if (adjustResult.errors) {
            console.error('Inventory adjustment errors:', adjustResult.errors);
          } else if (adjustResult.data?.inventoryAdjustQuantities?.userErrors?.length > 0) {
            console.error('Inventory adjustment user errors:', adjustResult.data.inventoryAdjustQuantities.userErrors);
          } else {
            console.log('Inventory adjusted successfully');
          }
        }
      }
    }
    
    // Create additional variants if we have more than one (skip first one as it's already created during first step of product creation)
    if (product.variants.edges.length > 1) {
      const additionalVariants = product.variants.edges.slice(1); // Skip first variant
      console.log(`Creating ${additionalVariants.length} additional variants for ${createdProduct?.title}...`);
      
      // Use the locationId passed as parameter
      
      const variantsInput = additionalVariants.map((variantEdge: any) => {
        const variant = variantEdge.node;
        const originalPrice = variant.price || '0.00';
        const finalPrice = calculateMarkupPrice(originalPrice, markupType, markupValue);
        
        return {
          price: finalPrice,
          inventoryItem: {
            sku: variant.sku || '',
            tracked: true,
            measurement: variant.inventoryItem?.measurement?.weight ? {
              weight: {
                value: variant.inventoryItem.measurement.weight.value,
                unit: variant.inventoryItem.measurement.weight.unit || 'KILOGRAMS'
              }
            } : undefined
          },
          inventoryQuantities: [{
            availableQuantity: variant.inventoryQuantity || 0,
            locationId: locationId
          }],
          optionValues: variant.selectedOptions?.map((option: any) => ({
            optionName: option.name,
            name: option.value
          })) || []
        };
      });

      const variantsResponse = await fetch(`https://${currentSession.shop}/admin/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': currentSession.accessToken,
        },
        body: JSON.stringify({
          query: CREATE_VARIANTS_MUTATION,
          variables: { 
            productId: createdProduct.id,
            variants: variantsInput 
          }
        })
      });

      const variantsResult = await variantsResponse.json();
      
      if (variantsResult.errors) {
        console.error('Variants creation errors:', variantsResult.errors);
      } else if (variantsResult.data?.productVariantsBulkCreate?.userErrors?.length > 0) {
        console.error('Variants creation user errors:', variantsResult.data.productVariantsBulkCreate.userErrors);
      } else {
        console.log(`Successfully created ${variantsResult.data?.productVariantsBulkCreate?.productVariants?.length || 0} variants`);
        
        // Update cost for each additional variant
        const createdVariants = variantsResult.data?.productVariantsBulkCreate?.productVariants || [];
        for (let i = 0; i < createdVariants.length && i < additionalVariants.length; i++) {
          const createdVariant = createdVariants[i];
          const originalVariant = additionalVariants[i].node;
          const originalPrice = originalVariant.price || '0.00';
          
          if (createdVariant.inventoryItem?.id) {
            console.log(`Updating cost per item for additional variant ${i + 1} to ${originalPrice}...`);
            
            try {
              const updateCostResponse = await fetch(`https://${currentSession.shop}/admin/api/2025-01/graphql.json`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Shopify-Access-Token': currentSession.accessToken,
                },
                body: JSON.stringify({
                  query: UPDATE_INVENTORY_ITEM_COST_MUTATION,
                  variables: {
                    id: createdVariant.inventoryItem.id,
                    input: {
                      cost: parseFloat(originalPrice)
                    }
                  }
                })
              });
              
              const costResult = await updateCostResponse.json();
              
              if (costResult.errors) {
                console.error(`Cost update errors for variant ${i + 1}:`, costResult.errors);
              } else if (costResult.data?.inventoryItemUpdate?.userErrors?.length > 0) {
                console.error(`Cost update user errors for variant ${i + 1}:`, costResult.data.inventoryItemUpdate.userErrors);
              } else {
                console.log(`Cost per item updated successfully for variant ${i + 1}`);
              }
            } catch (error) {
              console.error(`Failed to update cost for variant ${i + 1}:`, error);
            }
          }
        }
      }
    }
    
    return createdProduct;

  } catch (error) {
    if (retryCount < MAX_RETRIES && (error as any)?.message?.includes('401')) {
      console.log(`Retrying import for ${product.title} due to auth error... (${retryCount + 1}/${MAX_RETRIES})`);
      return importProductToStore(request, product, undefined, retryCount + 1);
    }
    
    console.error(`Final error importing ${product.title}:`, error);
    throw error;
  }
}