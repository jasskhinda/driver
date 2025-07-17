import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import InvoiceDetail from '@/app/components/InvoiceDetail';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params }) {
  try {
    const { invoiceId } = params;
    
    const supabase = createServerComponentClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      redirect('/login');
    }
    
    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (profile?.role !== 'driver') {
      redirect('/dashboard');
    }
    
    // Fetch invoice data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        trip:trips(
          id,
          pickup_address,
          destination_address,
          pickup_time,
          actual_pickup_time,
          actual_dropoff_time,
          distance,
          special_requirements,
          driver_id
        )
      `)
      .eq('id', invoiceId)
      .single();
    
    if (error || !invoice) {
      console.error('Error fetching invoice:', error);
      redirect('/dashboard/invoices?error=invoice_not_found');
    }
    
    // Verify driver has access to this invoice
    const hasAccess = invoice.user_id === session.user.id || 
                     (invoice.trip && invoice.trip.driver_id === session.user.id);
    
    if (!hasAccess) {
      redirect('/dashboard/invoices?error=access_denied');
    }
    
    return <InvoiceDetail invoice={invoice} user={session.user} />;
  } catch (error) {
    console.error('Error in invoice page:', error);
    redirect('/dashboard/invoices?error=load_error');
  }
}