'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Check for error query parameter on page load
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get('error');
    const freshLogin = searchParams.get('fresh') === 'true';
    const wasLoggedOut = searchParams.get('logout') === 'true';
    
    // If this is a fresh login after signout or a logout, clear any existing session
    if (freshLogin || wasLoggedOut) {
      // Clear session to prevent redirect loops
      supabase.auth.signOut().catch(err => 
        console.error('Error clearing session on login page load:', err)
      );
    }
    
    if (errorParam === 'access_denied') {
      setError('Access denied. You do not have permission to access this application.');
    } else if (errorParam === 'server_error') {
      setError('Server error. Please try again later.');
    }
  }, [supabase.auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', { email });
      
      // Sign in with Supabase - email confirmation is now disabled in settings
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // For refresh token errors, still proceed with login
        if (error.message && error.message.includes('Refresh Token Not Found')) {
          console.log('Ignoring refresh token error during login');
        } else {
          throw error;
        }
      }
      
      // Successfully logged in
      console.log('Login successful, session:', data.session ? 'exists' : 'none');
      
      // Explicitly refresh the page instead of using router.push
      // This ensures cookies are properly sent in the next request
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Don't show refresh token errors to the user, as they're likely harmless
      if (error.message && error.message.includes('Refresh Token Not Found')) {
        console.log('Ignoring refresh token error and proceeding with redirect');
        // Still try to redirect to dashboard
        window.location.href = '/dashboard';
        return;
      }
      
      setError(error.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-100 rounded border border-red-300">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#84CED3] focus:border-[#84CED3]"
          placeholder="driver@example.com"
        />
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="password">
            Password
          </label>
          <button 
            type="button"
            onClick={() => router.push('/reset-password')}
            className="text-sm text-[#84CED3] hover:text-[#70B8BD] font-medium">
            Forgot password?
          </button>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#84CED3] focus:border-[#84CED3]"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-[#84CED3] text-white rounded hover:bg-[#70B8BD] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#84CED3] disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Processing...' : 'Sign In'}
      </button>
    </form>
  );
}