import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import { checkSubscriptionStatus } from '../services/subscription.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const subscriptionStatus = await checkSubscriptionStatus(request);

  return json({
    currentShop: session.shop,
    subscriptionStatus
  });
};

export default function DebugSubscriptions() {
  const { currentShop, subscriptionStatus } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Debug Shopify App Subscriptions</h2>
      <p><strong>Current Shop:</strong> {currentShop}</p>
      
      <div style={{ 
        border: '1px solid #ccc', 
        margin: '10px 0', 
        padding: '10px',
        backgroundColor: subscriptionStatus.isActive ? '#e8f5e8' : '#f5e8e8'
      }}>
        <h3>Subscription Status</h3>
        <p><strong>Is Active:</strong> {subscriptionStatus.isActive ? '✅ YES' : '❌ NO'}</p>
        
        {subscriptionStatus.error && (
          <p><strong>Error:</strong> <span style={{ color: 'red' }}>{subscriptionStatus.error}</span></p>
        )}
        
        {subscriptionStatus.subscription && (
          <div>
            <h4>Subscription Details</h4>
            <p><strong>ID:</strong> {subscriptionStatus.subscription.id}</p>
            <p><strong>Name:</strong> {subscriptionStatus.subscription.name}</p>
            <p><strong>Status:</strong> {subscriptionStatus.subscription.status}</p>
            <p><strong>Line Items:</strong></p>
            <pre>{JSON.stringify(subscriptionStatus.subscription.lineItems, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}