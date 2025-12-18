"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  Upload,
  CheckCircle,
  Loader2,
  X,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { uploadFile } from "@/lib/appwrite";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import React from "react";

// Form validation schema
const researchPaperSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200),
  abstract: z.string().min(50, "Abstract must be at least 50 characters").max(2000),
  keywords: z.array(z.string()).min(1, "Add at least one keyword").max(10),
  reviewedById: z.string().optional(),
  memberIds: z.array(z.string()),
  documentUrl: z.string().min(1, "Research paper document is required"),
  imageUrl: z.string().optional().or(z.literal("")),
});

type ResearchPaperFormValues = z.infer<typeof researchPaperSchema>;

const STEPS = [
  { id: 1, name: "Basic Info", icon: FileText },
  { id: 2, name: "Authors", icon: Users },
  { id: 3, name: "Documents", icon: Upload },
  { id: 4, name: "Review", icon: CheckCircle },
];

interface Teacher {
  id: string; // TeacherProfile ID
  userId: string; // User ID
  name: string;
  email: string;
  department?: string;
  designation?: string;
  type: 'teacher';
}

interface Student {
  id: string;
  name: string;
  email: string;
  type: 'student';
}

type Member = Teacher | Student;

export default function ResearchPaperUploadPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  // Selected items stored with full details
  const [selectedReviewer, setSelectedReviewer] = useState<Teacher | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  
  // Search results
  const [reviewerSearchResults, setReviewerSearchResults] = useState<Teacher[]>([]);
  const [memberSearchResults, setMemberSearchResults] = useState<Member[]>([]);
  
  // Loading states
  const [loadingReviewerSearch, setLoadingReviewerSearch] = useState(false);
  const [loadingMemberSearch, setLoadingMemberSearch] = useState(false);
  
  
  // Search query states
  const [reviewerSearchQuery, setReviewerSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const form = useForm<ResearchPaperFormValues>({
    resolver: zodResolver(researchPaperSchema),
    defaultValues: {
      title: "",
      abstract: "",
      keywords: [],
      reviewedById: "",
      memberIds: [],
      documentUrl: "",
      imageUrl: "",
    },
  });

  // Search for reviewers (teachers only)
  const searchReviewer = async (query: string) => {
    setReviewerSearchQuery(query);
    
    if (!query || query.length < 1) {
      setReviewerSearchResults([]);
      return;
    }

    setLoadingReviewerSearch(true);
    try {
      const params = new URLSearchParams({
        limit: "20",
        search: query,
      });
      const response = await axios.get(`/api/teacher?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data.data)) {
        const mappedTeachers: Teacher[] = response.data.data
          .filter((teacher: any) => teacher.user)
          .map((teacher: any) => ({
            id: teacher.id,
            userId: teacher.user.id,
            name: teacher.user.name,
            email: teacher.user.email,
            department: teacher.department,
            designation: teacher.designation,
            type: 'teacher' as const,
          }));
        setReviewerSearchResults(mappedTeachers);
      }
    } catch (error) {
      console.error("Error searching reviewers:", error);
    } finally {
      setLoadingReviewerSearch(false);
    }
  };

  // Search for members (teachers and students)
  const searchMembers = async (query: string) => {
    setMemberSearchQuery(query);
    
    if (!query || query.length < 1) {
      setMemberSearchResults([]);
      return;
    }

    setLoadingMemberSearch(true);
    try {
      const [teachersRes, studentsRes] = await Promise.all([
        axios.get(`/api/teacher?${new URLSearchParams({ limit: "10", search: query }).toString()}`),
        axios.get(`/api/student?${new URLSearchParams({ limit: "10", search: query }).toString()}`),
      ]);

      const teachers: Teacher[] = (teachersRes.data?.data || [])
        
        .map((teacher: any) => ({
          id: teacher.id,
          userId: teacher.user.id,
          name: teacher.user.name,
          email: teacher.user.email,
          department: teacher.department,
          designation: teacher.designation,
          type: 'teacher' as const,
        }));

      const students: Student[] = (studentsRes.data?.data || [])
        .filter((student: any) => student.user && student.user.id !== session?.user?.id)
        .map((student: any) => ({
          id: student.user.id,
          name: student.user.name,
          email: student.user.email,
          type: 'student' as const,
        }));

      setMemberSearchResults([...teachers, ...students] as Member[]);
      console.log("Member search results:", [...teachers, ...students]);
    } catch (error) {
      console.error("Error searching members:", error);
    } finally {
      setLoadingMemberSearch(false);
    }
  };

  const handleAddKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !form.getValues("keywords").includes(keyword)) {
      const currentKeywords = form.getValues("keywords");
      if (currentKeywords.length < 10) {
        form.setValue("keywords", [...currentKeywords, keyword], {
          shouldValidate: true,
        });
        setKeywordInput("");
      } else {
        toast.error("Maximum 10 keywords allowed");
      }
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    const currentKeywords = form.getValues("keywords");
    form.setValue(
      "keywords",
      currentKeywords.filter((k) => k !== keyword),
      { shouldValidate: true }
    );
  };

  const uploadDocument = async (file: File): Promise<string> => {
    try {
      const url = await uploadFile(file);
      return url;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error("Failed to upload document");
    }
  };

  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        const result = await form.trigger(["title", "abstract", "keywords"]);
        
        if (!result) {
          const errors = form.formState.errors;
          if (errors.title) {
            toast.error(errors.title.message || "Title is required");
          } else if (errors.abstract) {
            toast.error(errors.abstract.message || "Abstract is required");
          } else if (errors.keywords) {
            toast.error(errors.keywords.message || "At least one keyword is required");
          }
          return false;
        }
        
        // Additional check for actual values
        const values = form.getValues();
        if (!values.title || values.title.length < 10) {
          toast.error("Title must be at least 10 characters");
          return false;
        }
        if (!values.abstract || values.abstract.length < 50) {
          toast.error("Abstract must be at least 50 characters");
          return false;
        }
        if (!values.keywords || values.keywords.length === 0) {
          toast.error("Please add at least one keyword");
          return false;
        }
        
        return true;
        
      case 2:
        // Step 2 is optional, so always valid
        return true;
        
      case 3:
        // Document upload is required
        if (!documentFile) {
          toast.error("Please upload your research paper document (PDF)");
          return false;
        }
        
        // Validate file type
        if (!documentFile.type.includes('pdf') && !documentFile.name.toLowerCase().endsWith('.pdf')) {
          toast.error("Research paper must be a PDF file");
          return false;
        }
        
        // Validate file size (15MB)
        const maxDocSize = 15 * 1024 * 1024;
        if (documentFile.size > maxDocSize) {
          toast.error("Research paper file size must be less than 15MB");
          return false;
        }
        
        // Validate image file size if uploaded (10MB)
        if (imageFile) {
          const maxImgSize = 10 * 1024 * 1024;
          if (imageFile.size > maxImgSize) {
            toast.error("Cover image file size must be less than 10MB");
            return false;
          }
        }
        
        return true;
        
      default:
        return true;
    }
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) {
      return; // Don't proceed if validation fails
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: ResearchPaperFormValues) => {
    setIsSubmitting(true);

    try {
      // Validate document file is present
      if (!documentFile) {
        toast.error("Please upload your research paper document (PDF)");
        setIsSubmitting(false);
        return;
      }

      // Upload document if present
      if (documentFile) {
        toast.loading("Uploading document...");
        const documentUrl = await uploadDocument(documentFile);
        data.documentUrl = documentUrl;
        toast.dismiss();
      }

      // Upload image if present
      if (imageFile) {
        toast.loading("Uploading image...");
        const imageUrl = await uploadDocument(imageFile);
        data.imageUrl = imageUrl;
        toast.dismiss();
      }

      // Get actual member IDs from selectedMembers state (not from form data)
      const actualMemberIds = selectedMembers.map(member => 
        member.type === 'teacher' ? (member as Teacher).userId : member.id
      );

      // Clean up the payload - remove empty strings and ensure proper structure
      const payload = {
        title: data.title,
        abstract: data.abstract || undefined,
        keywords: data.keywords,
        documentUrl: data.documentUrl || undefined,
        imageUrl: data.imageUrl || undefined,
        reviewedById: selectedReviewer?.id || undefined,
        memberIds: actualMemberIds,
      };


      // Submit the form
      const response = await axios.post("/api/research-paper", payload);

      if (response.data.success) {
        toast.success("Research paper created successfully!");
        
      } else {
        throw new Error(response.data.error || "Failed to create research paper");

      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to create research paper");
    } finally {
      setIsSubmitting(false);
      form.reset();
      router.push("/dashboard/student/projects");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--third-color)] font-semibold">Research Paper Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your research paper title"
                      className="bg-[var(--forth-color)] border-[var(--third-color)]/30 text-[var(--first-color)] placeholder:text-[var(--first-color)]/50 focus:border-[var(--third-color)] focus:shadow-[0_0_10px_rgba(100,204,197,0.3)] transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[var(--forth-color)]/70">
                    Provide a clear and descriptive title for your research paper
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abstract"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--third-color)] font-semibold">Abstract *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write a brief abstract summarizing your research..."
                      className="min-h-[200px] bg-[var(--forth-color)] border-[var(--third-color)]/30 text-[var(--first-color)] placeholder:text-[var(--first-color)]/50 focus:border-[var(--third-color)] focus:shadow-[0_0_10px_rgba(100,204,197,0.3)] transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[var(--forth-color)]/70">
                    Minimum 50 characters, maximum 2000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--third-color)] font-semibold">Keywords *</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a keyword"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                      className="bg-[var(--forth-color)] border-[var(--third-color)]/30 text-[var(--first-color)] placeholder:text-[var(--first-color)]/50 focus:border-[var(--third-color)] focus:shadow-[0_0_10px_rgba(100,204,197,0.3)] transition-all"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddKeyword}
                      className="border-[var(--third-color)]/50 text-[var(--third-color)] hover:bg-[var(--third-color)]/20 hover:shadow-[0_0_10px_rgba(100,204,197,0.3)] transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription className="text-[var(--forth-color)]/70">
                    Add keywords relevant to your research (max 10)
                  </FormDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.value.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="flex items-center gap-1 bg-[var(--third-color)]/20 text-[var(--third-color)] border border-[var(--third-color)]/40 shadow-[0_0_8px_rgba(100,204,197,0.2)] hover:shadow-[0_0_12px_rgba(100,204,197,0.4)] transition-all"
                      >
                        <span>{keyword}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveKeyword(keyword);
                          }}
                          className="hover:bg-secondary-foreground/10 rounded-full p-0.5 ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="reviewedById"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faculty Reviewer (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {/* Search Input */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-[var(--second-color)]/20 border-[var(--third-color)]/30 text-[var(--forth-color)] hover:bg-[var(--third-color)]/10 hover:border-[var(--third-color)] hover:shadow-[0_0_10px_rgba(100,204,197,0.3)] transition-all"
                          >
                            <Users className="mr-2 h-4 w-4" />
                            {selectedReviewer ? (
                              <span>{selectedReviewer.name}</span>
                            ) : (
                              <span className="text-[var(--forth-color)]/50">Type to search for a reviewer...</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search by name or email..."
                              onValueChange={(value) => {
                                searchReviewer(value);
                              }}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {loadingReviewerSearch 
                                  ? "Searching..." 
                                  : reviewerSearchQuery.length > 0
                                  ? "No reviewers found"
                                  : "Type to search for reviewers"}
                              </CommandEmpty>
                              {reviewerSearchResults.length > 0 && (
                                <CommandGroup>
                                  {reviewerSearchResults.map((teacher) => (
                                    <CommandItem
                                      key={teacher.id}
                                      value={teacher.id}
                                      onSelect={() => {
                                        setSelectedReviewer(teacher);
                                        field.onChange(teacher.id);
                                        setReviewerSearchResults([]);
                                        setReviewerSearchQuery("");
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{teacher.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {teacher.email} {teacher.designation && `• ${teacher.designation}`}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Selected Reviewer */}
                      {selectedReviewer && (
                        <div className="flex items-center justify-between p-3 border-2 border-[var(--third-color)]/40 rounded-lg bg-[var(--second-color)]/30 shadow-[0_0_15px_rgba(100,204,197,0.2)]">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{selectedReviewer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {selectedReviewer.email}
                              {selectedReviewer.designation && ` • ${selectedReviewer.designation}`}
                              {selectedReviewer.department && ` • ${selectedReviewer.department}`}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReviewer(null);
                              field.onChange("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Search and select a faculty member to review your research paper
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="memberIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Co-Authors / Team Members</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {/* Search Input */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            <span className="text-muted-foreground">Type to search and add members...</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search by name or email..."
                              onValueChange={(value) => {
                                searchMembers(value);
                              }}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {loadingMemberSearch 
                                  ? "Searching..." 
                                  : memberSearchQuery.length > 0
                                  ? "No members found"
                                  : "Type to search for members"}
                              </CommandEmpty>
                              {memberSearchResults.length > 0 && (
                                <CommandGroup>
                                  {memberSearchResults
                                    .filter((member) => {
                                      const memberId = member.type === 'teacher' ? (member as Teacher).userId : member.id;
                                      return !selectedMembers.some((m) => {
                                        const mId = m.type === 'teacher' ? (m as Teacher).userId : m.id;
                                        return mId === memberId;
                                      });
                                    })
                                    .map((member) => {
                                      const memberId = member.type === 'teacher' ? (member as Teacher).userId : member.id;
                                      return (
                                        <CommandItem
                                          key={memberId}
                                          value={memberId}
                                          onSelect={() => {
                                            const newMember = member;
                                            setSelectedMembers([...selectedMembers, newMember]);
                                            const currentIds = field.value || [];
                                            field.onChange([...currentIds, memberId]);
                                            setMemberSearchResults([]);
                                            setMemberSearchQuery("");
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">
                                              {member.name}
                                              <Badge variant="outline" className="ml-2 text-xs">
                                                {member.type === 'teacher' ? 'Faculty' : 'Student'}
                                              </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                              {member.email}
                                              {member.type === 'teacher' && (member as Teacher).designation && ` • ${(member as Teacher).designation}`}
                                            </div>
                                          </div>
                                        </CommandItem>
                                      );
                                    })}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Selected Members */}
                      {selectedMembers.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Selected Members ({selectedMembers.length})</div>
                          {selectedMembers.map((member) => {
                            const memberId = member.type === 'teacher' ? (member as Teacher).userId : member.id;
                            return (
                              <div
                                key={memberId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium flex items-center gap-2">
                                    {member.name}
                                    <Badge variant="secondary" className="text-xs">
                                      {member.type === 'teacher' ? 'Faculty' : 'Student'}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {member.email}
                                    {member.type === 'teacher' && (member as Teacher).designation && ` • ${(member as Teacher).designation}`}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMembers(selectedMembers.filter((m) => {
                                      const mId = m.type === 'teacher' ? (m as Teacher).userId : m.id;
                                      return mId !== memberId;
                                    }));
                                    const currentIds = field.value || [];
                                    field.onChange(currentIds.filter((id) => id !== memberId));
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Search and select faculty or students who contributed to this research paper
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <FormLabel className="text-[var(--third-color)] font-semibold">Research Paper Document *</FormLabel>
              <FormDescription className="mb-4 text-[var(--forth-color)]/70">
                Upload your research paper in PDF format (max 15MB, required)
              </FormDescription>
              <FileUpload
                accept=".pdf,application/pdf"
                maxSize={15 * 1024 * 1024}
                onChange={(files) => {
                  if (files && files[0]) {
                    setDocumentFile(files[0]);
                    // Set a temporary placeholder value to pass validation
                    form.setValue("documentUrl", "pending-upload");
                    toast.success("Document selected: " + files[0].name);
                  }
                }}
              />
            </div>

            <div>
              <FormLabel className="text-[var(--third-color)] font-semibold">Cover Image (Optional)</FormLabel>
              <FormDescription className="mb-4 text-[var(--forth-color)]/70">
                Upload a cover image for your research paper (max 10MB)
              </FormDescription>
              <FileUpload
                accept="image/*"
                maxSize={10 * 1024 * 1024}
                onChange={(files) => {
                  if (files && files[0]) {
                    setImageFile(files[0]);
                    toast.success("Image selected: " + files[0].name);
                  }
                }}
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="rounded-lg border-2 border-[var(--third-color)]/40 bg-[var(--second-color)]/20 p-6 space-y-4 shadow-[0_0_20px_rgba(100,204,197,0.2)]">
              <h3 className="font-semibold text-xl text-[var(--third-color)]">Review Your Submission</h3>
              
              <div>
                <div className="text-sm font-medium text-[var(--third-color)]/80">Title</div>
                <div className="mt-1 text-[var(--forth-color)] font-medium">{form.getValues("title")}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-[var(--third-color)]/80">Abstract</div>
                <div className="mt-1 text-sm line-clamp-3">{form.getValues("abstract")}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Keywords</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {form.getValues("keywords").map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedReviewer && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Reviewer</div>
                  <div className="mt-1">{selectedReviewer.name}</div>
                </div>
              )}

              {selectedMembers.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Co-Authors / Team Members</div>
                  <div className="mt-2 space-y-1">
                    {selectedMembers.map((member) => {
                      const memberType = member.type === 'teacher' ? "Faculty" : "Student";
                      const memberId = member.type === 'teacher' ? (member as Teacher).userId : member.id;
                      return (
                        <div key={memberId} className="text-sm">
                          • {member.name} <span className="text-muted-foreground">({memberType})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-muted-foreground">Attachments</div>
                <div className="mt-2 space-y-1">
                  {documentFile && (
                    <div className="text-sm">• Document: {documentFile.name}</div>
                  )}
                  {imageFile && (
                    <div className="text-sm">• Cover Image: {imageFile.name}</div>
                  )}
                  {!documentFile && !imageFile && (
                    <div className="text-sm text-muted-foreground">No files attached</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[var(--third-color)]/10 border-2 border-[var(--third-color)]/40 rounded-lg p-4 shadow-[0_0_15px_rgba(100,204,197,0.2)]">
              <p className="text-sm text-[var(--third-color)] font-medium">
                Please review all information carefully before submitting. Your research paper will be saved as a draft and can be edited later.
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen  ">
      <div className="mb-8 flex items-center justify-between">
        <div className="text-left flex-1">
          <h1 className="text-4xl font-bold text-[var(--forth-color)] drop-shadow-[0_0_15px_rgba(100,204,197,0.5)]">
            Upload Research Paper
          </h1>
          <p className="text-[var(--third-color)] mt-3 text-lg font-medium">
            Submit your research paper for review and publication
          </p>
        </div>
        
        {/* Circular Progress Bar */}
        <motion.div 
          className="relative flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="w-24 h-24 transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="var(--second-color)"
              strokeWidth="6"
              fill="none"
              opacity="0.3"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="48"
              cy="48"
              r="40"
              stroke="var(--third-color)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={251.2}
              initial={{ strokeDashoffset: 251.2 }}
              animate={{ 
                strokeDashoffset: 251.2 - (251.2 * progressPercentage) / 100
              }}
              transition={{ 
                duration: 0.8, 
                ease: "easeInOut" 
              }}
              style={{
                filter: "drop-shadow(0 0 8px rgba(100,204,197,0.6))"
              }}
            />
          </svg>
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center"
            key={currentStep}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-2xl font-bold text-[var(--third-color)] drop-shadow-[0_0_8px_rgba(100,204,197,0.4)]">
              {Math.round(progressPercentage)}%
            </span>
            <span className="text-xs text-[var(--forth-color)]/70">Complete</span>
          </motion.div>
        </motion.div>
      </div>

    {/* Progress Bar */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        
        
        return (
          <React.Fragment key={step.id}>
            <motion.div 
              className="flex flex-col items-center relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: isCurrent ? 1.1 : 1, 
                opacity: 1 
              }}
              transition={{ 
                duration: 0.4,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
            >
          <motion.div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border-2 relative",
              isCompleted && "bg-[var(--third-color)] border-[var(--third-color)]",
              isCurrent && "bg-[var(--third-color)]/20 border-[var(--third-color)]",
              !isCompleted && !isCurrent && "bg-[var(--first-color)] border-[var(--third-color)]/30"
            )}
            animate={{
              boxShadow: isCompleted 
                ? "0 0 20px rgba(100,204,197,0.5)" 
                : isCurrent 
                  ? "0 0 15px rgba(100,204,197,0.4)"
                  : "0 0 0px rgba(100,204,197,0)"
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{
                rotate: isCurrent ? [0, 360] : 0,
                scale: isCompleted ? [1, 1.2, 1] : 1
              }}
              transition={{
                rotate: { duration: 2, repeat: isCurrent ? Infinity : 0, ease: "linear" },
                scale: { duration: 0.3 }
              }}
            >
              <StepIcon
                className={cn(
              "w-5 h-5 transition-all duration-300",
              isCompleted && "text-[var(--first-color)]",
              isCurrent && "text-[var(--third-color)]",
              !isCompleted && !isCurrent && "text-[var(--forth-color)]/50"
                )}
              />
            </motion.div>
            
          </motion.div>
          <motion.span
            className={cn(
              " mt-2 text-xs font-medium",
              (isCompleted || isCurrent) && "text-[var(--third-color)]",
              !isCompleted && !isCurrent && "text-[var(--forth-color)]/50"
            )}
            animate={{
              scale: isCurrent ? 1.05 : 1,
              fontWeight: isCurrent ? 600 : 500
            }}
            transition={{ duration: 0.3 }}
          >
            {step.name}
          </motion.span>
            </motion.div>
            {index < STEPS.length - 1 && (
          <div className="flex-1 h-0.5 mx-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[var(--third-color)]/20" />
            <motion.div
              className="absolute inset-0 bg-[var(--third-color)] shadow-[0_0_10px_rgba(100,204,197,0.4)]"
              initial={{ width: "0%" }}
              animate={{ 
                width: isCompleted ? "100%" : "0%"
              }}
              transition={{ 
                duration: 0.8,
                ease: "easeInOut",
                delay: isCompleted ? 0.2 : 0
              }}
            />
          </div>
            )}
          </React.Fragment>
        );
          })}
        </div>
      </motion.div>

      {/* Form Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ 
          duration: 0.4,
          ease: "easeOut"
        }}
      >
      <Card className="bg-[var(--first-color)]/95 border-2 border-[var(--third-color)]/30 shadow-[0_0_30px_rgba(100,204,197,0.2)] backdrop-blur-sm">
        <CardHeader className="border-b border-[var(--third-color)]/20">
          <CardTitle className="text-2xl text-[var(--third-color)] font-bold">{STEPS[currentStep - 1].name}</CardTitle>
          <CardDescription className="text-[var(--forth-color)]/80">
            {currentStep === 1 && "Provide the basic information about your research paper"}
            {currentStep === 2 && "Add reviewers and team members"}
            {currentStep === 3 && "Upload your research paper and supporting documents"}
            {currentStep === 4 && "Review and submit your research paper"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-[var(--third-color)]/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSubmitting}
                  className="border-[var(--third-color)]/50 text-[var(--third-color)] hover:bg-[var(--third-color)]/20 hover:shadow-[0_0_15px_rgba(100,204,197,0.3)] transition-all disabled:opacity-50"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="bg-[var(--third-color)] text-[var(--first-color)] hover:bg-[var(--third-color)]/90 shadow-[0_0_20px_rgba(100,204,197,0.4)] hover:shadow-[0_0_25px_rgba(100,204,197,0.6)] transition-all font-semibold"
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-[var(--third-color)] to-[var(--second-color)] text-[var(--first-color)] hover:from-[var(--third-color)]/90 hover:to-[var(--second-color)]/90 shadow-[0_0_25px_rgba(100,204,197,0.5)] hover:shadow-[0_0_30px_rgba(100,204,197,0.7)] transition-all font-bold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Research Paper"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}