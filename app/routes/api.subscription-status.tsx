/**
 * Checks Shopify app subscription status:
 * - Uses authenticated session instead of shop domain
 * - Returns subscription details from Shopify Billing API
 */
import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { checkSubscriptionStatus } from '../services/subscription.server';
import { authenticate } from '../shopify.server';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const result = await checkSubscriptionStatus(request);
    return json(result);
  } catch (error) {
    console.error('Subscription status check error:', error);
    return json({ isActive: false, error: 'Failed to check subscription status' }, { status: 500 });
  }
}