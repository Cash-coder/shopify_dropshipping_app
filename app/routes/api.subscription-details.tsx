import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';

const SUBSCRIPTION_DETAILS_QUERY = `
  query appSubscription {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        status
        createdAt
        currentPeriodEnd
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

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const billingInfo = session.billingInfo;
    
    const response = await admin.graphql(SUBSCRIPTION_DETAILS_QUERY);
    const responseData = await response.json();

    const subscriptions = responseData.data?.currentAppInstallation?.activeSubscriptions || [];
    
    // Filter out test subscriptions in production
    const activeSubscriptions = subscriptions.filter((sub: any) => 
      process.env.NODE_ENV === 'development' || !sub.test
    );

    if (activeSubscriptions.length > 0) {
      const subscription = activeSubscriptions[0];
      
      return json({
        isActive: subscription.status === 'ACTIVE',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          name: subscription.name,
          createdAt: subscription.createdAt,
          currentPeriodEnd: subscription.currentPeriodEnd,
          price: subscription.lineItems[0]?.plan?.pricingDetails?.price?.amount || 0,
          currency: subscription.lineItems[0]?.plan?.pricingDetails?.price?.currencyCode || 'EUR',
          interval: subscription.lineItems[0]?.plan?.pricingDetails?.interval || 'EVERY_30_DAYS',
        },
        billingInfo
      });
    }

    return json({ isActive: false, subscription: null });
    
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return json({ 
      isActive: false, 
      subscription: null, 
      error: 'Failed to fetch subscription details' 
    }, { status: 500 });
  }
}