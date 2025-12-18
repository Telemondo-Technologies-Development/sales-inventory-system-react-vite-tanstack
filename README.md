# Sales and Inventory Management Application
A modern Sales and Inventory Management Application designed to streamline business operations such as inventory tracking, sales recording, employee handling, and restaurant order management.
This application is built as a fast, offline-capable Progressive Web App (PWA) using modern frontend technologies.

## Tech Stack
Vite - React - Tanstack - PWA - Dexie.js(IndexedDB) 

### UI libraries 
Tailwind CSS - Shadcn UI - Lucide Icons

## Features
* Inventory Management
  - Track product quantities, monitor stock levels, and manage item updates to ensure accurate and up-to-date inventory records.
* Sales Management
  - Record sales transactions, calculate totals, and maintain a clear history of daily and overall sales performance.
* Employee Management
  - Manage employee records, assign roles, and control access levels within the system.
* Expenses Management
  - Log and monitor business expenses to help track costs and improve financial decision-making.
* Restaurant Menu & Order Management
  - Manage menu items, process customer orders, and handle order workflows efficiently for restaurant operations.
* Role-Based Login System
  - Secure authentication system that grants users access based on their assigned roles (e.g., admin, cashier, staff).

## Installation Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation Steps

1. Install dependencies:
```bash
npm install
```
2. Start the development server:
```bash
npm run dev
```
3. Open your browser and navigate to http://localhost:3000 to access the application.

## Build for Production
To build the application for production, run:
```bash
npm run build
```
This will generate optimized static files in the dist directory. You can then deploy these files to your web server.

## Progressive Web App (PWA) Support
* Installable on Desktop and Mobile
* Offline Capability
* Fast Loading

## Future Updates
* Improved Order Logic
  - Enhanced handling of restaurant orders (e.g., merging, editing, and tracking orders accurately)
* Expense Naming Convention Bug Fix
  - Planned solution: intelligent name normalization and quantity merging
* Aside Navigation Categorization