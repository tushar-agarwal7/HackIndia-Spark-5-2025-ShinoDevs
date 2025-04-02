// components/layout/DashboardLayout.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch('/api/users/profile');
        
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/signin');
            return;
          }
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await res.json();
        setUser(userData);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }
    
    fetchUserData();
  }, [router]);
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
    },
    { 
      path: '/dashboard/learn', 
      label: 'Learn', 
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' 
    },
    { 
      path: '/dashboard/challenges', 
      label: 'Challenges', 
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' 
    },
    { 
      path: '/dashboard/profile', 
      label: 'Profile', 
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' 
    },
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/logo.svg"
                    alt="ShinobiSpeak Logo"
                    width={32}
                    height={32}
                    className="mr-2"
                  />
                  <span className="font-bold text-xl">ShinobiSpeak</span>
                </Link>
              </div>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="mr-3 text-sm font-medium text-gray-700">
                    {user?.username || 'Loading...'}
                  </span>
                  <button onClick={handleLogout} className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L15.586 9H7a1 1 0 100 2h8.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              >
                <span className="sr-only">{isMobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                <svg
                  className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu, toggle based on menu state */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  pathname === item.path
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                } block pl-3 pr-4 py-2 border-l-4 border-transparent font-medium`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div>
                <div className="text-base font-medium text-gray-800">
                  {user?.username || 'Loading...'}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {user?.walletAddress 
                    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                    : 'Loading...'}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={handleLogout}
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Content area with sidebar */}
      <div className="flex-1 flex flex-col sm:flex-row">
        {/* Sidebar for desktop */}
        <div className="hidden sm:flex sm:flex-col w-64 bg-white shadow-inner">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`${
                    pathname === item.path
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <svg
                    className={`${
                      pathname === item.path ? 'text-white' : 'text-gray-500 group-hover:text-gray-600'
                    } mr-3 h-5 w-5`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={item.icon}
                    />
                  </svg>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-x-hidden bg-gray-50 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}