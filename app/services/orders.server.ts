import { authenticate } from "../shopify.server";

const GET_ORDERS_BY_VENDOR_QUERY = `
  query getOrdersByVendor($first: Int!, $query: String!) {
    orders(first: $first, query: $query) {
      edges {
        node {
          id
          name
          displayFulfillmentStatus
          displayFinancialStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                quantity
                vendor
                originalTotalSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
          createdAt
          updatedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export async function getCompletedOrdersByVendor(request: Request, vendor: string) {
  try {
    const { session } = await authenticate.admin(request);
    
    // Query for orders with specific vendor that are paid and delivered
    const query = `financial_status:paid fulfillment_status:fulfilled`;
    
    const response = await fetch(`https://${session.shop}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': session.accessToken,
        'Shopify-Api-Features': 'include-presentment-prices',
      },
      body: JSON.stringify({
        query: GET_ORDERS_BY_VENDOR_QUERY,
        variables: { 
          first: 250, // Get up to 250 orders
          query: query
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GraphQL HTTP error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      // Try to continue with partial data if available
      if (!result.data) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
    }

    const orders = result.data?.orders?.edges?.map((edge: any) => edge.node) || [];
    
    // Filter orders by vendor and calculate total
    let totalAmount = 0;

    orders.forEach((order: any) => {
      // Check if order has line items from the specified vendor
      const hasVendorItems = order.lineItems?.edges?.some((lineItemEdge: any) => 
        lineItemEdge.node.vendor === vendor
      );
      
      if (hasVendorItems) {
        // Sum only line items from the specified vendor
        order.lineItems?.edges?.forEach((lineItemEdge: any) => {
          if (lineItemEdge.node.vendor === vendor) {
            const amount = parseFloat(lineItemEdge.node.originalTotalSet.shopMoney.amount);
            totalAmount += amount;
          }
        });
      }
    });

    console.log(`Found ${orders.length} orders, total amount for vendor "${vendor}": ${totalAmount}`);
    return totalAmount;

  } catch (error) {
    console.error('Error fetching orders by vendor:', error);
    throw new Error('Failed to fetch orders by vendor');
  }
}