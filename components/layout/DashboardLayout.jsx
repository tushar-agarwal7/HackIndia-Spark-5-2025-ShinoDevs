"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import NotificationCenter from "../notifications/NotificationCenter";
import { useContract } from "@/lib/web3/hooks/useContract";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const { isConnected } = useContract();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    const fetchNotificationsCount = async () => {
      try {
        const response = await fetch("/api/notifications/unread-count");
        if (response.ok) {
          const data = await response.json();
          setUnreadNotificationsCount(data.count);
        }
      } catch (error) {
        console.error("Error fetching unread notifications count:", error);
      }
    };

    if (isConnected) {
      fetchNotificationsCount();

      // Set up polling for new notifications
      const interval = setInterval(fetchNotificationsCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/users/profile");

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/auth/signin");
            return;
          }
          throw new Error("Failed to fetch user data");
        }

        const userData = await res.json();
        setUser(userData);

        // Fetch notifications
        try {
          const notificationsRes = await fetch("/api/notifications");
          if (notificationsRes.ok) {
            const notificationsData = await notificationsRes.json();
            setNotifications(notificationsData);
            setHasUnreadNotifications(
              notificationsData.some((notification) => !notification.read)
            );
          }
        } catch (notificationError) {
          console.error("Error fetching notifications:", notificationError);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [router]);

  // Close mobile menu/sidebar when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      path: "/dashboard/learn",
      label: "Learn",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
    {
      path: "/dashboard/challenges",
      label: "Challenges",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    },
    {
      path: "/dashboard/statistics",
      label: "Statistics",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      path: "/dashboard/profile",
      label: "Profile",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <nav className="shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-30 bg-white/95 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="cursor-pointer inline-flex items-center justify-center rounded-md p-2 text-gray-400 md:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <svg
                  className="h-6 w-6"
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
              </button>

              <div className="flex-shrink-0 flex items-center ml-0 md:ml-0">
                <Link href="/dashboard" className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="ShinoLearn Logo"
                    className="drop-shadow-2xl pr-3"
                    width={70}
                    height={70}
                  />
                  <span className="ml-2 font-bold text-xl hidden sm:block">
                    ShinoLearn
                  </span>
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              {/* Create Challenge Button for Desktop */}
              <Link
                href="/dashboard/challenges/create"
                className="hidden md:flex items-center mr-4 px-4 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm hover:from-cyan-600 hover:to-teal-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                New Challenge
              </Link>

              <button
                className="cursor-pointer p-2 rounded-full text-gray-400 hover:text-gray-500 relative"
                onClick={() => setIsNotificationsOpen(true)}
              >
                <span className="sr-only">View notifications</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {unreadNotificationsCount > 9
                      ? "9+"
                      : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <button
                    type="button"
                    className="cursor-pointer flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200"
                    id="user-menu-button"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center text-white font-medium shadow-sm">
                      {user?.username?.charAt(0) ||
                        user?.walletAddress?.slice(0, 2) ||
                        "U"}
                    </div>
                  </button>
                  <span className="hidden md:block ml-3 text-sm font-medium text-gray-700 truncate max-w-xs">
                    {user?.username || "Loading..."}
                  </span>
                </div>
                {/* Mobile menu dropdown */}
                <div
                  className={`${
                    isMobileMenuOpen ? "absolute" : "hidden"
                  } right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transform transition-all duration-200 ${
                    isMobileMenuOpen
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95"
                  }`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex="-1"
                >
                  <div className="block px-4 py-2 text-xs text-gray-400 border-b border-gray-100">
                    Manage Account
                  </div>
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-cyan-600 transition-colors"
                    role="menuitem"
                  >
                    Your Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="cursor-pointer block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-cyan-600 transition-colors w-full text-left"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white transform transition-transform ease-in-out duration-300 md:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 relative">
                <div className="relative bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl w-full h-full flex items-center justify-center overflow-hidden border-2 border-cyan-300 shadow-md">
                  {/* Robot elements */}
                  <div className="flex space-x-1">
                    <div className="bg-yellow-300 rounded-full w-[20%] h-[20%]"></div>
                    <div className="bg-yellow-300 rounded-full w-[20%] h-[20%]"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-2 font-bold text-xl">ShinoLearn</div>
          </div>
          <button
            className="cursor-pointer rounded-md p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <span className="sr-only">Close sidebar</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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

        <div className="mt-4 px-2 space-y-1">
          {/* Create Challenge Button for Mobile Sidebar */}
          <Link
            href="/dashboard/challenges/create"
            className="group flex items-center px-2 py-2 text-base font-medium rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-3 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New Challenge
          </Link>

          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${
                pathname === item.path
                  ? "bg-cyan-50 text-cyan-600 border-l-4 border-cyan-500"
                  : "text-gray-700 hover:bg-gray-100 border-l-4 border-transparent"
              } group flex items-center px-2 py-2 text-base font-medium rounded-md `}
            >
              <svg
                className={`${
                  pathname === item.path ? "text-cyan-500" : "text-gray-500"
                } mr-3 h-6 w-6`}
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

          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="cursor-pointer group flex items-center px-2 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md w-full"
            >
              <svg
                className="mr-3 h-6 w-6 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Content area with sidebar */}
      <div className="flex flex-col md:flex-row pt-16">
        {/* Main content */}
        <main className="flex-1 ">
          <div className="bg-[#F8FAFC] min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white shadow-t border-t border-gray-200 ">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center py-2 px-3 ${
                pathname === item.path ? "text-cyan-600" : "text-gray-500"
              }`}
            >
              <svg
                className="h-6 w-6"
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
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating action button for mobile - Create Challenge */}
      <div className="fixed bottom-20 right-4 md:hidden z-30">
        <Link
          href="/dashboard/challenges/create"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg hover:from-cyan-600 hover:to-teal-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
      {isNotificationsOpen && (
        <NotificationCenter onClose={() => setIsNotificationsOpen(false)} />
      )}
    </div>
  );
}
