import React from 'react'
import { Link } from '@tanstack/react-router'

export default function Index() {
    console.log("Index route rendered");
  return (
    
    <div className=" bg-red-400  h-screen">
      <h1 className="text-2xl font-bold mb-4">Home</h1>
      <p>Welcome to the Sales and Inventory Management app!</p>
      <nav className="mt-4">
        <Link to="/profile" className="text-blue-500 underline">Go to Profile</Link>
      </nav>
    </div>
  )
}