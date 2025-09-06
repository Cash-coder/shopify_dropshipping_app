/**
 * Creates Shopify app billing subscriptions:
 * - Uses Shopify Billing API instead of Stripe
 * - Returns confirmation URL for subscription approval
 */
import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { createAppSubscription } from '../services/subscription.server';
import { authenticate } from '../shopify.server';

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Get session for building return URL
    const { session } = await authenticate.admin(request);
    
    // Get billing data from form
    const formData = await request.formData();
    const billingData = {
      type: formData.get('type') as string,
      number: formData.get('number') as string
    };
    
    // Store billing data in session
    session.billingInfo = billingData;
    
    // Return URL after subscription confirmation
    const returnUrl = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.SHOPIFY_API_KEY}/app`;
    
    const { confirmationUrl } = await createAppSubscription(
      request,
      returnUrl,
      "Premium Plan", // Plan name
      50.00, // Price
      "EVERY_30_DAYS" // Billing interval
    );
    
    if (!confirmationUrl) {
      throw new Error('Failed to create subscription');
    }
    
    return json({ url: confirmationUrl });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}