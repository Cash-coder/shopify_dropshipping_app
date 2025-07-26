import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import Stripe from 'stripe';
import { authenticate } from '../shopify.server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const subscriptions = await stripe.subscriptions.list({
    status: 'active',
    limit: 10,
  });

  return json({
    currentShop: session.shop,
    subscriptions: subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      metadata: sub.metadata,
      customer: sub.customer,
    }))
  });
};

export default function DebugSubscriptions() {
  const { currentShop, subscriptions } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Debug Subscriptions</h2>
      <p><strong>Current Shop:</strong> {currentShop}</p>
      <h3>Active Subscriptions ({subscriptions.length}):</h3>
      {subscriptions.map((sub, index) => (
        <div key={sub.id} style={{ 
          border: '1px solid #ccc', 
          margin: '10px 0', 
          padding: '10px',
          backgroundColor: sub.metadata?.shopDomain === currentShop ? '#e8f5e8' : '#f5f5f5'
        }}>
          <h4>Subscription {index + 1}</h4>
          <p><strong>ID:</strong> {sub.id}</p>
          <p><strong>Status:</strong> {sub.status}</p>
          <p><strong>Customer:</strong> {sub.customer}</p>
          <p><strong>Metadata:</strong></p>
          <pre>{JSON.stringify(sub.metadata, null, 2)}</pre>
          {sub.metadata?.shopDomain === currentShop && (
            <p style={{ color: 'green', fontWeight: 'bold' }}>✅ MATCHES CURRENT SHOP</p>
          )}
        </div>
      ))}
    </div>
  );
}