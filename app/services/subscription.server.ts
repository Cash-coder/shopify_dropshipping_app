/**
 * Shopify Billing API integration:
 * - checkSubscriptionStatus() queries current app subscriptions via GraphQL
 * - createAppSubscription() creates Shopify app billing subscriptions
 */
import { authenticate } from "../shopify.server";

export interface SubscriptionStatus {
  isActive: boolean;
  error?: string;
  subscription?: {
    id: string;
    status: string;
    name: string;
    lineItems: Array<{
      plan: {
        pricingDetails: {
          price: {
            amount: number;
            currencyCode: string;
          };
          interval: string;
        };
      };
    }>;
  };
}

const CHECK_SUBSCRIPTION_QUERY = `
  query appSubscription {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        status
        lineItems {
          plan {
            pricingDetails {
              ... on AppRecurringPricing {
                price {
                  amount
                  currencyCode
                }
                interval
              }
            }
          }
        }
        test
      }
    }
  }
`;

const CREATE_SUBSCRIPTION_MUTATION = `
  mutation appSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean) {
    appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl, test: $test) {
      appSubscription {
        id
        status
      }
      confirmationUrl
      userErrors {
        field
        message
      }
    }
  }
`;

export async function checkSubscriptionStatus(request: Request): Promise<SubscriptionStatus> {
  try {
    const { admin, session } = await authenticate.admin(request);
    
    // Check if session is properly established
    if (!session || !session.shop) {
      console.log('❌ Session not ready, shop is null');
      return { isActive: false, error: 'Session not ready' };
    }
    
    console.log('🔍 Checking Shopify subscription status for shop:', session.shop);
    
    const response = await admin.graphql(CHECK_SUBSCRIPTION_QUERY);
    
    // Check for authentication errors
    if (!response.ok) {
      console.log('❌ GraphQL request failed with status:', response.status);
      return { isActive: false, error: 'Authentication failed' };
    }
    
    const responseData = await response.json();

    const subscriptions = responseData.data?.currentAppInstallation?.activeSubscriptions || [];
    
    console.log('📊 Found', subscriptions.length, 'active subscriptions');
    
    // Filter out test subscriptions in production
    const activeSubscriptions = subscriptions.filter((sub: any) => 
      process.env.NODE_ENV === 'development' || !sub.test
    );

    if (activeSubscriptions.length > 0) {
      const subscription = activeSubscriptions[0];
      console.log('✅ Has active subscription:', subscription.name, subscription.status);
      
      return {
        isActive: subscription.status === 'ACTIVE',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          name: subscription.name,
          lineItems: subscription.lineItems,
        }
      };
    }

    console.log('❌ No active subscriptions found');
    return { isActive: false };
    
  } catch (error) {
    console.error('❌ Error checking subscription status:', error);
    return {
      isActive: false,
    };
  }
}

export async function createAppSubscription(
  request: Request,
  returnUrl: string,
  planName: string = "Premium Plan",
  price: number = 50.00,
  interval: "EVERY_30_DAYS" | "ANNUAL" = "EVERY_30_DAYS"
) {
  try {
    const { admin, session } = await authenticate.admin(request);
    console.log('💳 Creating Shopify app subscription for shop:', session.shop);
    
    const variables = {
      name: planName,
      returnUrl,
      test: process.env.NODE_ENV === 'development',
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: {
                amount: price,
                currencyCode: "EUR"
              },
              interval
            }
          }
        }
      ]
    };

    const response = await admin.graphql(CREATE_SUBSCRIPTION_MUTATION, { variables });
    const responseData = await response.json();

    const { appSubscription, confirmationUrl, userErrors } = responseData.data?.appSubscriptionCreate || {};

    if (userErrors && userErrors.length > 0) {
      console.error('❌ Subscription creation errors:', userErrors);
      throw new Error(`Subscription creation failed: ${userErrors.map((e: any) => e.message).join(', ')}`);
    }

    if (!confirmationUrl) {
      throw new Error('No confirmation URL returned from Shopify');
    }

    console.log('✅ Subscription created successfully:', appSubscription?.id);
    
    return {
      confirmationUrl,
      subscriptionId: appSubscription?.id,
      status: appSubscription?.status
    };
    
  } catch (error) {
    console.error('❌ Error creating app subscription:', error);
    throw new Error('Failed to create app subscription');
  }
}