"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { TeacherProfileEditDialog } from "@/components/dashboard/TeacherProfileEditDialog";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  FileText, 
  Briefcase,
  Award,
  Edit,
  Loader2,
  Camera,
  Share2,
  MoreHorizontal,
  Users,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  Star,
  ExternalLink,
  Plus,
  BookOpen,
  Lightbulb,
  Copyright as CopyrightIcon
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function TeacherProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Research work state
  const [researchWorks, setResearchWorks] = useState<any[]>([]);
  const [allWorksCache, setAllWorksCache] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/profile");
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        // Prepare all research works cache
        prepareResearchWorksCache(data.data);
      } else {
        setError(data.error || "Failed to fetch profile");
      }
    } catch (err) {
      setError("Failed to fetch profile");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const prepareResearchWorksCache = (profileData: any) => {
    try {
      const teacher = profileData?.teacherProfile;
      if (!teacher) return;

      const isOwnProfile = session?.user?.id === profileData.id;

      // Combine all research works with type and createdAt
      let allWorks: any[] = [];

      // Patents
      if (teacher.patents) {
        teacher.patents.forEach((item: any) => {
          if (isOwnProfile || item.patent.isPublic) {
            allWorks.push({
              ...item.patent,
              type: 'patent',
              relationId: item.id,
              createdAt: item.patent.createdAt || new Date()
            });
          }
        });
      }

      // Journals
      if (teacher.journals) {
        teacher.journals.forEach((item: any) => {
          if (isOwnProfile || item.journal.isPublic) {
            allWorks.push({
              ...item.journal,
              type: 'journal',
              relationId: item.id,
              createdAt: item.journal.createdAt || new Date()
            });
          }
        });
      }

      // Conferences
      if (teacher.conferences) {
        teacher.conferences.forEach((item: any) => {
          if (isOwnProfile || item.conference.isPublic) {
            allWorks.push({
              ...item.conference,
              type: 'conference',
              relationId: item.id,
              createdAt: item.conference.createdAt || new Date()
            });
          }
        });
      }

      // Book Chapters
      if (teacher.bookChapters) {
        teacher.bookChapters.forEach((item: any) => {
          if (isOwnProfile || item.bookChapter.isPublic) {
            allWorks.push({
              ...item.bookChapter,
              type: 'bookChapter',
              relationId: item.id,
              createdAt: item.bookChapter.createdAt || new Date()
            });
          }
        });
      }

      // Copyrights
      if (teacher.copyrights) {
        teacher.copyrights.forEach((item: any) => {
          if (isOwnProfile || item.copyright.isPublic) {
            allWorks.push({
              ...item.copyright,
              type: 'copyright',
              relationId: item.id,
              createdAt: item.copyright.createdAt || new Date()
            });
          }
        });
      }

      // Grants
      if (teacher.grants) {
        teacher.grants.forEach((item: any) => {
          if (isOwnProfile || item.grant.isPublic) {
            allWorks.push({
              ...item.grant,
              type: 'grant',
              relationId: item.id,
              role: item.role,
              createdAt: item.grant.createdAt || new Date()
            });
          }
        });
      }

      // FDPs
      if (teacher.fdps) {
        teacher.fdps.forEach((item: any) => {
          if (isOwnProfile || item.fdp.isPublic) {
            allWorks.push({
              ...item.fdp,
              type: 'fdp',
              relationId: item.id,
              participationType: item.participationType,
              createdAt: item.fdp.createdAt || new Date()
            });
          }
        });
      }

      // Certifications
      if (teacher.certifications) {
        teacher.certifications.forEach((item: any) => {
          if (isOwnProfile || item.certification.isPublic) {
            allWorks.push({
              ...item.certification,
              type: 'certification',
              relationId: item.id,
              createdAt: item.certification.createdAt || new Date()
            });
          }
        });
      }

      // Transactions
      if (teacher.transactions) {
        teacher.transactions.forEach((item: any) => {
          if (isOwnProfile || item.transaction.isPublic) {
            allWorks.push({
              ...item.transaction,
              type: 'transaction',
              relationId: item.id,
              authorOrder: item.orderIndex,
              createdAt: item.transaction.createdAt || new Date()
            });
          }
        });
      }

      // Research Papers (as reviewer)
      if (teacher.reviewedPapers) {
        teacher.reviewedPapers.forEach((paper: any) => {
          allWorks.push({
            ...paper,
            type: 'researchPaper',
            relationId: paper.id,
            role: 'Reviewer',
            student: paper.student,
            createdAt: paper.createdAt || new Date()
          });
        });
      }

      // Ongoing Projects (as advisor)
      if (teacher.user?.advisedOngoingProjects) {
        teacher.user.advisedOngoingProjects.forEach((advisorRel: any) => {
          allWorks.push({
            ...advisorRel.project,
            type: 'ongoingProject',
            relationId: advisorRel.id,
            role: 'Advisor',
            assignedAt: advisorRel.assignedAt,
            student: advisorRel.project.student,
            members: advisorRel.project.members,
            createdAt: advisorRel.project.createdAt || new Date()
          });
        });
      }

      // Sort by createdAt descending (most recent first)
      allWorks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Store all works in cache
      setAllWorksCache(allWorks);
      
      // Load first 5 items
      loadMoreWorks(1, allWorks);
    } catch (err) {
      console.error("Error preparing research works:", err);
    }
  };

  const loadMoreWorks = (pageNum: number, worksCache?: any[]) => {
    try {
      setIsLoadingMore(true);
      const cacheToUse = worksCache || allWorksCache;
      
      // Paginate: 5 items per page
      const itemsPerPage = 5;
      const startIndex = (pageNum - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedWorks = cacheToUse.slice(startIndex, endIndex);

      if (pageNum === 1) {
        setResearchWorks(paginatedWorks);
      } else {
        setResearchWorks(prev => [...prev, ...paginatedWorks]);
      }

      setHasMore(endIndex < cacheToUse.length);
      setPage(pageNum);
    } catch (err) {
      console.error("Error loading more works:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && allWorksCache.length > 0) {
          loadMoreWorks(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, page, allWorksCache]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploadingImage(true);

      // Upload to Appwrite
      const { uploadFile } = await import('@/lib/appwrite');
      const imageUrl = await uploadFile(file);

      // Update profile with new image URL
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile image');
      }

      // Refresh profile data
      await fetchProfile();
      alert('Profile image updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--forth-color) 0%, rgba(255,255,255,0.9) 50%, var(--third-color) 100%)' }}>
        <Loader2 className="h-12 w-12 animate-spin" style={{ color: 'var(--first-color)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--forth-color) 0%, rgba(255,255,255,0.9) 50%, var(--third-color) 100%)' }}>
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive text-lg">{error}</p>
            <Button onClick={fetchProfile} className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teacher = profile?.teacherProfile;
  const stats = profile?.stats;

  return (
    <>
      <div className="min-h-screen" >
        <div className="max-w-7xl mx-auto pb-8">
          {/* Profile Header Section */}
          <div className="relative px-4 sm:px-6 lg:px-8 pt-8">
            <Card className="border-0 shadow-2xl overflow-hidden" style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, var(--forth-color) 100%)'
            }}>
           
              <CardContent className="p-6 sm:p-8 ">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* Avatar Section */}
                  <div className="relative group">
                    <div 
                      className="p-2 rounded-full shadow-xl"
                      style={{ background: 'linear-gradient(135deg, var(--second-color), var(--third-color))' }}
                    >
                      <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-white shadow-lg">
                        <AvatarImage src={profile?.image} alt={profile?.name} />
                        <AvatarFallback className="text-4xl font-bold" style={{ 
                          background: 'linear-gradient(135deg, var(--first-color), var(--second-color))',
                          color: 'white'
                        }}>
                          {profile?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* Camera Icon for Upload */}
                     <label htmlFor="profile-image-upload" className="cursor-pointer">
                      <div
                        className="absolute bottom-0 right-0 h-12 w-12 rounded-full shadow-lg border-2 border-white flex items-center justify-center hover:scale-110 transition-transform"
                        style={{ background: 'linear-gradient(135deg, var(--first-color), var(--second-color))' }}
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        ) : (
                          <Camera className="h-5 w-5 text-white" />
                        )}
                      </div>
                    </label>
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </div>

                      {/* Profile Details */}
                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="space-y-2">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold" style={{ 
                              background: 'linear-gradient(to right, var(--first-color), var(--second-color))',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                              {profile?.name}
                            </h1>
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge 
                                className="text-sm px-4 py-1 font-semibold border-2"
                                style={{ 
                                  background: 'var(--forth-color)',
                                  borderColor: 'var(--third-color)',
                                  color: 'var(--first-color)'
                                }}
                              >
                                {teacher?.designation}
                              </Badge>
                              <Badge 
                                className="text-sm px-4 py-1 font-semibold text-white border-0"
                                style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))' }}
                              >
                                <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                                {profile?.role}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-lg font-medium">
                              {teacher?.department} • {teacher?.affiliation}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              onClick={() => setEditDialogOpen(true)}
                              className="text-white shadow-lg hover:shadow-xl transition-all border-0"
                              style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))' }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Profile
                            </Button>
                            <Button 
                              variant="outline"
                              className="border-2 shadow-md hover:shadow-lg transition-all"
                              style={{ borderColor: 'var(--third-color)', color: 'var(--first-color)' }}
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </Button>
                            <Button 
                              variant="ghost"
                              size="icon"
                              className="shadow-md hover:shadow-lg"
                            >
                              <MoreHorizontal className="h-5 w-5" style={{ color: 'var(--first-color)' }} />
                            </Button>
                          </div>
                        </div>

                        {/* Contact Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                          <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md" style={{ background: 'var(--forth-color)' }}>
                            <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(to bottom right, var(--second-color), var(--third-color))' }}>
                              <Mail className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground font-medium">Email</p>
                              <p className="text-sm font-semibold truncate" style={{ color: 'var(--first-color)' }}>{profile?.email}</p>
                            </div>
                          </div>

                          {teacher?.officialEmail && (
                            <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md" style={{ background: 'var(--forth-color)' }}>
                              <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(to bottom right, var(--second-color), var(--third-color))' }}>
                                <Mail className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground font-medium">Official Email</p>
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--first-color)' }}>{teacher.officialEmail}</p>
                              </div>
                            </div>
                          )}

                          {teacher?.phoneNumber && (
                            <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md" style={{ background: 'var(--forth-color)' }}>
                              <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(to bottom right, var(--second-color), var(--third-color))' }}>
                                <Phone className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground font-medium">Phone</p>
                                <p className="text-sm font-semibold" style={{ color: 'var(--first-color)' }}>{teacher.phoneNumber}</p>
                              </div>
                            </div>
                          )}

                          {teacher?.address && (
                            <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md" style={{ background: 'var(--forth-color)' }}>
                              <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(to bottom right, var(--second-color), var(--third-color))' }}>
                                <MapPin className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground font-medium">Address</p>
                                <p className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--first-color)' }}>{teacher.address}</p>
                              </div>
                            </div>
                          )}
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          {/* Main Content Grid */}
          <div className="px-4 sm:px-6 lg:px-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Sidebar - Stats & Info (Sticky on larger screens) */}
              <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                {/* Statistics Cards */}
                <Card className="border-0 shadow-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95), var(--forth-color))' }}>
                  <CardHeader className="pb-3" style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))' }}>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Statistics Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Patents Stat */}
                    <div className="relative p-4 rounded-2xl transition-all hover:scale-105 hover:shadow-lg cursor-pointer" 
                      style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-indigo-600 mb-1">Patents</p>
                          <p className="text-3xl font-bold text-indigo-900">{stats?.patents || 0}</p>
                          <p className="text-xs text-indigo-600 mt-1">Total granted</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" 
                          style={{ background: 'linear-gradient(135deg, #818CF8, #6366F1)' }}>
                          <Lightbulb className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="pt-3 border-t border-indigo-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-indigo-600 font-medium">Filed</span>
                          <span className="text-indigo-900 font-semibold">{stats?.patents || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-indigo-600 font-medium">Granted</span>
                          <span className="text-indigo-900 font-semibold">{stats?.patents || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Journals Stat */}
                    <div className="relative p-4 rounded-2xl transition-all hover:scale-105 hover:shadow-lg cursor-pointer" 
                      style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-700 mb-1">Journals</p>
                          <p className="text-3xl font-bold text-amber-900">{stats?.journals || 0}</p>
                          <p className="text-xs text-amber-700 mt-1">Published</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" 
                          style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)' }}>
                          <FileText className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="pt-3 border-t border-amber-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-amber-700 font-medium">SCI/Scopus</span>
                          <span className="text-amber-900 font-semibold">{Math.floor((stats?.journals || 0) * 0.7)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-amber-700 font-medium">Others</span>
                          <span className="text-amber-900 font-semibold">{Math.ceil((stats?.journals || 0) * 0.3)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Conferences Stat */}
                    <div className="relative p-4 rounded-2xl transition-all hover:scale-105 hover:shadow-lg cursor-pointer" 
                      style={{ background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-emerald-700 mb-1">Conferences</p>
                          <p className="text-3xl font-bold text-emerald-900">{stats?.conferences || 0}</p>
                          <p className="text-xs text-emerald-700 mt-1">Papers presented</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" 
                          style={{ background: 'linear-gradient(135deg, #34D399, #10B981)' }}>
                          <Users className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="pt-3 border-t border-emerald-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-700 font-medium">International</span>
                          <span className="text-emerald-900 font-semibold">{Math.floor((stats?.conferences || 0) * 0.6)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-emerald-700 font-medium">National</span>
                          <span className="text-emerald-900 font-semibold">{Math.ceil((stats?.conferences || 0) * 0.4)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bio Card */}
                {teacher?.bio && (
                  <Card className="border-0 shadow-xl" style={{ background: 'white' }}>
                    <CardHeader className="pb-3" style={{ 
                      background: 'linear-gradient(135deg, var(--third-color), var(--forth-color))',
                      borderBottom: '3px solid',
                      borderColor: 'var(--second-color)'
                    }}>
                      <CardTitle className="flex items-center gap-2" style={{ color: 'var(--first-color)' }}>
                        <User className="h-5 w-5" />
                        About Me
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full" 
                          style={{ background: 'linear-gradient(to bottom, var(--first-color), var(--second-color))' }} />
                        <div className="pl-4">
                          <p className="text-sm leading-relaxed text-justify" style={{ color: 'var(--first-color)' }}>
                            {teacher.bio}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: 'var(--third-color)' }}>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Briefcase className="h-3 w-3" />
                          <span>
                            Teaching experience in {teacher.department}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Academic Info Card */}
                <Card className="border-0 shadow-xl" style={{ background: 'white' }}>
                  <CardHeader className="pb-3" style={{ 
                    background: 'linear-gradient(135deg, var(--third-color), var(--forth-color))',
                    borderBottom: '3px solid',
                    borderColor: 'var(--second-color)'
                  }}>
                    <CardTitle className="flex items-center gap-2" style={{ color: 'var(--first-color)' }}>
                      <GraduationCap className="h-5 w-5" />
                      Academic Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      {teacher?.qualification && (
                        <div className="p-3 rounded-xl border-l-4" style={{ 
                          background: 'var(--forth-color)',
                          borderColor: 'var(--second-color)'
                        }}>
                          <div className="flex items-start gap-2">
                            <GraduationCap className="h-4 w-4 mt-0.5" style={{ color: 'var(--first-color)' }} />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Highest Qualification</p>
                              <p className="font-bold text-lg" style={{ color: 'var(--first-color)' }}>{teacher.qualification}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {teacher?.department && (
                        <div className="p-3 rounded-xl border-l-4" style={{ 
                          background: 'var(--forth-color)',
                          borderColor: 'var(--second-color)'
                        }}>
                          <div className="flex items-start gap-2">
                            <Briefcase className="h-4 w-4 mt-0.5" style={{ color: 'var(--first-color)' }} />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Department</p>
                              <p className="font-bold text-lg" style={{ color: 'var(--first-color)' }}>{teacher.department}</p>
                              {teacher?.designation && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {teacher.designation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {teacher?.affiliation && (
                        <div className="p-3 rounded-xl border-l-4" style={{ 
                          background: 'var(--forth-color)',
                          borderColor: 'var(--second-color)'
                        }}>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5" style={{ color: 'var(--first-color)' }} />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Affiliation</p>
                              <p className="font-semibold text-sm" style={{ color: 'var(--first-color)' }}>{teacher.affiliation}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {teacher?.subjectOfInterest && teacher.subjectOfInterest.length > 0 && (
                        <div className="p-3 rounded-xl border-l-4" style={{ 
                          background: 'var(--forth-color)',
                          borderColor: 'var(--second-color)'
                        }}>
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 mt-0.5" style={{ color: 'var(--first-color)' }} />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground font-medium mb-2">Research Interests</p>
                              <div className="flex flex-wrap gap-2">
                                {teacher.subjectOfInterest.map((subject: string, index: number) => (
                                  <Badge 
                                    key={index}
                                    className="text-xs px-3 py-1 font-medium shadow-sm"
                                    style={{ 
                                      background: 'linear-gradient(135deg, var(--first-color), var(--second-color))',
                                      color: 'white'
                                    }}
                                  >
                                    {subject}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {teacher.subjectOfInterest.length} area{teacher.subjectOfInterest.length !== 1 ? 's' : ''} of expertise
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t" style={{ borderColor: 'var(--third-color)' }}>
                      <div className="text-center p-2 rounded-lg" style={{ background: 'var(--forth-color)' }}>
                        <p className="text-2xl font-bold" style={{ color: 'var(--first-color)' }}>
                          {((stats?.journals || 0) + (stats?.conferences || 0) + (stats?.bookChapters || 0))}
                        </p>
                        <p className="text-xs text-muted-foreground">Publications</p>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: 'var(--forth-color)' }}>
                        <p className="text-2xl font-bold" style={{ color: 'var(--first-color)' }}>
                          {((stats?.patents || 0) + (stats?.copyrights || 0))}
                        </p>
                        <p className="text-xs text-muted-foreground">IP Rights</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Main Content - All Research Works */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 shadow-xl overflow-hidden" style={{ background: 'white' }}>
                  <CardHeader className="pb-3" style={{ 
                    background: 'linear-gradient(to right, var(--first-color), var(--second-color))'
                  }}>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      All Research Work
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      Latest publications and contributions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {researchWorks.length > 0 ? (
                      <div className="space-y-4">
                        {researchWorks.map((work: any, index: number) => {
                          // Define type-specific styles
                          const typeConfig: any = {
                            patent: {
                              icon: Lightbulb,
                              gradient: 'linear-gradient(135deg, #EEF2FF, rgba(255,255,255,0.5))',
                              iconBg: 'linear-gradient(135deg, #818CF8, #6366F1)',
                              color: '#4F46E5',
                              label: 'Patent'
                            },
                            journal: {
                              icon: FileText,
                              gradient: 'linear-gradient(135deg, var(--forth-color), rgba(255,255,255,0.5))',
                              iconBg: 'linear-gradient(to bottom right, var(--second-color), var(--third-color))',
                              color: 'var(--first-color)',
                              label: 'Journal'
                            },
                            conference: {
                              icon: Users,
                              gradient: 'linear-gradient(135deg, #D1FAE5, rgba(255,255,255,0.5))',
                              iconBg: 'linear-gradient(135deg, #34D399, #10B981)',
                              color: '#059669',
                              label: 'Conference'
                            },
                            bookChapter: {
                              icon: BookOpen,
                              gradient: 'linear-gradient(135deg, #FEE2E2, rgba(255,255,255,0.5))',
                              iconBg: 'linear-gradient(135deg, #F87171, #EF4444)',
                              color: '#DC2626',
                              label: 'Book Chapter'
                            },
                            copyright: {
                              icon: CopyrightIcon,
                              gradient: 'linear-gradient(135deg, #E0E7FF, rgba(255,255,255,0.5))',
                              iconBg: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
                              color: '#7C3AED',
                              label: 'Copyright'
                            },
                            grant: {
                              icon: Award,
                              gradient: 'linear-gradient(135deg, #DBEAFE, rgba(255,255,255,0.5))',
                              iconBg: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
                              color: '#2563EB',
                              label: 'Grant'
                            },
                            fdp: {
                              icon: GraduationCap,
                              gradient: 'linear-gradient(135deg, #FEF3C7, rgba(255,255,255,0.5))',
                              iconBg: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                              color: '#D97706',
                              label: 'FDP'
                            },
                            certification: {
                              icon: Award,
                              gradient: 'linear-gradient(135deg, #FCE7F3, rgba(255,255,255,0.5))',
                              iconBg: 'linear-gradient(135deg, #F472B6, #EC4899)',
                              color: '#DB2777',
                              label: 'Certification'
                            },
                            transaction: {
                              icon: FileText,
                              gradient: 'linear-gradient(135deg, #FEF3C7, rgba(255,255,255,0.5))',
                              iconBg: 'linear-gradient(135deg, #FCD34D, #FBBF24)',
                              color: '#D97706',
                              label: 'Transaction'
                            },
                            researchPaper: {
                              icon: FileText,
                              gradient: 'linear-gradient(135deg, #DBEAFE, rgba(255,255,255,0.5))',
                              iconBg: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
                              color: '#2563EB',
                              label: 'Research Paper'
                            },
                            ongoingProject: {
                              icon: Users,
                              gradient: 'linear-gradient(135deg, #D1FAE5, rgba(255,255,255,0.5))',
                              iconBg: 'linear-gradient(135deg, #34D399, #10B981)',
                              color: '#059669',
                              label: 'Ongoing Project'
                            }
                          };

                          const config = typeConfig[work.type];
                          const Icon = config.icon;

                          return (
                            <div 
                              key={`${work.type}-${work.id}-${index}`}
                              className="group relative p-5 rounded-2xl border-2 transition-all hover:shadow-xl cursor-pointer overflow-hidden"
                              style={{ 
                                borderColor: 'var(--third-color)',
                                background: config.gradient
                              }}
                            >
                              {/* Decorative gradient overlay on hover */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                                style={{ background: config.iconBg }} />
                              
                              <div className="relative">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-start gap-3">
                                      <div className="mt-1 p-2 rounded-lg" style={{ background: config.iconBg }}>
                                        <Icon className="h-5 w-5 text-white" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge 
                                            variant="outline" 
                                            className="text-xs font-semibold"
                                            style={{ color: config.color, borderColor: config.color }}
                                          >
                                            {config.label}
                                          </Badge>
                                          {!work.isPublic && session?.user?.id === profile?.id && (
                                            <Badge variant="secondary" className="text-xs">
                                              Private
                                            </Badge>
                                          )}
                                        </div>
                                        <h3 className="font-bold text-lg group-hover:underline" style={{ color: config.color }}>
                                          {work.title || work.name || work.certificationName || 'Untitled'}
                                        </h3>
                                        
                                        {/* Type-specific details */}
                                        {work.type === 'journal' && (
                                          <>
                                            {work.journalName && (
                                              <p className="text-sm text-muted-foreground mt-1">
                                                📚 {work.journalName}
                                              </p>
                                            )}
                                            {work.volume && (
                                              <p className="text-xs text-muted-foreground">
                                                Volume {work.volume}{work.issue && `, Issue ${work.issue}`}
                                                {work.pageNumbers && ` • Pages: ${work.pageNumbers}`}
                                              </p>
                                            )}
                                            {work.impactFactor && (
                                              <p className="text-xs font-semibold mt-1" style={{ color: config.color }}>
                                                Impact Factor: {work.impactFactor}
                                              </p>
                                            )}
                                          </>
                                        )}
                                        
                                        {work.type === 'conference' && (
                                          <>
                                            {work.conferenceName && (
                                              <p className="text-sm text-muted-foreground mt-1">
                                                🎤 {work.conferenceName}
                                              </p>
                                            )}
                                            {work.conferenceLocation && (
                                              <p className="text-xs text-muted-foreground">
                                                📍 {work.conferenceLocation}
                                              </p>
                                            )}
                                          </>
                                        )}
                                        
                                        {work.type === 'bookChapter' && (
                                          <>
                                            {work.isbnIssn && (
                                              <p className="text-xs text-muted-foreground mt-1">
                                                📖 ISBN/ISSN: {work.isbnIssn}
                                              </p>
                                            )}
                                            {work.registrationFees && (
                                              <p className="text-xs text-muted-foreground">
                                                💰 Registration Fees: ₹{work.registrationFees}
                                              </p>
                                            )}
                                            {work.reimbursement && (
                                              <p className="text-xs text-muted-foreground">
                                                💵 Reimbursement: ₹{work.reimbursement}
                                              </p>
                                            )}
                                          </>
                                        )}
                                        
                                        {work.type === 'patent' && (
                                          <>
                                            {work.patentNumber && (
                                              <p className="text-sm text-muted-foreground mt-1">
                                                🔢 Patent No: {work.patentNumber}
                                              </p>
                                            )}
                                            {work.jurisdiction && (
                                              <p className="text-xs text-muted-foreground">
                                                📋 {work.jurisdiction}
                                              </p>
                                            )}
                                          </>
                                        )}
                                        
                                        {work.type === 'copyright' && (
                                          <>
                                            {work.copyrightNumber && (
                                              <p className="text-sm text-muted-foreground mt-1">
                                                🔢 Copyright No: {work.copyrightNumber}
                                              </p>
                                            )}
                                          </>
                                        )}
                                        
                                        {work.type === 'grant' && (
                                          <>
                                            {work.projectCode && (
                                              <p className="text-sm text-muted-foreground mt-1">
                                                🔑 Project Code: {work.projectCode}
                                              </p>
                                            )}
                                            {work.role && (
                                              <Badge variant="secondary" className="mt-1 text-xs">
                                                {work.role === 'PI' ? 'Principal Investigator' : 'Co-Investigator'}
                                              </Badge>
                                            )}
                                            {work.grantAmount && (
                                              <p className="text-sm font-semibold mt-1" style={{ color: config.color }}>
                                                💰 Amount: ₹{work.grantAmount.toLocaleString()}
                                              </p>
                                            )}
                                            {work.durationMonths && (
                                              <p className="text-xs text-muted-foreground">
                                                ⏱️ Duration: {work.durationMonths} months
                                              </p>
                                            )}
                                          </>
                                        )}
                                        
                                        {work.type === 'fdp' && (
                                          <>
                                            {work.organizedBy && (
                                              <p className="text-sm text-muted-foreground mt-1">
                                                🏛️ Organized by: {work.organizedBy}
                                              </p>
                                            )}
                                            {work.sponsoredBy && (
                                              <p className="text-xs text-muted-foreground">
                                                💼 Sponsored by: {work.sponsoredBy}
                                              </p>
                                            )}
                                            {work.participationType && (
                                              <Badge variant="secondary" className="mt-1 text-xs">
                                                {work.participationType}
                                              </Badge>
                                            )}
                                            {work.duration && (
                                              <p className="text-xs text-muted-foreground mt-1">
                                                ⏱️ {work.duration}
                                              </p>
                                            )}
                                          </>
                                        )}
                                        
                                        {work.type === 'certification' && (
                                          <>
                                            {work.offeredBy && (
                                              <p className="text-sm text-muted-foreground mt-1">
                                                🎓 Offered by: {work.offeredBy}
                                              </p>
                                            )}
                                            {work.link && (
                                              <a 
                                                href={work.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs hover:underline inline-flex items-center gap-1 mt-1"
                                                style={{ color: config.color }}
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                🔗 View Certificate
                                                <ExternalLink className="h-3 w-3" />
                                              </a>
                                            )}
                                          </>
                                        )}

                                        {work.type === 'transaction' && (
                                          <>
                                            {work.transactionName && (
                                              <p className="text-sm text-muted-foreground mt-1">
                                                📰 {work.transactionName}
                                              </p>
                                            )}
                                            {work.typeOfTransaction && (
                                              <p className="text-xs text-muted-foreground">
                                                Type: {work.typeOfTransaction}
                                              </p>
                                            )}
                                            {work.publisher && (
                                              <p className="text-xs text-muted-foreground">
                                                Publisher: {work.publisher}
                                              </p>
                                            )}
                                            {work.impactFactor && (
                                              <p className="text-xs font-semibold mt-1" style={{ color: config.color }}>
                                                Impact Factor: {work.impactFactor}
                                              </p>
                                            )}
                                            {work.indexOfTransaction && (
                                              <Badge variant="outline" className="mt-1 text-xs">
                                                {work.indexOfTransaction}
                                              </Badge>
                                            )}
                                          </>
                                        )}

                                        {work.type === 'researchPaper' && (
                                          <>
                                            {work.student && (
                                              <p className="text-sm text-muted-foreground mt-1">
                                                👨‍🎓 Student: {work.student.user?.name || 'Unknown'}
                                              </p>
                                            )}
                                            {work.abstract && (
                                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {work.abstract}
                                              </p>
                                            )}
                                            <Badge variant="secondary" className="mt-1 text-xs">
                                              Reviewer
                                            </Badge>
                                            {work.keywords && work.keywords.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-2">
                                                {work.keywords.slice(0, 3).map((keyword: string, idx: number) => (
                                                  <Badge 
                                                    key={idx}
                                                    variant="outline" 
                                                    className="text-xs"
                                                    style={{ borderColor: config.color, color: config.color }}
                                                  >
                                                    {keyword}
                                                  </Badge>
                                                ))}
                                                {work.keywords.length > 3 && (
                                                  <Badge variant="outline" className="text-xs">
                                                    +{work.keywords.length - 3}
                                                  </Badge>
                                                )}
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {work.type === 'ongoingProject' && (
                                          <>
                                            {work.student && (
                                              <p className="text-sm text-muted-foreground mt-1">
                                                👨‍🎓 Student: {work.student.user?.name || 'Unknown'}
                                              </p>
                                            )}
                                            {work.abstract && (
                                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {work.abstract}
                                              </p>
                                            )}
                                            <Badge variant="secondary" className="mt-1 text-xs">
                                              Advisor
                                            </Badge>
                                            {work.keywords && work.keywords.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-2">
                                                {work.keywords.slice(0, 3).map((keyword: string, idx: number) => (
                                                  <Badge 
                                                    key={idx}
                                                    variant="outline" 
                                                    className="text-xs"
                                                    style={{ borderColor: config.color, color: config.color }}
                                                  >
                                                    {keyword}
                                                  </Badge>
                                                ))}
                                                {work.keywords.length > 3 && (
                                                  <Badge variant="outline" className="text-xs">
                                                    +{work.keywords.length - 3}
                                                  </Badge>
                                                )}
                                              </div>
                                            )}
                                            {work.members && work.members.length > 0 && (
                                              <p className="text-xs text-muted-foreground mt-1">
                                                👥 Team Members: {work.members.length}
                                              </p>
                                            )}
                                            {work.startDate && (
                                              <p className="text-xs text-muted-foreground mt-1">
                                                📅 Started: {format(new Date(work.startDate), "MMM dd, yyyy")}
                                              </p>
                                            )}
                                            {work.expectedEndDate && (
                                              <p className="text-xs text-muted-foreground mt-1">
                                                ⏰ Expected End: {format(new Date(work.expectedEndDate), "MMM dd, yyyy")}
                                              </p>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Status Badge */}
                                {work.status && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge 
                                      className="font-semibold px-3 py-1"
                                      style={{
                                        background: ['PUBLISHED', 'PRESENTED', 'GRANTED'].includes(work.status) ? 'linear-gradient(to right, var(--first-color), var(--second-color))' :
                                                   ['ACCEPTED', 'APPROVED'].includes(work.status) ? '#D1FAE5' :
                                                   ['UNDER_REVIEW', 'SUBMITTED'].includes(work.status) ? '#FEF3C7' : '#FEE2E2',
                                        color: ['PUBLISHED', 'PRESENTED', 'GRANTED'].includes(work.status) ? 'white' :
                                               ['ACCEPTED', 'APPROVED'].includes(work.status) ? '#065F46' :
                                               ['UNDER_REVIEW', 'SUBMITTED'].includes(work.status) ? '#92400E' : '#991B1B',
                                        border: 'none'
                                      }}
                                    >
                                      {['PUBLISHED', 'PRESENTED', 'GRANTED'].includes(work.status) && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                                      {['UNDER_REVIEW', 'SUBMITTED'].includes(work.status) && <Clock className="h-3.5 w-3.5 mr-1" />}
                                      {work.status.replace(/_/g, ' ')}
                                    </Badge>
                                  </div>
                                )}

                                {/* Date Information */}
                                <div className="flex flex-wrap gap-4 text-sm mt-3">
                                  {work.grantedAt && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-4 w-4" style={{ color: config.color }} />
                                      <span className="font-medium" style={{ color: config.color }}>Granted:</span>
                                      <span className="text-muted-foreground">
                                        {format(new Date(work.grantedAt), "MMM dd, yyyy")}
                                      </span>
                                    </div>
                                  )}
                                  {work.conferenceStartDate && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-4 w-4" style={{ color: config.color }} />
                                      <span className="font-medium" style={{ color: config.color }}>Date:</span>
                                      <span className="text-muted-foreground">
                                        {format(new Date(work.conferenceStartDate), "MMM dd, yyyy")}
                                        {work.conferenceEndDate && ` - ${format(new Date(work.conferenceEndDate), "MMM dd, yyyy")}`}
                                      </span>
                                    </div>
                                  )}
                                  {work.publicationDate && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-4 w-4" style={{ color: config.color }} />
                                      <span className="font-medium" style={{ color: config.color }}>Published:</span>
                                      <span className="text-muted-foreground">
                                        {format(new Date(work.publicationDate), "MMM dd, yyyy")}
                                      </span>
                                    </div>
                                  )}
                                  {work.startDate && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-4 w-4" style={{ color: config.color }} />
                                      <span className="font-medium" style={{ color: config.color }}>
                                        {work.type === 'fdp' ? 'FDP Date:' : 'Started:'}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {format(new Date(work.startDate), "MMM dd, yyyy")}
                                        {work.endDate && ` - ${format(new Date(work.endDate), "MMM dd, yyyy")}`}
                                      </span>
                                    </div>
                                  )}
                                  {work.completedAt && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-4 w-4" style={{ color: config.color }} />
                                      <span className="font-medium" style={{ color: config.color }}>Completed:</span>
                                      <span className="text-muted-foreground">
                                        {format(new Date(work.completedAt), "MMM dd, yyyy")}
                                      </span>
                                    </div>
                                  )}
                                  {work.appliedAt && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-4 w-4" style={{ color: config.color }} />
                                      <span className="font-medium" style={{ color: config.color }}>Applied:</span>
                                      <span className="text-muted-foreground">
                                        {format(new Date(work.appliedAt), "MMM dd, yyyy")}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Uploaded timestamp */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                  <Clock className="h-3 w-3" />
                                  <span>Uploaded {format(new Date(work.createdAt), "MMM dd, yyyy 'at' HH:mm")}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Loading indicator */}
                        {isLoadingMore && (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--first-color)' }} />
                          </div>
                        )}

                        {/* Infinite scroll trigger */}
                        <div ref={observerTarget} className="h-4" />
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
                          style={{ background: 'linear-gradient(to bottom right, var(--third-color), var(--forth-color))' }}>
                          <Award className="h-10 w-10" style={{ color: 'var(--first-color)' }} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--first-color)' }}>
                          No research work yet
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Start adding your publications and research contributions!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      {profile && (
        <TeacherProfileEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchProfile}
          profile={profile}
        />
      )}
    </>
  );
}
