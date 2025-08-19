import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';

/**
 * Higher-order component that disables SSR for the wrapped component
 * Use this for components that have hydration issues or require client-side only features
 */
export function withNoSSR<P extends object>(
  Component: ComponentType<P>,
  loadingComponent?: () => ReactNode
) {
  const NoSSRComponent = dynamic(() => Promise.resolve(Component), {
    ssr: false,
    loading: loadingComponent || (() => (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    )),
  });

  NoSSRComponent.displayName = `withNoSSR(${Component.displayName || Component.name || 'Component'})`;
  
  return NoSSRComponent;
}

/**
 * Hook to safely use window object and other browser APIs
 */
export function useSafeWindow() {
  if (typeof window !== 'undefined') {
    return window;
  }
  return undefined;
}

/**
 * Hook to safely use localStorage
 */
export function useSafeLocalStorage() {
  const setItem = (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('Failed to set localStorage item:', error);
      }
    }
  };

  const getItem = (key: string) => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('Failed to get localStorage item:', error);
        return null;
      }
    }
    return null;
  };

  const removeItem = (key: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove localStorage item:', error);
      }
    }
  };

  return { setItem, getItem, removeItem };
}
