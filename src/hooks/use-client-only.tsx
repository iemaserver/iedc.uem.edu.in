import { useState, useEffect } from 'react';

/**
 * Hook to prevent hydration mismatches with date formatting
 * Returns formatted date only after client-side hydration
 */
export function useClientDateFormat(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (date) {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const formatted = dateObj.toLocaleDateString('en-US', options);
      setFormattedDate(formatted);
    }
  }, [date, options]);

  if (!isClient) {
    return ''; // Return empty string during SSR
  }

  return formattedDate;
}

/**
 * Hook to prevent hydration mismatches with any client-only content
 */
export function useClientOnly() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Component wrapper to prevent hydration mismatches
 */
export function ClientOnly({ children, fallback = null }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const isClient = useClientOnly();
  
  if (!isClient) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
