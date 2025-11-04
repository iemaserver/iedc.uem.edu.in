"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectType, ResearchPaperStatus } from "@prisma/client";
import toast from "react-hot-toast";
import axios from "axios";
import { MultiSelect } from "../ui/multi-select-new";
import { FileUpload } from "../ui/file-upload";
import { uploadFile } from "@/lib/appwrite";

const researchPaperSchema = z.object({
  title: z.string().min(1, "Title is required"),
  abstract: z.string().optional(),
  keywords: z.array(z.string()),
  projectType: z.enum(['PERSONAL', 'COLLABORATIVE', 'IN_IEDC']),
  facultyAdvisorIds: z.array(z.string()),
  memberIds: z.array(z.string()),
  image: z.string().optional(),
  fileUrl: z.string().optional(),
});

type ResearchPaperFormData = z.infer<typeof researchPaperSchema>;

interface Faculty {
  id: string;
  fullName: string;
  email: string;
  designation?: string;
}

interface Student {
  id: string;
  fullName: string;
  email: string;
  rollNumber?: string;
}

interface UploadResearchPaperFormProps {
  onSuccess?: () => void;
  initialData?: Partial<ResearchPaperFormData> & { id?: string };
  mode?: "create" | "edit";
}

export function UploadResearchPaperForm({ 
  onSuccess, 
  initialData, 
  mode = "create" 
}: UploadResearchPaperFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
  const [newKeyword, setNewKeyword] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>(initialData?.fileUrl || "");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(initialData?.image || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ResearchPaperFormData>({
    resolver: zodResolver(researchPaperSchema),
    defaultValues: {
      title: initialData?.title || "",
      abstract: initialData?.abstract || "",
      projectType: initialData?.projectType || "PERSONAL",
      facultyAdvisorIds: initialData?.facultyAdvisorIds || [],
      memberIds: initialData?.memberIds || [],
      keywords: initialData?.keywords || [],
      image: initialData?.image || "",
      fileUrl: initialData?.fileUrl || "",
    }
  });

  // Update form values when uploaded files change
  useEffect(() => {
    setValue("fileUrl", uploadedFileUrl);
  }, [uploadedFileUrl, setValue]);

  useEffect(() => {
    setValue("image", uploadedImageUrl);
  }, [uploadedImageUrl, setValue]);

  // Fetch faculties and students for selection
  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        const [facultiesRes, studentsRes] = await Promise.all([
          axios.get("/api/general/users", { params: { userType: "TEACHER" } }),
          axios.get("/api/general/users", { params: { userType: "STUDENT" } })
        ]);

        if (facultiesRes.data?.data) {
          setFaculties(facultiesRes.data.data.map((teacher: any) => ({
            id: teacher.id,
            fullName: teacher.fullName,
            email: teacher.email,
            designation: teacher.teacherProfile?.designation
          })));
        }

        if (studentsRes.data?.data) {
          setStudents(studentsRes.data.data.map((student: any) => ({
            id: student.id,
            fullName: student.fullName,
            email: student.email,
            rollNumber: student.studentProfile?.rollNumber
          })));
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users data");
      }
    };

    fetchUsersData();
  }, []);

  // Update keywords in form when keywords state changes
  useEffect(() => {
    setValue("keywords", keywords);
  }, [keywords, setValue]);

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    const updatedKeywords = keywords.filter(k => k !== keyword);
    setKeywords(updatedKeywords);
    setValue("keywords", updatedKeywords);
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    
    try {
      const url = await uploadFile(file);
      setUploadedFileUrl(url);
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
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ResearchPaperFormData) => {
    setIsLoading(true);
    try {
      const endpoint = mode === "edit" && initialData?.id 
        ? `/api/student/research-paper/${initialData.id}`
        : "/api/student/research-paper";
      
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await axios({
        method,
        url: endpoint,
        data: { 
          ...data, 
          keywords,
          fileUrl: uploadedFileUrl || data.fileUrl,
          image: uploadedImageUrl || data.image
        }
      });

      toast.success(
        mode === "edit" 
          ? "Research paper updated successfully!" 
          : "Research paper uploaded successfully!"
      );
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (mode === "create") {
        reset();
        setKeywords([]);
        setUploadedFileUrl("");
        setUploadedImageUrl("");
      }
    } catch (error: any) {
      console.error("Error submitting research paper:", error);
      const message = error.response?.data?.message || "Failed to submit research paper";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const facultyOptions = faculties.map(faculty => ({
    value: faculty.id,
    label: `${faculty.fullName} (${faculty.designation || "Faculty"})`,
  }));

  const studentOptions = students.map(student => ({
    value: student.id,
    label: `${student.fullName} ${student.rollNumber ? `(${student.rollNumber})` : ""}`,
  }));

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {mode === "edit" ? "Edit Research Paper" : "Upload Research Paper"}
        </CardTitle>
        <CardDescription>
          {mode === "edit" 
            ? "Update your research paper details" 
            : "Upload your research paper and collaborate with faculty advisors"}
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
              placeholder="Enter research paper title"
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
              placeholder="Enter research paper abstract"
              rows={4}
              className={errors.abstract ? "border-red-500" : ""}
            />
            {errors.abstract && (
              <p className="text-sm text-red-500">{errors.abstract.message}</p>
            )}
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="projectType">Project Type *</Label>
            <Select
              onValueChange={(value) => setValue("projectType", value as "PERSONAL" | "COLLABORATIVE" | "IN_IEDC")}
              defaultValue={watch("projectType")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERSONAL">Personal</SelectItem>
                <SelectItem value="COLLABORATIVE">Collaborative</SelectItem>
                <SelectItem value="IN_IEDC">In IEDC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label>Keywords</Label>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add a keyword"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              />
              <Button type="button" onClick={addKeyword} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={`${keyword}-${index}`} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-0 w-4 h-4 hover:bg-transparent"
                    onClick={() => removeKeyword(keyword)}
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

          {/* Project Members (for collaborative projects) */}
          {watch("projectType") !== "PERSONAL" && (
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
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Research Paper File *</Label>
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
                    onClick={() => setUploadedFileUrl("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-green-600 mt-1 truncate">{uploadedFileUrl}</p>
              </div>
            ) : (
              <FileUpload
                onChange={handleFileUpload}
                fileTypes={[".pdf", ".doc", ".docx"]}
                maxSize={10 * 1024 * 1024} // 10MB
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
              Upload your research paper (PDF, DOC, DOCX - Max 10MB)
            </p>
          </div>

          {/* Image/Thumbnail */}
          <div className="space-y-2">
            <Label>Thumbnail Image</Label>
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
                    onClick={() => setUploadedImageUrl("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2">
                  <img 
                    src={uploadedImageUrl} 
                    alt="Thumbnail preview" 
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
              Upload a thumbnail image (JPG, PNG, WEBP - Max 5MB)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
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
              {mode === "edit" ? "Update" : "Upload"} Research Paper
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
