/**
 * Creates Shopify app billing subscriptions:
 * - Uses Shopify Billing API instead of Stripe
 * - Returns confirmation URL for subscription approval
 */
import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { createAppSubscription } from '../services/subscription.server';
import { authenticate } from '../shopify.server';
import prisma from '../db.server';

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Try authentication with retry for session establishment
    let session;
    let admin;
    
    for (let i = 0; i < 3; i++) {
      try {
        const auth = await authenticate.admin(request);
        session = auth.session;
        admin = auth.admin;
        
        if (session && session.shop) {
          console.log('✅ Session established for shop:', session.shop);
          break;
        }
        
        console.log(`⏳ Session not ready, attempt ${i + 1}/3`);
        if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ Auth attempt ${i + 1} failed:`, error);
        if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!session || !session.shop) {
      console.log('❌ Failed to establish session after retries');
      return json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    // Get billing data from form
    const formData = await request.formData();
    const billingData = {
      type: formData.get('type') as string,
      number: formData.get('number') as string
    };
    
    console.log('💾 Storing billing data for shop:', session.shop);
    
    // Store billing data in database
    await prisma.billingInfo.upsert({
      where: { shop: session.shop },
      update: billingData,
      create: { 
        shop: session.shop,
        ...billingData 
      }
    });
    
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