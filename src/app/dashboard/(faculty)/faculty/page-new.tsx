import dynamic from 'next/dynamic';

// Dynamically import the Faculty page component with no SSR
const FacultyPage = dynamic(() => import('./FacultyPageContent'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <p>Loading faculty dashboard...</p>
    </div>
  ),
});

export default function Page() {
  return <FacultyPage />;
}
