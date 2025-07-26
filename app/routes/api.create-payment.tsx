/**
 *- Creates Stripe payment sessions:
  - Builds Shopify admin URLs for success/cancel redirects
  - Returns checkout URL for external redirect
 */
import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { createPaymentSession } from '../services/subscription.server';
import { authenticate } from '../shopify.server';

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  try {
    const url = new URL(request.url);
    // Redirect back to Shopify admin context - go directly to main app after payment
    const successUrl = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.SHOPIFY_API_KEY}/app`;
    const cancelUrl = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.SHOPIFY_API_KEY}/app`;
    
    const { url: checkoutUrl } = await createPaymentSession(
      session.shop,
      successUrl,
      cancelUrl
    );
    
    if (!checkoutUrl) {
      throw new Error('Failed to create checkout session');
    }
    
    return json({ url: checkoutUrl });
  } catch (error) {
    console.error('Payment creation error:', error);
    return json({ error: 'Failed to create payment session' }, { status: 500 });
  }
}