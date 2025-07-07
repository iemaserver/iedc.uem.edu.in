"use client";

import React, { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { Check, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/appwrite";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  projectLink: z
    .string()
    .url({ message: "Please enter a valid URL." })
    .optional()
    .or(z.literal("")), // Allow empty string as a valid input
  projectImage: z
    .any()
    .refine((file) => !file || file instanceof File, {
      message: "Invalid file type. Please upload an image file.",
    })
    .optional(),
  projectType: z.string().optional(), // projectType is now optional in your model
  projectTags: z
    .array(z.string())
    .min(1, { message: "Please add at least one project tag." }),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date. Please select a date.",
  }),
  endDate: z
    .string()
    .refine(
      (date) => {
        // Allow empty string or valid date
        if (!date) return true;
        return !isNaN(Date.parse(date));
      },
      {
        message: "Invalid end date. Please select a date or leave empty.",
      }
    )
    .optional(), // endDate is optional in your model
  // Status is now handled by the ProjectStatus enum, which is mapped directly
  status: z.enum(["UPLOAD", "PUBLISH", "ONGOING", "COMPLETED", "CANCELLED"]),
  // Members and Faculty Advisors will now store user IDs (strings)
  members: z
    .array(z.string())
    .min(1, { message: "Please select at least one member." }),
  facultyAdvisorIds: z.array(z.string()).min(1, {
    message: "Please add at least one faculty advisor.",
  }),
  reviewerId: z.string().min(1, {
    message: "Reviewer ID is required.",
  }),
});

type FormSchema = z.infer<typeof formSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  userType: "STUDENT" | "FACULTY" | "ADMIN";
}

