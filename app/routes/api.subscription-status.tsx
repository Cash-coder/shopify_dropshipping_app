/**
 *- Checks subscription status:
  - Accepts shop domain as customerId
  - Returns {isActive: boolean, error?: string}
 */
import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { checkSubscriptionStatus } from '../services/subscription.server';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const shopDomain = formData.get('customerId') as string;

  if (!shopDomain) {
    return json({ isActive: false, error: 'Shop domain required' }, { status: 400 });
  }

  const result = await checkSubscriptionStatus(shopDomain);
  return json(result);
}