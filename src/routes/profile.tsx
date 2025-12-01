import React from 'react'
import { Link } from '@tanstack/react-router'

export default function Profile() {
console.log("Profile route rendered");
  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p>This is your profile page.</p>
      {/* Show profile info here */}
      <nav className="mt-4">
        <Link to="/" className="text-blue-500 underline">Back to Home</Link>
      </nav>
    </div>
  )
}