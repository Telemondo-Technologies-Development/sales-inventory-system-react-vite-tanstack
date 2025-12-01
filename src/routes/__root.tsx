import React from 'react'
import { Outlet, Link } from '@tanstack/react-router'

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <header className="bg-[#475d92] text-white px-4 py-4 flex flex-col w-[250px] fixed h-full">
        <nav className="flex flex-col space-y-4 mt-4 items-center gap-4">
          <Link to="/index" className="hover:text-gray-300">Home</Link>
          <Link to="/profile" className="hover:text-gray-300">Profile</Link>
          <Link to="/table-orders" className="hover:text-gray-300">Table Orders</Link>
        </nav>
      </header>

      {/* Main content */}
      <main className="ml-[250px] flex-1 bg-[#ffffff] min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
