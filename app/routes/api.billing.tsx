import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getCompletedOrdersByVendor } from "../services/orders.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const VENDOR_NAME = 'ALMACÉN ESCRIV ECOM'; // Hardcoded vendor name in uppercase
    const totalBilling = await getCompletedOrdersByVendor(request, VENDOR_NAME);
    
    return json({ 
      success: true,
      totalBilling,
      vendorName: VENDOR_NAME
    });
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return json({ 
      success: false,
      totalBilling: 0,
      error: 'Failed to fetch billing data'
    }, { status: 500 });
  }
};