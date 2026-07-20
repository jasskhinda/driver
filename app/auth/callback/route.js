import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This route handles the callback after OAuth sign-in
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        new URL('/login?error=Authentication failed', requestUrl.origin)
      );
    }
    
    // For OAuth users, ensure they have a role assigned in their profile and email is confirmed
    if (data && data.session) {
      try {
        // Get user metadata
        const userMetadata = data.session.user.user_metadata || {};
        
        // Assign a default role ONLY for genuinely role-less accounts. Checking the JWT
        // metadata alone is not enough: an account can have profiles.role already set (e.g.
        // 'dispatcher'/'driver') while its metadata has no role, and writing blindly here
        // would silently overwrite their real role and break their app access.
        if (!userMetadata.role) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();

          if (!existingProfile?.role) {
            await supabase.auth.updateUser({
              data: { role: 'client' }
            });

            await supabase
              .from('profiles')
              .update({ role: 'client' })
              .eq('id', data.session.user.id);
          }
        }
        
        // Ensure email is confirmed via admin API
        await fetch(`${requestUrl.origin}/api/auth/confirm-oauth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.session.user.id,
          }),
        });
      } catch (profileError) {
        console.error('Error updating user data:', profileError);
        // Continue with the redirect even if updates fail
      }
    }
    
    // Successful authentication, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  }
  
  // If no code is present, redirect back to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}