'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton({ className }) {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      // Call the logout API endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Redirect to home page after successful logout
        router.push('/');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  return (
    <button
      onClick={handleLogout}
      className={className || "text-gray-700 hover:text-gray-900"}
    >
      Sign Out
    </button>
  );
}
