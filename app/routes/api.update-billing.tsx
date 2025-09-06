import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import prisma from '../db.server';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    
    const { type, number } = await request.json();
    
    // Update billing info in database
    await prisma.billingInfo.upsert({
      where: { shop: session.shop },
      update: { type, number },
      create: { 
        shop: session.shop,
        type,
        number 
      }
    });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error updating billing info:', error);
    return json({ error: 'Failed to update billing info' }, { status: 500 });
  }
}