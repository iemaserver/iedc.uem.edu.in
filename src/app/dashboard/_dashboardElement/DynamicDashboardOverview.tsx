"use client";

import dynamicImport from 'next/dynamic';

// Dynamically import the DashboardOverview component
const DashboardOverview = dynamicImport(() => import('./DashboardOverview'), {
  loading: () => (
    <div className="flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <p>Loading dashboard...</p>
    </div>
  ),
});

export default DashboardOverview;
