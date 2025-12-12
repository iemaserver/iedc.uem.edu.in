"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User } from "lucide-react";
import toast from "react-hot-toast";
import { uploadFile } from "@/lib/appwrite";

const studentProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rollNumber: z.string().min(1, "Roll number is required"),
  batch: z.string().min(1, "Batch is required"),
  year: z.string().min(1, "Year is required"),
  section: z.string().min(1, "Section is required"),
  department: z.string().min(1, "Department is required"),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

type StudentProfileFormData = z.infer<typeof studentProfileSchema>;

interface StudentProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  profile: any;
}

export function StudentProfileEditDialog({
  open,
  onOpenChange,
  onSuccess,
  profile,
}: StudentProfileEditDialogProps) {
  const { update } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(profile?.image || "");

  const form = useForm<StudentProfileFormData>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      name: profile?.name || "",
      rollNumber: profile?.studentProfile?.rollNumber || "",
      batch: profile?.studentProfile?.batch || "",
      year: profile?.studentProfile?.year?.toString() || "",
      section: profile?.studentProfile?.section || "",
      department: profile?.studentProfile?.department || "",
      phoneNumber: profile?.studentProfile?.phoneNumber || "",
      address: profile?.studentProfile?.address || "",
      bio: profile?.studentProfile?.bio || "",
    },
  });

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      setIsUploadingImage(true);

      const imageUrl = await uploadFile(file);
      setImagePreview(imageUrl);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile image");
      }

      toast.success("Profile image updated successfully!");
      await update();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
      setImagePreview(profile?.image || "");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (data: StudentProfileFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        name: data.name,
        studentProfile: {
          rollNumber: data.rollNumber,
          batch: data.batch,
          year: parseInt(data.year),
          section: data.section,
          department: data.department,
          phoneNumber: data.phoneNumber || null,
          address: data.address || null,
          bio: data.bio || null,
        },
      };

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      await update();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        {/* Gradient Header with Decorative Pattern */}
        <div className="relative px-6 py-8 overflow-hidden" style={{
          background: `linear-gradient(135deg, var(--first-color), var(--second-color))`,
        }}>
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full" style={{ background: 'white' }}></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full" style={{ background: 'white' }}></div>
          </div>
          
          <div className="relative flex mb-10 items-center gap-4">
            <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white mb-1">
                Edit Student Profile
              </DialogTitle>
              <DialogDescription className="text-white/90 text-sm">
                Update your personal and academic information
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Profile Image Section */}
        <div className="flex justify-center py-6 px-6 border-b" style={{ borderColor: 'var(--forth-color)' }}>
          <div className="relative">
            <Avatar className="h-28 w-28 border-4 transition-all duration-300" style={{ 
              borderColor: 'var(--first-color)',
              boxShadow: `0 0 20px ${imagePreview ? 'rgba(var(--first-color), 0.3)' : 'transparent'}`
            }}>
              <AvatarImage src={imagePreview} alt={profile?.name} />
              <AvatarFallback className="text-2xl font-semibold" style={{ 
                background: 'linear-gradient(135deg, var(--first-color), var(--second-color))',
                color: 'white'
              }}>
                {profile?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <label htmlFor="profile-image-upload-student" className="absolute bottom-0 right-0 p-2 rounded-full cursor-pointer transition-all duration-200 hover:scale-110" style={{
              background: 'linear-gradient(135deg, var(--first-color), var(--second-color))',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              {isUploadingImage ? (
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              ) : (
                <Camera className="h-4 w-4 text-white" />
              )}
              <input
                id="profile-image-upload-student"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploadingImage}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Scrollable Form Content with Custom Scrollbar */}
        <div className="flex-1 overflow-y-auto px-6 py-6" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `var(--first-color) var(--forth-color)`,
        }}>
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 8px;
            }
            div::-webkit-scrollbar-track {
              background: var(--forth-color);
              border-radius: 10px;
            }
            div::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, var(--first-color), var(--second-color));
              border-radius: 10px;
              transition: all 0.3s ease;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, var(--second-color), var(--first-color));
            }
          `}</style>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information Section */}
              <div className="relative rounded-lg p-5 border" style={{
                background: 'linear-gradient(to right, rgba(var(--first-color-rgb), 0.02), rgba(var(--second-color-rgb), 0.02))',
                borderColor: 'var(--forth-color)'
              }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{
                  background: 'linear-gradient(to bottom, var(--first-color), var(--second-color))'
                }}></div>
                
                <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--forth-color)' }}>
                  <div className="h-2 w-2 rounded-full" style={{ background: 'var(--first-color)' }}></div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--first-color)' }}>
                    Personal Information
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Full Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter your full name" className="h-11 border-2 focus:border-opacity-50 transition-all" style={{ borderColor: 'var(--third-color)' }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Academic Details Section */}
              <div className="relative rounded-lg p-5 border" style={{
                background: 'linear-gradient(to right, rgba(var(--first-color-rgb), 0.02), rgba(var(--second-color-rgb), 0.02))',
                borderColor: 'var(--forth-color)'
              }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{
                  background: 'linear-gradient(to bottom, var(--first-color), var(--second-color))'
                }}></div>
                
                <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--forth-color)' }}>
                  <div className="h-2 w-2 rounded-full" style={{ background: 'var(--first-color)' }}></div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--first-color)' }}>
                    Academic Details
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rollNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Roll Number *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 21CSE001" className="h-11 border-2 focus:border-opacity-50 transition-all" style={{ borderColor: 'var(--third-color)' }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="batch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Batch *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 2021-2025" className="h-11 border-2 focus:border-opacity-50 transition-all" style={{ borderColor: 'var(--third-color)' }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Year *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 3" className="h-11 border-2 focus:border-opacity-50 transition-all" style={{ borderColor: 'var(--third-color)' }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Section *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., A" className="h-11 border-2 focus:border-opacity-50 transition-all" style={{ borderColor: 'var(--third-color)' }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Department *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., CSE" className="h-11 border-2 focus:border-opacity-50 transition-all" style={{ borderColor: 'var(--third-color)' }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="relative rounded-lg p-5 border" style={{
                background: 'linear-gradient(to right, rgba(var(--first-color-rgb), 0.02), rgba(var(--second-color-rgb), 0.02))',
                borderColor: 'var(--forth-color)'
              }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{
                  background: 'linear-gradient(to bottom, var(--first-color), var(--second-color))'
                }}></div>
                
                <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--forth-color)' }}>
                  <div className="h-2 w-2 rounded-full" style={{ background: 'var(--first-color)' }}></div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--first-color)' }}>
                    Contact Information
                  </h3>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+91 XXXXXXXXXX" className="h-11 border-2 focus:border-opacity-50 transition-all" style={{ borderColor: 'var(--third-color)' }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter your address" rows={3} className="border-2 focus:border-opacity-50 transition-all resize-none" style={{ borderColor: 'var(--third-color)' }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Bio</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Tell us about yourself" rows={4} className="border-2 focus:border-opacity-50 transition-all resize-none" style={{ borderColor: 'var(--third-color)' }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>

        {/* Gradient Footer with Action Buttons */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ 
          borderColor: 'var(--forth-color)',
          background: 'linear-gradient(to right, rgba(var(--first-color-rgb), 0.03), rgba(var(--second-color-rgb), 0.03))'
        }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="px-8 h-12 font-semibold border-2 transition-all hover:scale-105"
            style={{ borderColor: 'var(--third-color)' }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
            className="px-8 h-12 font-semibold transition-all hover:scale-105 hover:shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, var(--first-color), var(--second-color))',
              color: 'white'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
