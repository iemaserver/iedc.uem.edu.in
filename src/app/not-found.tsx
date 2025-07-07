'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileQuestion, Home, Search, ArrowLeft, BookOpen, Users, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // You can implement search functionality here
      router.push(`/dashboard?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  const handleGoBack = () => {
    router.back();
  };

  // Popular sections/features of the IEDC platform
  const popularSections = [
    {
      icon: BookOpen,
      title: 'Research Papers',
      description: 'Browse and submit research papers',
      href: '/dashboard/paper',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Users,
      title: 'Ongoing Projects',
      description: 'View and manage ongoing projects',
      href: '/dashboard/project',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: Award,
      title: 'Achievements',
      description: 'Explore achievements and milestones',
      href: '/dashboard/achievement',
      color: 'text-purple-600 dark:text-purple-400'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <FileQuestion className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Sorry, we couldn't find the page you're looking for.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Search Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
              Looking for something specific?
            </h3>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
              <Input
                type="text"
                placeholder="Search IEDC platform..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" className="px-4">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Popular Sections */}
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
              Popular Sections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularSections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <Link 
                    key={index} 
                    href={section.href}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className="flex justify-center mb-3">
                          <IconComponent className={`h-8 w-8 ${section.color} group-hover:scale-110 transition-transform duration-200`} />
                        </div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          {section.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {section.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              If you believe this is an error or you need assistance navigating the IEDC platform, please contact our support team.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:support@iedc.com">
                  Contact Support
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/help" target="_blank" rel="noopener noreferrer">
                  Help Center
                </a>
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleGoBack} 
              variant="outline"
              className="flex items-center gap-2 flex-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            
            <Button 
              onClick={handleGoHome} 
              className="flex items-center gap-2 flex-1"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 Innovation and Entrepreneurship Development Cell (IEDC)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
