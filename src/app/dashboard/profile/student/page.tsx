"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { StudentProfileEditDialog } from "@/components/dashboard/StudentProfileEditDialog";
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
  Plus
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin" style={{ color: 'var(--second-color)' }} />
          <p className="text-lg font-semibold" style={{ color: 'var(--first-color)' }}>Loading your profile...</p>
        </div>
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

  const student = profile?.studentProfile;
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
                                {student?.rollNumber}
                              </Badge>
                              <Badge 
                                className="text-sm px-4 py-1 font-semibold text-white border-0"
                                style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))' }}
                              >
                                <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                                {profile?.role}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-lg font-medium">
                              {student?.department} • Year {student?.year} • Section {student?.section}
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

                          {student?.phoneNumber && (
                            <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md" style={{ background: 'var(--forth-color)' }}>
                              <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(to bottom right, var(--second-color), var(--third-color))' }}>
                                <Phone className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground font-medium">Phone</p>
                                <p className="text-sm font-semibold" style={{ color: 'var(--first-color)' }}>{student.phoneNumber}</p>
                              </div>
                            </div>
                          )}

                          {student?.address && (
                            <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md" style={{ background: 'var(--forth-color)' }}>
                              <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(to bottom right, var(--second-color), var(--third-color))' }}>
                                <MapPin className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground font-medium">Address</p>
                                <p className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--first-color)' }}>{student.address}</p>
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
                    {/* Research Papers Stat */}
                    <div className="relative p-4 rounded-2xl transition-all hover:scale-105 hover:shadow-lg cursor-pointer" 
                      style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-indigo-600 mb-1">Research Papers</p>
                          <p className="text-3xl font-bold text-indigo-900">{stats?.researchPapers || 0}</p>
                          <p className="text-xs text-indigo-600 mt-1">Total submissions</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" 
                          style={{ background: 'linear-gradient(135deg, #818CF8, #6366F1)' }}>
                          <FileText className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Ongoing Projects Stat */}
                    <div className="relative p-4 rounded-2xl transition-all hover:scale-105 hover:shadow-lg cursor-pointer" 
                      style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-amber-700 mb-1">Active Projects</p>
                          <p className="text-3xl font-bold text-amber-900">{stats?.ongoingProjects || 0}</p>
                          <p className="text-xs text-amber-700 mt-1">In progress</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" 
                          style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)' }}>
                          <Briefcase className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Achievements Stat */}
                    <div className="relative p-4 rounded-2xl transition-all hover:scale-105 hover:shadow-lg cursor-pointer" 
                      style={{ background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-700 mb-1">Achievements</p>
                          <p className="text-3xl font-bold text-emerald-900">{stats?.achievements || 0}</p>
                          <p className="text-xs text-emerald-700 mt-1">Total earned</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" 
                          style={{ background: 'linear-gradient(135deg, #34D399, #10B981)' }}>
                          <Award className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bio Card */}
                {student?.bio && (
                  <Card className="border-0 shadow-xl" style={{ background: 'white' }}>
                    <CardHeader className="pb-3" style={{ 
                      background: 'linear-gradient(135deg, var(--third-color), var(--forth-color))',
                      borderBottom: '3px solid',
                      borderColor: 'var(--second-color)'
                    }}>
                      <CardTitle className="flex items-center gap-2" style={{ color: 'var(--first-color)' }}>
                        <Users className="h-5 w-5" />
                        About Me
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--first-color)' }}>
                        {student.bio}
                      </p>
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
                      <div className="p-3 rounded-xl" style={{ background: 'var(--forth-color)' }}>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Department</p>
                        <p className="font-bold text-lg" style={{ color: 'var(--first-color)' }}>{student?.department}</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl text-center" style={{ background: 'var(--forth-color)' }}>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Year</p>
                          <p className="font-bold text-xl" style={{ color: 'var(--first-color)' }}>{student?.year}</p>
                        </div>
                        <div className="p-3 rounded-xl text-center" style={{ background: 'var(--forth-color)' }}>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Section</p>
                          <p className="font-bold text-xl" style={{ color: 'var(--first-color)' }}>{student?.section}</p>
                        </div>
                        <div className="p-3 rounded-xl text-center" style={{ background: 'var(--forth-color)' }}>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Batch</p>
                          <p className="font-bold text-xl" style={{ color: 'var(--first-color)' }}>{student?.batch}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Main Content - Research Papers & Projects */}
              <div className="lg:col-span-2 space-y-6">
                {/* Research Papers */}
                <Card className="border-0 shadow-xl overflow-hidden" style={{ background: 'white' }}>
                  <CardHeader className="pb-3" style={{ 
                    background: 'linear-gradient(to right, var(--first-color), var(--second-color))'
                  }}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Research Papers
                      </CardTitle>
                      <Link href="/dashboard/student/research-paper/upload">
                        <Button 
                          size="sm" 
                          className="bg-white hover:bg-white/90 border-0 shadow-md"
                          style={{ color: 'var(--first-color)' }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Upload New
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {student?.researchPapers?.length > 0 ? (
                      <div className="space-y-4">
                        {student.researchPapers.map((paper: any) => (
                          <div 
                            key={paper.id} 
                            className="group relative p-5 rounded-2xl border-2 transition-all hover:shadow-xl cursor-pointer overflow-hidden"
                            style={{ 
                              borderColor: 'var(--third-color)',
                              background: 'linear-gradient(135deg, var(--forth-color), rgba(255,255,255,0.5))'
                            }}
                          >
                            {/* Decorative gradient overlay on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                              style={{ background: 'linear-gradient(135deg, var(--first-color), var(--second-color))' }} />
                            
                            <div className="relative">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-1 p-2 rounded-lg" style={{ background: 'linear-gradient(to bottom right, var(--second-color), var(--third-color))' }}>
                                      <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="font-bold text-lg group-hover:underline" style={{ color: 'var(--first-color)' }}>
                                        {paper.title}
                                      </h3>
                                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                        {paper.abstract}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>

                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge 
                                  className="font-semibold px-3 py-1"
                                  style={{
                                    background: paper.status === "PUBLISHED" ? 'linear-gradient(to right, var(--first-color), var(--second-color))' :
                                               paper.status === "APPROVED" ? '#D1FAE5' :
                                               paper.status === "UNDER_REVIEW" ? '#FEF3C7' : '#FEE2E2',
                                    color: paper.status === "PUBLISHED" ? 'white' :
                                           paper.status === "APPROVED" ? '#065F46' :
                                           paper.status === "UNDER_REVIEW" ? '#92400E' : '#991B1B',
                                    border: 'none'
                                  }}
                                >
                                  {paper.status === "PUBLISHED" && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                                  {paper.status === "UNDER_REVIEW" && <Clock className="h-3.5 w-3.5 mr-1" />}
                                  {paper.status.replace(/_/g, ' ')}
                                </Badge>
                                {paper.keywords?.slice(0, 3).map((keyword: string) => (
                                  <Badge 
                                    key={keyword} 
                                    variant="outline"
                                    className="font-medium"
                                    style={{ 
                                      borderColor: 'var(--third-color)',
                                      background: 'white'
                                    }}
                                  >
                                    {keyword}
                                  </Badge>
                                ))}
                                {paper.keywords?.length > 3 && (
                                  <Badge variant="outline">+{paper.keywords.length - 3} more</Badge>
                                )}
                              </div>

                              {paper.reviewedBy && (
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-4 w-4" style={{ color: 'var(--second-color)' }} />
                                  <span className="font-medium" style={{ color: 'var(--first-color)' }}>Reviewed By:</span>
                                  <span className="text-muted-foreground">
                                    {paper.reviewedBy.user.name}
                                  </span>
                                </div>
                              )}
                              {paper.members && paper.members.length > 0 && (
                                <div className="flex items-center gap-2 text-sm mt-1">
                                  <Users className="h-4 w-4" style={{ color: 'var(--second-color)' }} />
                                  <span className="font-medium" style={{ color: 'var(--first-color)' }}>Team Members:</span>
                                  <span className="text-muted-foreground">
                                    {paper.members.slice(0, 3).map((m: any, idx: number) => (
                                      <span key={m.id}>
                                        {m.member.name}
                                        {idx < Math.min(paper.members.length, 3) - 1 ? ", " : ""}
                                      </span>
                                    ))}
                                    {paper.members.length > 3 && ` +${paper.members.length - 3} more`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
                          style={{ background: 'linear-gradient(to bottom right, var(--third-color), var(--forth-color))' }}>
                          <FileText className="h-10 w-10" style={{ color: 'var(--first-color)' }} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--first-color)' }}>
                          No research papers yet
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Upload your first paper to get started!
                        </p>
                        <Link href="/dashboard/student/research-paper/upload">
                          <Button 
                            className="text-white shadow-lg hover:shadow-xl transition-all"
                            style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))' }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Upload Paper
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Ongoing Projects */}
                <Card className="border-0 shadow-xl overflow-hidden" style={{ background: 'white' }}>
                  <CardHeader className="pb-3" style={{ 
                    background: 'linear-gradient(135deg, #FBBF24, #F59E0B)'
                  }}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Ongoing Projects
                      </CardTitle>
                      <Link href="/dashboard/student/ongoing-project/upload">
                        <Button 
                          size="sm" 
                          className="bg-white hover:bg-white/90 text-amber-900 border-0 shadow-md"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add New
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {student?.ongoingProjects?.length > 0 ? (
                      <div className="space-y-4">
                        {student.ongoingProjects.map((project: any) => (
                          <div 
                            key={project.id} 
                            className="group relative p-5 rounded-2xl border-2 transition-all hover:shadow-xl cursor-pointer overflow-hidden"
                            style={{ 
                              borderColor: 'var(--third-color)',
                              background: 'linear-gradient(135deg, #FEF3C7, rgba(255,255,255,0.5))'
                            }}
                          >
                            {/* Decorative gradient overlay on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                              style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)' }} />
                            
                            <div className="relative">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-1 p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                                      <Briefcase className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="font-bold text-lg group-hover:underline text-amber-900">
                                        {project.title}
                                      </h3>
                                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                        {project.abstract}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>

                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge 
                                  className="font-semibold px-3 py-1"
                                  style={{
                                    background: project.status === "COMPLETED" ? '#D1FAE5' :
                                               project.status === "IN_PROGRESS" ? '#DBEAFE' :
                                               project.status === "ON_HOLD" ? '#FEF3C7' : '#FEE2E2',
                                    color: project.status === "COMPLETED" ? '#065F46' :
                                           project.status === "IN_PROGRESS" ? '#1E40AF' :
                                           project.status === "ON_HOLD" ? '#92400E' : '#991B1B',
                                    border: 'none'
                                  }}
                                >
                                  {project.status === "COMPLETED" && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                                  {project.status === "IN_PROGRESS" && <Clock className="h-3.5 w-3.5 mr-1" />}
                                  {project.status === "ON_HOLD" && <Target className="h-3.5 w-3.5 mr-1" />}
                                  {project.status.replace(/_/g, ' ')}
                                </Badge>
                                {project.keywords?.slice(0, 3).map((keyword: string) => (
                                  <Badge 
                                    key={keyword} 
                                    variant="outline"
                                    className="font-medium border-amber-300 bg-white"
                                  >
                                    {keyword}
                                  </Badge>
                                ))}
                                {project.keywords?.length > 3 && (
                                  <Badge variant="outline">+{project.keywords.length - 3} more</Badge>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-4 text-sm mb-3">
                                {project.startDate && (
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 text-amber-600" />
                                    <span className="font-medium text-amber-900">Started:</span>
                                    <span className="text-muted-foreground">
                                      {format(new Date(project.startDate), "MMM yyyy")}
                                    </span>
                                  </div>
                                )}
                                {project.expectedEndDate && (
                                  <div className="flex items-center gap-1.5">
                                    <Target className="h-4 w-4 text-amber-600" />
                                    <span className="font-medium text-amber-900">Due:</span>
                                    <span className="text-muted-foreground">
                                      {format(new Date(project.expectedEndDate), "MMM yyyy")}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1">
                                {project.advisors && project.advisors.length > 0 && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-amber-600" />
                                    <span className="font-medium text-amber-900">Advisors:</span>
                                    <span className="text-muted-foreground">
                                      {project.advisors.slice(0, 2).map((adv: any, idx: number) => (
                                        <span key={adv.id}>
                                          {adv.advisor.name}
                                          {idx < Math.min(project.advisors.length, 2) - 1 ? ", " : ""}
                                        </span>
                                      ))}
                                      {project.advisors.length > 2 && ` +${project.advisors.length - 2} more`}
                                    </span>
                                  </div>
                                )}
                                {project.members && project.members.length > 0 && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Users className="h-4 w-4 text-amber-600" />
                                    <span className="font-medium text-amber-900">Team Members:</span>
                                    <span className="text-muted-foreground">
                                      {project.members.slice(0, 3).map((m: any, idx: number) => (
                                        <span key={m.id}>
                                          {m.member.name}
                                          {m.role && ` (${m.role})`}
                                          {idx < Math.min(project.members.length, 3) - 1 ? ", " : ""}
                                        </span>
                                      ))}
                                      {project.members.length > 3 && ` +${project.members.length - 3} more`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-amber-400 to-orange-500">
                          <Briefcase className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-amber-900">
                          No ongoing projects yet
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Start your first project today!
                        </p>
                        <Link href="/dashboard/student/ongoing-project/upload">
                          <Button className="text-white shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-amber-500 to-orange-500">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Project
                          </Button>
                        </Link>
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
        <StudentProfileEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchProfile}
          profile={profile}
        />
      )}
    </>
  );
}
