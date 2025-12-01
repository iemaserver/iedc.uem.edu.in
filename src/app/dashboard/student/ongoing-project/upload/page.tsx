"use client";

import { useState } from "react";
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
  Calendar,
  GitBranch,
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

// Form validation schema
const ongoingProjectSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200),
  abstract: z.string().min(50, "Abstract must be at least 50 characters").max(2000),
  keywords: z.array(z.string()).min(1, "Add at least one keyword").max(10),
  advisorIds: z.array(z.string()),
  memberIds: z.array(z.string()),
  documentUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  repositoryUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
});

type OngoingProjectFormValues = z.infer<typeof ongoingProjectSchema>;

const STEPS = [
  { id: 1, name: "Basic Info", icon: FileText },
  { id: 2, name: "Team", icon: Users },
  { id: 3, name: "Documents", icon: Upload },
  { id: 4, name: "Review", icon: CheckCircle },
];

interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  type: "teacher";
}

interface Student {
  id: string;
  name: string;
  email: string;
  type: "student";
}

type Member = Teacher | Student;

export default function OngoingProjectUploadPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  
  // Selected items
  const [selectedAdvisors, setSelectedAdvisors] = useState<Teacher[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  
  // Search results
  const [advisorSearchResults, setAdvisorSearchResults] = useState<Teacher[]>([]);
  const [memberSearchResults, setMemberSearchResults] = useState<Member[]>([]);
  
  // Loading states
  const [loadingAdvisorSearch, setLoadingAdvisorSearch] = useState(false);
  const [loadingMemberSearch, setLoadingMemberSearch] = useState(false);
  
  // Search query states
  const [advisorSearchQuery, setAdvisorSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const form = useForm<OngoingProjectFormValues>({
    resolver: zodResolver(ongoingProjectSchema),
    defaultValues: {
      title: "",
      abstract: "",
      keywords: [],
      advisorIds: [],
      memberIds: [],
      documentUrl: "",
      imageUrl: "",
      repositoryUrl: "",
      startDate: "",
      expectedEndDate: "",
    },
  });

  // Search for advisors (teachers only)
  const searchAdvisor = async (query: string) => {
    setAdvisorSearchQuery(query);
    
    if (!query || query.length < 1) {
      setAdvisorSearchResults([]);
      return;
    }

    setLoadingAdvisorSearch(true);
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
            type: "teacher" as const,
          }));
        setAdvisorSearchResults(mappedTeachers);
      }
    } catch (error) {
      console.error("Error searching advisors:", error);
    } finally {
      setLoadingAdvisorSearch(false);
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
          type: "teacher" as const,
        }));

      const students: Student[] = (studentsRes.data?.data || [])
        .filter((student: any) => student.user && student.user.id !== session?.user?.id)
        .map((student: any) => ({
          id: student.user.id,
          name: student.user.name,
          email: student.user.email,
          type: "student" as const,
        }));

      setMemberSearchResults([...teachers, ...students] as Member[]);
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
    let isValid = true;

    switch (step) {
      case 1:
        await form.trigger(["title", "abstract", "keywords", "repositoryUrl", "startDate", "expectedEndDate"]);
        const errors1 = form.formState.errors;
        isValid = !errors1.title && !errors1.abstract && !errors1.keywords && !errors1.repositoryUrl;
        break;
      case 2:
        isValid = true;
        break;
      case 3:
        isValid = true;
        break;
    }

    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: OngoingProjectFormValues) => {
    setIsSubmitting(true);

    try {
      if (documentFile) {
        toast.loading("Uploading document...");
        const documentUrl = await uploadDocument(documentFile);
        data.documentUrl = documentUrl;
        toast.dismiss();
      }

      if (imageFile) {
        toast.loading("Uploading image...");
        const imageUrl = await uploadDocument(imageFile);
        data.imageUrl = imageUrl;
        toast.dismiss();
      }

      const actualAdvisorIds = selectedAdvisors.map(advisor => advisor.userId);
      const actualMemberIds = selectedMembers.map(member => 
        member.type === 'teacher' ? (member as Teacher).userId : member.id
      );

      const payload = {
        title: data.title,
        abstract: data.abstract || undefined,
        keywords: data.keywords,
        documentUrl: data.documentUrl || undefined,
        imageUrl: data.imageUrl || undefined,
        repositoryUrl: data.repositoryUrl || undefined,
        startDate: data.startDate || undefined,
        expectedEndDate: data.expectedEndDate || undefined,
        advisorIds: actualAdvisorIds,
        memberIds: actualMemberIds,
      };

      console.log("Submitting payload:", payload);

      const response = await axios.post("/api/ongoing-project", payload);

      if (response.data.success) {
        toast.success("Project created successfully!");
        router.push("/dashboard/student/ongoing-project");
      } else {
        throw new Error(response.data.error || "Failed to create project");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
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
                  <FormLabel>Project Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your project title"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear and descriptive title for your project
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
                  <FormLabel>Project Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your project, its goals, and expected outcomes..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 50 characters, maximum 2000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repositoryUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository URL (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <GitBranch className="h-5 w-5 text-muted-foreground mt-2" />
                      <Input
                        placeholder="https://github.com/username/repo"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Link to your GitHub, GitLab, or other repository
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords / Technologies *</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a keyword or technology"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddKeyword}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>
                    Add keywords or technologies used (max 10)
                  </FormDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.value.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="flex items-center gap-1"
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
              name="advisorIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Advisors (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            <span className="text-muted-foreground">Type to search and add advisors...</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search by name or email..."
                              onValueChange={(value) => {
                                searchAdvisor(value);
                              }}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {loadingAdvisorSearch 
                                  ? "Searching..." 
                                  : advisorSearchQuery.length > 0
                                  ? "No advisors found"
                                  : "Type to search for advisors"}
                              </CommandEmpty>
                              {advisorSearchResults.length > 0 && (
                                <CommandGroup>
                                  {advisorSearchResults
                                    .filter((teacher) => !selectedAdvisors.some((a) => a.userId === teacher.userId))
                                    .map((teacher) => (
                                      <CommandItem
                                        key={teacher.id}
                                        value={teacher.id}
                                        onSelect={() => {
                                          setSelectedAdvisors([...selectedAdvisors, teacher]);
                                          const currentIds = field.value || [];
                                          field.onChange([...currentIds, teacher.userId]);
                                          setAdvisorSearchResults([]);
                                          setAdvisorSearchQuery("");
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

                      {selectedAdvisors.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Selected Advisors ({selectedAdvisors.length})</div>
                          {selectedAdvisors.map((advisor) => (
                            <div
                              key={advisor.userId}
                              className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{advisor.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {advisor.email}
                                  {advisor.designation && ` • ${advisor.designation}`}
                                  {advisor.department && ` • ${advisor.department}`}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAdvisors(selectedAdvisors.filter((a) => a.userId !== advisor.userId));
                                  const currentIds = field.value || [];
                                  field.onChange(currentIds.filter((id) => id !== advisor.userId));
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Search and select faculty members to advise your project
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
                  <FormLabel>Team Members</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
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
                                            setSelectedMembers([...selectedMembers, member]);
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
                    Search and select team members working on this project
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
              <FormLabel>Project Documentation</FormLabel>
              <FormDescription className="mb-4">
                Upload project documentation or proposal (optional)
              </FormDescription>
              <FileUpload
                onChange={(files) => {
                  if (files && files[0]) {
                    setDocumentFile(files[0]);
                    toast.success("Document selected: " + files[0].name);
                  }
                }}
              />
              {documentFile && (
                <div className="mt-2 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{documentFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDocumentFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <FormLabel>Cover Image (Optional)</FormLabel>
              <FormDescription className="mb-4">
                Upload a cover image or logo for your project
              </FormDescription>
              <FileUpload
                onChange={(files) => {
                  if (files && files[0]) {
                    setImageFile(files[0]);
                    toast.success("Image selected: " + files[0].name);
                  }
                }}
              />
              {imageFile && (
                <div className="mt-2 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{imageFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setImageFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
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
            <div className="rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold text-lg">Review Your Project</h3>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">Title</div>
                <div className="mt-1">{form.getValues("title")}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                <div className="mt-1 text-sm line-clamp-3">{form.getValues("abstract")}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Keywords / Technologies</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {form.getValues("keywords").map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              {form.getValues("repositoryUrl") && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Repository</div>
                  <div className="mt-1 text-sm text-blue-600 truncate">{form.getValues("repositoryUrl")}</div>
                </div>
              )}

              {(form.getValues("startDate") || form.getValues("expectedEndDate")) && (
                <div className="grid grid-cols-2 gap-4">
                  {form.getValues("startDate") && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Start Date</div>
                      <div className="mt-1 text-sm">{new Date(form.getValues("startDate")!).toLocaleDateString()}</div>
                    </div>
                  )}
                  {form.getValues("expectedEndDate") && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Expected End Date</div>
                      <div className="mt-1 text-sm">{new Date(form.getValues("expectedEndDate")!).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              )}

              {selectedAdvisors.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Advisors</div>
                  <div className="mt-2 space-y-1">
                    {selectedAdvisors.map((advisor) => (
                      <div key={advisor.userId} className="text-sm">
                        • {advisor.name} <span className="text-muted-foreground">({advisor.designation})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMembers.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Team Members</div>
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

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Please review all information carefully before submitting. Your project will be saved as a draft and can be edited later.
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Ongoing Project</h1>
        <p className="text-muted-foreground mt-2">
          Register and track your development project
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                        ? "border-primary text-primary"
                        : "border-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <StepIcon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="mt-2 text-xs font-medium text-center">
                    {step.name}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-4 transition-colors ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Provide the basic information about your project"}
            {currentStep === 2 && "Add advisors and team members"}
            {currentStep === 3 && "Upload project documentation and assets"}
            {currentStep === 4 && "Review and create your project"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>

              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSubmitting}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isSubmitting}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
