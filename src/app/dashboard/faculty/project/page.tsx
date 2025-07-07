"use client";

import dynamicImport from 'next/dynamic';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Dynamically import the Faculty page component
const FacultyOngoingProjectReview = dynamicImport(() => import('./FacultyPageContent'), {
  loading: () => (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <p>Loading faculty dashboard...</p>
    </div>
  ),
});

export default function Page() {
  return <FacultyOngoingProjectReview />;
}
