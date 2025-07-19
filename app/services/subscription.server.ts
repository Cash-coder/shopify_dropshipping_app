import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export interface SubscriptionStatus {
  isActive: boolean;
  error?: string;
}

export async function checkSubscriptionStatus(shopDomain: string): Promise<SubscriptionStatus> {
  try {
    console.log('🔍 Checking subscription status for shop:', shopDomain);
    
    // Look for active subscriptions with this shop domain in metadata
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    console.log('📊 Found', subscriptions.data.length, 'active subscriptions');
    
    // Log all subscription metadata for debugging
    subscriptions.data.forEach((sub, index) => {
      console.log(`Subscription ${index + 1}:`, {
        id: sub.id,
        status: sub.status,
        metadata: sub.metadata
      });
    });

    // Check if any subscription has this shop domain in metadata
    const hasActiveSubscription = subscriptions.data.some(subscription => 
      subscription.metadata?.shopDomain === shopDomain
    );

    console.log('✅ Has active subscription:', hasActiveSubscription);

    return {
      isActive: hasActiveSubscription,
    };
  } catch (error) {
    console.error('❌ Error checking subscription status:', error);
    return {
      isActive: false,
      error: 'Failed to check subscription status',
    };
  }
}

export async function createPaymentSession(shopDomain: string, successUrl: string, cancelUrl: string) {
  try {
    // First, get the prices for your existing product
    const prices = await stripe.prices.list({
      product: 'prod_Si3pIccd3Hif6t',
      active: true,
    });

    if (prices.data.length === 0) {
      throw new Error('No active prices found for the product');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: prices.data[0].id, // Use the first active price
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          shopDomain,
        },
      },
      metadata: {
        shopDomain,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating payment session:', error);
    throw new Error('Failed to create payment session');
  }
}