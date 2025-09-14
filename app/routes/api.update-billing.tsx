import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { PrismaClient } from '@prisma/client';

console.log('Initializing Prisma client...');
const prisma = new PrismaClient();
console.log('✅ Prisma client initialized:', !!prisma);
console.log('✅ BillingInfo model:', !!prisma.billingInfo);

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    
    if (!session || !session.shop) {
      console.log('❌ Session not ready for billing update');
      return json({ error: 'Session not ready' }, { status: 400 });
    }
    
    const { type, number, name, email, phone, address } = await request.json();
    
    console.log('Updating billing info for shop:', session.shop);
    console.log('Prisma object:', !!prisma);
    console.log('Prisma billingInfo:', !!prisma?.billingInfo);
    console.log('Prisma type:', typeof prisma);
    
    // Update billing info in database
    await prisma.billingInfo.upsert({
      where: { shop: session.shop },
      update: { type, number, name, email, phone, address },
      create: {
        shop: session.shop,
        type,
        number,
        name,
        email,
        phone,
        address
      }
    });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error updating billing info:', error);
    return json({ error: 'Failed to update billing info' }, { status: 500 });
  }
}