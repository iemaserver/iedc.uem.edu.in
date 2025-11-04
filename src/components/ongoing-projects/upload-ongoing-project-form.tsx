"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OngoingProjectStatus } from "@prisma/client";
import { Loader2, Upload, X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { MultiSelect } from "../ui/multi-select-new";
import { FileUpload } from "../ui/file-upload";
import { uploadFile } from "@/lib/appwrite";

const ongoingProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  abstract: z.string().optional(),
  keywords: z.array(z.string()),
  status: z.enum(['ONGOING', 'COMPLETED', 'ACCEPTED', 'REJECTED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  facultyAdvisorIds: z.array(z.string()),
  memberIds: z.array(z.string()),
  image: z.string().optional(),
  filepath: z.string().optional(),
});

type OngoingProjectFormData = z.infer<typeof ongoingProjectSchema>;

interface Faculty {
  id: string;
  fullName: string;
  email: string;
  designation?: string;
}

interface Student {
  id: string;
  user: {
    fullName: string;
    email: string;
  };
}

interface UploadOngoingProjectFormProps {
  onSuccess?: () => void;
  initialData?: Partial<OngoingProjectFormData>;
  isEditing?: boolean;
  projectId?: string;
}

export function UploadOngoingProjectForm({ 
  onSuccess, 
  initialData, 
  isEditing = false,
  projectId 
}: UploadOngoingProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [facultyMembers, setFacultyMembers] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
  const [keywordInput, setKeywordInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>(initialData?.filepath || "");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(initialData?.image || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<OngoingProjectFormData>({
    resolver: zodResolver(ongoingProjectSchema),
    defaultValues: {
      title: initialData?.title || "",
      abstract: initialData?.abstract || "",
      status: initialData?.status || "ONGOING",
      startDate: initialData?.startDate || "",
      endDate: initialData?.endDate || "",
      facultyAdvisorIds: initialData?.facultyAdvisorIds || [],
      memberIds: initialData?.memberIds || [],
      keywords: initialData?.keywords || [],
      image: initialData?.image || "",
      filepath: initialData?.filepath || "",
    }
  });

  useEffect(() => {
    fetchFacultyMembers();
    fetchStudents();
  }, []);

  useEffect(() => {
    setValue("keywords", keywords);
  }, [keywords, setValue]);

  const fetchFacultyMembers = async () => {
    try {
      const response = await axios.get("/api/general/users", { params: { userType: "TEACHER" } });
      setFacultyMembers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching faculty members:", error);
      toast.error("Failed to load faculty members");
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get("/api/general/users", { params: { userType: "STUDENT" } });
      setStudents(response.data.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    }
  };

  const onSubmit = async (data: OngoingProjectFormData) => {
    setIsLoading(true);
    try {
      const projectData = {
        ...data,
        keywords,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      };

      if (isEditing && projectId) {
        await axios.put(`/api/student/ongoing-projects/${projectId}`, projectData);
        toast.success("Ongoing project updated successfully!");
      } else {
        await axios.post("/api/student/ongoing-projects", projectData);
        toast.success("Ongoing project uploaded successfully!");
      }

      reset();
      setKeywords([]);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting ongoing project:", error);
      toast.error(error.response?.data?.message || "Failed to submit ongoing project");
    } finally {
      setIsLoading(false);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      const newKeywords = [...keywords, keywordInput.trim()];
      setKeywords(newKeywords);
      setKeywordInput("");
    }
  };

  const removeKeyword = (index: number) => {
    const newKeywords = keywords.filter((_, i) => i !== index);
    setKeywords(newKeywords);
    setValue("keywords", newKeywords);
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    
    try {
      const url = await uploadFile(file);
      setUploadedFileUrl(url);
      setValue("filepath", url);
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    
    try {
      const url = await uploadFile(file);
      setUploadedImageUrl(url);
      setValue("image", url);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const facultyOptions = facultyMembers.map(faculty => ({
    label: `${faculty.fullName} (${faculty.email})`,
    value: faculty.id
  }));

  const studentOptions = students.map(student => ({
    label: `${student.user.fullName} (${student.user.email})`,
    value: student.id
  }));

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Ongoing Project" : "Upload New Ongoing Project"}
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? "Update your ongoing project details and collaborate with faculty advisors"
            : "Upload your ongoing project and collaborate with faculty advisors"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter project title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <Label htmlFor="abstract">Abstract</Label>
            <Textarea
              id="abstract"
              {...register("abstract")}
              placeholder="Enter project abstract"
              rows={4}
              className={errors.abstract ? "border-red-500" : ""}
            />
            {errors.abstract && (
              <p className="text-sm text-red-500">{errors.abstract.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className={errors.startDate ? "border-red-500" : ""}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className={errors.endDate ? "border-red-500" : ""}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Project Status</Label>
            <Select
              onValueChange={(value) => setValue("status", value as "ONGOING" | "COMPLETED" | "ACCEPTED" | "REJECTED")}
              defaultValue={watch("status")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label>Keywords</Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add a keyword"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              />
              <Button type="button" onClick={addKeyword} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map((keyword, index) => (
                <Badge key={`${keyword}-${index}`} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-0 w-4 h-4 hover:bg-transparent"
                    onClick={() => removeKeyword(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Faculty Advisors */}
          <div className="space-y-2">
            <Label>Faculty Advisors</Label>
            <MultiSelect
              options={facultyOptions}
              onValueChange={(value: string[]) => setValue("facultyAdvisorIds", value)}
              defaultValue={watch("facultyAdvisorIds")}
              placeholder="Select faculty advisors"
              variant="inverted"
              maxCount={3}
            />
          </div>

          {/* Project Members */}
          <div className="space-y-2">
            <Label>Project Members</Label>
            <MultiSelect
              options={studentOptions}
              onValueChange={(value: string[]) => setValue("memberIds", value)}
              defaultValue={watch("memberIds")}
              placeholder="Select project members"
              variant="inverted"
              maxCount={5}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image">Project Image URL</Label>
            <Input
              id="image"
              {...register("image")}
              placeholder="Enter image URL (optional)"
              type="url"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Project File</Label>
            {uploadedFileUrl ? (
              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">File uploaded successfully</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadedFileUrl("");
                      setValue("filepath", "");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-green-600 mt-1 truncate">{uploadedFileUrl}</p>
              </div>
            ) : (
              <FileUpload
                onChange={handleFileUpload}
                fileTypes={[".pdf", ".doc", ".docx", ".zip", ".rar"]}
                maxSize={20 * 1024 * 1024} // 20MB
                className="border-2 border-dashed border-gray-300 rounded-lg"
              />
            )}
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading file...
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Upload project files (PDF, DOC, DOCX, ZIP, RAR - Max 20MB)
            </p>
          </div>

          {/* Image/Thumbnail */}
          <div className="space-y-2">
            <Label>Project Thumbnail</Label>
            {uploadedImageUrl ? (
              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">Image uploaded successfully</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadedImageUrl("");
                      setValue("image", "");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2">
                  <img 
                    src={uploadedImageUrl} 
                    alt="Project thumbnail" 
                    className="w-20 h-20 object-cover rounded border"
                  />
                </div>
              </div>
            ) : (
              <FileUpload
                onChange={handleImageUpload}
                fileTypes={[".jpg", ".jpeg", ".png", ".webp"]}
                maxSize={5 * 1024 * 1024} // 5MB
                className="border-2 border-dashed border-gray-300 rounded-lg"
              />
            )}
            <p className="text-sm text-muted-foreground">
              Upload a project thumbnail (JPG, PNG, WEBP - Max 5MB)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setKeywords([]);
                setUploadedFileUrl("");
                setUploadedImageUrl("");
              }}
              disabled={isLoading || isUploading}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isLoading || isUploading}>
              {(isLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {(isLoading || isUploading) 
                ? "Uploading..." 
                : "Upload Project"
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