export default function OnGoingProjectForm() {
  const [step, setStep] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [uploading, setUploading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false); // Renamed from authorOpen for clarity
  const [reviewerOpen, setReviewerOpen] = useState(false);

  const form = useForm<FormSchema, any, FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      projectLink: "",
      projectImage: undefined,
      projectType: "", // Keep default as empty string for optional select
      projectTags: [],
      startDate: new Date().toISOString().split("T")[0],
      endDate: "", // Default to empty string for optional end date
      status: "UPLOAD",
      members: [], // Store member IDs
      facultyAdvisorIds: [], // Store faculty advisor IDs
      reviewerId: "", // Reviewer ID is required
    },
    mode: "onTouched",
  });

  const { register, handleSubmit, setValue, watch, trigger, formState, reset } =
    form;
  const { errors } = formState;

  // --- Fetch users on component mount ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/api/user?limit=500");
        setUsers(res.data.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load user data.");
      }
    };
    fetchUsers();
  }, []);

  // --- Keyword management ---
  const onKeywordAdd = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      const newKeywords = [...keywords, keywordInput.trim()];
      setKeywords(newKeywords);
      setValue("projectTags", newKeywords, { shouldValidate: true });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const updatedKeywords = keywords.filter((k) => k !== keywordToRemove);
    setKeywords(updatedKeywords);
    setValue("projectTags", updatedKeywords, { shouldValidate: true });
  };

  // --- Form submission handler ---
  const onSubmit = async (data: FormSchema) => {
    setUploading(true);
    try {
      let imageFilePath = null;
      if (data.projectImage) {
        // Show uploading toast for image
        toast.loading("Uploading image...", { id: "image-upload" });
        try {
          // Await the file upload and get the path
          imageFilePath = await uploadFile(data.projectImage);
          toast.success("Image uploaded successfully!", { id: "image-upload" });
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast.error("Failed to upload image", { id: "image-upload" });
          return;
        }
      }

      // Construct payload according to the API expected format
      const payload = {
        title: data.title,
        description: data.description,
        projectLink: data.projectLink || null, // Ensure null if empty string
        projectImage: imageFilePath,
        projectType: data.projectType || null, // Ensure null if empty string
        projectTags: data.projectTags,
        startDate: data.startDate,
        endDate: data.endDate || null, // Ensure null if empty string
        status: data.status,
        // Send user IDs as arrays to match backend expectations
        members: data.members,
        facultyAdvisors: data.facultyAdvisorIds, // Backend expects 'facultyAdvisors'
        reviewerId: data.reviewerId, // Ensure this is included
      };
      
      console.log("Submitting project:", payload);
      toast.loading("Creating project...", { id: "project-submit" });
      
      // Submit the project
      const res = await axios.post("/api/paper/ongoingProject", payload);
      console.log("Response from server:", res.data);
      
      toast.success("Ongoing project submitted successfully!", { id: "project-submit" });
      
      // Reset form after successful submission
      reset();
      setKeywords([]);
      setStep(1);
    } catch (err: any) {
      console.error("Submission error:", err);
      const errorMessage = err.response?.data?.error || err.message || "Submission failed. Please try again.";
      toast.error(errorMessage, { id: "project-submit" });
    } finally {
      setUploading(false);
    }
  };

  // --- Navigation logic for multi-step form ---
  const nextStep = async () => {
    let fieldsToValidate: (keyof FormSchema)[] = [];
    if (step === 1) {
      fieldsToValidate = [
        "title",
        "description",
        "projectLink",
        "projectType",
        "projectTags",
        "startDate",
        "endDate",
      ];
    } else if (step === 2) {
      fieldsToValidate = ["members", "facultyAdvisorIds", "reviewerId"]; // Updated field name
    }

    // Trigger validation for the fields in the current step
    const isValid = await trigger(fieldsToValidate);
    console.log("Validation result:", isValid, formState.errors);

    if (isValid) {
      setStep((prevStep) => prevStep + 1);
    } else {
      // Optional: Give feedback to the user if validation fails
      toast.error("Please fill out all required fields correctly.");
    }
  };

  const prevStep = () => {
    setStep((prevStep) => prevStep - 1);
  };

  // --- Filter users for different roles ---
  // Ensure faculty advisors are actual FACULTY users based on userType
  const faculties = users.filter((u) => u.userType !== "STUDENT");
  // Members can be any user type
  const allUsers = users;

  // --- Render logic for each step ---
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">
              Step 1: Ongoing Project Details
            </h3>
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter project title" {...register("title")} />
              </FormControl>
              <FormMessage>{errors.title?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a brief description of your project"
                  {...register("description")}
                />
              </FormControl>
              <FormMessage>{errors.description?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Project Link</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter project URL (optional)"
                  {...register("projectLink")}
                />
              </FormControl>
              <FormMessage>{errors.projectLink?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Project Type (optional)</FormLabel>
              <Select
                onValueChange={(value) =>
                  setValue("projectType", value, { shouldValidate: true })
                }
                value={watch("projectType") || ""} // Ensure controlled component
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="RESEARCH">Research</SelectItem>
                    <SelectItem value="DEVELOPMENT">Development</SelectItem>
                    <SelectItem value="DESIGN">Design</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage>{errors.projectType?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Upload Project Image (optional)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setValue("projectImage", file, { shouldValidate: true });
                    }
                  }}
                />
              </FormControl>
              {errors.projectImage && (
                <FormMessage>{String(errors.projectImage.message)}</FormMessage>
              )}
            </FormItem>

            <FormItem>
              <FormLabel>Project Tags</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add a tag and press Enter"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onKeywordAdd();
                    }
                  }}
                />
                <Button type="button" onClick={onKeywordAdd}>
                  Add
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap mt-2">
                {keywords.map((k, i) => (
                  <Badge
                    key={`keyword-${k}-${i}`}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeKeyword(k)}
                  >
                    {k}{" "}
                    <XCircle className="ml-1 h-3 w-3 inline-block opacity-70" />
                  </Badge>
                ))}
              </div>
              <FormMessage>{errors.projectTags?.message}</FormMessage>
            </FormItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...register("startDate")} />
                </FormControl>
                <FormMessage>{errors.startDate?.message}</FormMessage>
              </FormItem>

              <FormItem>
                <FormLabel>End Date (optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...register("endDate")} />
                </FormControl>
                <FormMessage>{errors.endDate?.message}</FormMessage>
              </FormItem>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={nextStep}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">
              Step 2: Members & Faculty Advisors
            </h3>

            <FormItem>
              <FormLabel>Members</FormLabel>
              <Popover open={memberOpen} onOpenChange={setMemberOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Select members
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search members..." />
                    <CommandEmpty>No members found.</CommandEmpty>
                    <CommandGroup>
                      {allUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => {
                            const selected = watch("members");
                            const updated = selected.includes(user.id) // Use user.id
                              ? selected.filter((id) => id !== user.id)
                              : [...selected, user.id];
                            setValue("members", updated, {
                              shouldValidate: true,
                            });
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              watch("members").includes(user.id) // Use user.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {user.name} ({user.email})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex gap-2 flex-wrap mt-2">
                {watch("members").map((memberId) => (
                  <Badge key={`member-${memberId}`}>
                    {users.find((u) => u.id === memberId)?.name || memberId}
                  </Badge>
                ))}
              </div>
              <FormMessage>{errors.members?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Faculty Advisors</FormLabel>
              <Popover open={advisorOpen} onOpenChange={setAdvisorOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Select Advisors
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search faculty..." />
                    <CommandEmpty>No faculty found.</CommandEmpty>
                    <CommandGroup>
                      {faculties.map((faculty) => (
                        <CommandItem
                          key={faculty.id}
                          onSelect={() => {
                            const selected = watch("facultyAdvisorIds"); // Updated field name
                            const updated = selected.includes(faculty.id) // Use faculty.id
                              ? selected.filter((id) => id !== faculty.id)
                              : [...selected, faculty.id];
                            setValue("facultyAdvisorIds", updated, {
                              shouldValidate: true,
                            });
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              watch("facultyAdvisorIds").includes(faculty.id) // Use faculty.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {faculty.name} ({faculty.email})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex gap-2 flex-wrap mt-2">
                {watch("facultyAdvisorIds").map((advisorId) => (
                  <Badge key={`advisor-${advisorId}`}>
                    {users.find((u) => u.id === advisorId)?.name || advisorId}
                  </Badge>
                ))}
              </div>
              <FormMessage>{errors.facultyAdvisorIds?.message}</FormMessage>
            </FormItem>
            <FormItem>
              <FormLabel>Faculty Reviewer</FormLabel>
              <Popover open={reviewerOpen} onOpenChange={setReviewerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Select Reviewer
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search faculty..." />
                    <CommandEmpty>No faculty found.</CommandEmpty>
                    <CommandGroup>
                      {faculties.map((faculty) => (
                        <CommandItem
                          key={faculty.id}
                          onSelect={() => {
                            setValue("reviewerId", faculty.id, {
                              shouldValidate: true,
                            });
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              watch("reviewerId") === faculty.id // Use faculty.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {faculty.name} ({faculty.email})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex gap-2 flex-wrap mt-2">
                {watch("reviewerId") && (
                  <Badge>
                    {users.find((u) => u.id === watch("reviewerId"))?.name || watch("reviewerId")}
                  </Badge>
                )}
              </div>
              <FormMessage>{errors.reviewerId?.message}</FormMessage>
            </FormItem>

            <div className="flex justify-between mt-4">
              <Button type="button" onClick={prevStep} variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="button" onClick={nextStep}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Step 3: Review and Submit</h3>
            <p>Please review your project details before submitting.</p>
            <div className="border rounded-md p-6 space-y-4 bg-gray-50">
              <h4 className="text-lg font-bold">Project Information</h4>
              <p>
                <strong>Title:</strong> {watch("title")}
              </p>
              <p>
                <strong>Description:</strong> {watch("description")}
              </p>
              <p>
                <strong>Project Link:</strong>{" "}
                {watch("projectLink") || "Not provided"}
              </p>
              <p>
                <strong>Project Type:</strong>{" "}
                {watch("projectType") || "Not provided"}
              </p>
              <p>
                <strong>Project Status:</strong> {watch("status")}
              </p>
              <p>
                <strong>Start Date:</strong> {watch("startDate")}
              </p>
              <p>
                <strong>End Date:</strong> {watch("endDate") || "Not provided"}
              </p>
              <div>
                <strong>Tags:</strong>
                <div className="flex gap-2 flex-wrap mt-1">
                  {watch("projectTags").length > 0 ? (
                    watch("projectTags").map((tag, i) => (
                      <Badge key={`review-tag-${tag}-${i}`}>{tag}</Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border rounded-md p-6 space-y-4 bg-gray-50">
              <h4 className="text-lg font-bold">Team Information</h4>
              <div>
                <strong>Members:</strong>
                <div className="flex gap-2 flex-wrap mt-1">
                  {watch("members").length > 0 ? (
                    watch("members").map((memberId) => (
                      <Badge key={`review-member-${memberId}`}>
                        {users.find((u) => u.id === memberId)?.name || memberId}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">No members selected</span>
                  )}
                </div>
              </div>
              <div>
                <strong>Faculty Advisors:</strong>
                <div className="flex gap-2 flex-wrap mt-1">
                  {watch("facultyAdvisorIds").length > 0 ? (
                    watch("facultyAdvisorIds").map((advisorId) => (
                      <Badge key={`review-advisor-${advisorId}`}>
                        {users.find((u) => u.id === advisorId)?.name || advisorId}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">No advisors selected</span>
                  )}
                </div>
              </div>
              <div>
                <strong>Faculty Reviewer:</strong>
                <div className="flex gap-2 flex-wrap mt-1">
                  {watch("reviewerId") ? (
                    <Badge>
                      {users.find((u) => u.id === watch("reviewerId"))?.name || watch("reviewerId")}
                    </Badge>  
                  ) : (
                    <span className="text-gray-500">No reviewer selected</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button type="button" onClick={prevStep} variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Submitting..." : "Submit Project"}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 max-w-full w-full mx-auto p-6 bg-white shadow-lg rounded-lg"
      >
        <h2 className="text-3xl font-bold text-center mb-6">
          Submit Ongoing Project
        </h2>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-6">
          {[1, 2, 3].map((s) => (
            <div key={`step-${s}`} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                  step === s
                    ? "bg-blue-600 text-white"
                    : step > s
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "h-1 w-16 mx-2",
                    step > s ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {renderStep()}
      </form>
    </FormProvider>
  );
}