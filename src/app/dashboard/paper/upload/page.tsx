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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/appwrite"; // Assuming this is your file upload utility
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"; // Assumed shadcn/ui form components

// --- Zod Schema with enhanced file validation ---
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  abstract: z.string().min(10, { message: "Abstract must be at least 10 characters." }),
  // Enhanced file validation
  file: z
    .instanceof(File)
    .refine((file) => file && file.size > 0, { message: "File cannot be empty." })
    .refine((file) => file && file.size <= 10 * 1024 * 1024, { message: `File size should be less than 10MB.` }), // 10MB limit
  keywords: z.array(z.string()).min(3, { message: "Please add at least 3 keywords." }),
  authorNames: z.array(z.string()).min(1, { message: "Please select at least one author." }),
  facultyAdvisorEmails: z.array(z.string().email()).min(1, { message: "Please select at least one faculty advisor." }),
  reviewerEmail: z.string().email().optional().or(z.literal("")), // Allow empty string or valid email
  reviewerName: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface User {
    id: string;
    name: string;
    email: string;
    userType: "STUDENT" | "FACULTY" | "REVIEWER"; // Add userType for filtering
}

export default function ResearchPaperForm() {
  const [step, setStep] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [uploading, setUploading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [reviewerOpen, setReviewerOpen] = useState(false);
  const [authorOpen, setAuthorOpen] = useState(false);

  const form = useForm<FormSchema, any, FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      abstract: "",
      file: undefined,
      keywords: [],
      authorNames: [],
      facultyAdvisorEmails: [],
      reviewerEmail: "",
      reviewerName: "",
    },
    mode: "onTouched", // Validate fields on blur/change for better user feedback
  });

  const { register, handleSubmit, setValue, watch, trigger, formState } = form;
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
      setValue("keywords", newKeywords, { shouldValidate: true }); // Trigger validation on update
      setKeywordInput("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const updatedKeywords = keywords.filter(k => k !== keywordToRemove);
    setKeywords(updatedKeywords);
    setValue("keywords", updatedKeywords, { shouldValidate: true });
  };
  
  // --- Form submission handler ---
  const onSubmit = async (data: FormSchema) => {
    try {
      setUploading(true);

      // Await the file upload
      const filePath = await uploadFile(data.file);

      const payload = {
        title: data.title,
        abstract: data.abstract,
        filePath, // This is the path from your upload function
        keywords: data.keywords, // Use data.keywords directly, as it's updated via setValue
        authorNames: data.authorNames,
        // Map faculty advisor emails to names for the payload
        facultyAdvisorNames: users.filter((u) => data.facultyAdvisorEmails?.includes(u.email)).map((u) => u.name),
        reviewerName: data.reviewerName,
        reviewerEmail: data.reviewerEmail,
      };
      console.log("Form submitted successfully:", payload);
      const res = await axios.post("/api/paper/researchPaper", payload);
      console.log("Response from server:", res.data);
      toast.success("Research paper submitted successfully!");
      // Reset form after successful submission
      form.reset();
      setKeywords([]);
      setStep(1);
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  
  // --- Navigation logic for multi-step form ---
  const nextStep = async () => {
    let fieldsToValidate: (keyof FormSchema)[] = [];
    if (step === 1) {
      fieldsToValidate = ["title", "abstract", "file", "keywords"];
    } else if (step === 2) {
      fieldsToValidate = ["authorNames", "facultyAdvisorEmails"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prevStep) => prevStep + 1);
    }
  };

  const prevStep = () => {
    setStep((prevStep) => prevStep - 1);
  };

  // --- Filter users for different roles ---
  const faculties = users.filter((u) => u.userType !== "STUDENT");
  const authors = users; // All users can be authors

  // --- Render logic for each step ---
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Step 1: Paper Details</h3>
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter paper title" {...register("title")} />
              </FormControl>
              <FormMessage>{errors.title?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Abstract</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter a brief abstract of your paper" {...register("abstract")} />
              </FormControl>
              <FormMessage>{errors.abstract?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Upload Paper (PDF)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setValue("file", file, { shouldValidate: true });
                    }
                  }}
                />
              </FormControl>
              <FormMessage>{errors.file?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Keywords</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add a keyword and press Enter"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onKeywordAdd();
                    }
                  }}
                />
                <Button type="button" onClick={onKeywordAdd}>Add</Button>
              </div>
              <div className="flex gap-2 flex-wrap mt-2">
                {keywords.map((k, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(k)}>
                    {k} <span className="ml-1 text-xs opacity-70">x</span>
                  </Badge>
                ))}
              </div>
              <FormMessage>{errors.keywords?.message}</FormMessage>
            </FormItem>
            
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
            <h3 className="text-xl font-semibold">Step 2: Authors & Faculty Advisors</h3>
            
            <FormItem>
              <FormLabel>Authors</FormLabel>
              <Popover open={authorOpen} onOpenChange={setAuthorOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Select authors
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search authors..." />
                    <CommandEmpty>No author found.</CommandEmpty>
                    <CommandGroup>
                      {authors.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => {
                            const selected = watch("authorNames");
                            const updated = selected.includes(user.name)
                              ? selected.filter((n) => n !== user.name)
                              : [...selected, user.name];
                            setValue("authorNames", updated, { shouldValidate: true });
                            // Optionally close popover after selection
                            // setAuthorOpen(false); 
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              watch("authorNames").includes(user.name) // --- CORRECTED BUG HERE ---
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {user.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex gap-2 flex-wrap mt-2">
                {watch("authorNames").map((name, i) => (
                  <Badge key={i}>{name}</Badge>
                ))}
              </div>
              <FormMessage>{errors.authorNames?.message}</FormMessage>
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
                            const selected = watch("facultyAdvisorEmails");
                            const updated = selected.includes(faculty.email)
                              ? selected.filter((e) => e !== faculty.email)
                              : [...selected, faculty.email];
                            setValue("facultyAdvisorEmails", updated, { shouldValidate: true });
                            // Optionally close popover after selection
                            // setAdvisorOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              watch("facultyAdvisorEmails").includes(faculty.email)
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
                {watch("facultyAdvisorEmails").map((email, i) => (
                  <Badge key={i}>{users.find(u => u.email === email)?.name || email}</Badge>
                ))}
              </div>
              <FormMessage>{errors.facultyAdvisorEmails?.message}</FormMessage>
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
            <h3 className="text-xl font-semibold">Step 3: Reviewer (Optional)</h3>
            <FormItem>
              <FormLabel>Reviewer</FormLabel>
              <Popover open={reviewerOpen} onOpenChange={setReviewerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Select Reviewer
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search reviewer..." />
                    <CommandEmpty>No reviewer found.</CommandEmpty>
                    <CommandGroup>
                      {faculties.map((faculty) => (
                        <CommandItem
                          key={faculty.id}
                          onSelect={() => {
                            setValue("reviewerEmail", faculty.email, { shouldValidate: true });
                            setValue("reviewerName", faculty.name, { shouldValidate: true });
                            setReviewerOpen(false); // Close after selection for single-select
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              watch("reviewerEmail") === faculty.email
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
              {watch("reviewerEmail") && (
                <div className="mt-2">
                    <Badge variant="secondary">
                        {watch("reviewerName") || watch("reviewerEmail")}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-2"
                            onClick={() => {
                                setValue("reviewerEmail", "");
                                setValue("reviewerName", "");
                            }}
                        >
                            x
                        </Button>
                    </Badge>
                </div>
              )}
              <FormMessage>{errors.reviewerEmail?.message}</FormMessage>
            </FormItem>

            <div className="flex justify-between mt-8">
              <Button type="button" onClick={prevStep} variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Submitting..." : "Submit Paper"}
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-full w-full mx-auto p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-6">Submit Research Paper</h2>
        
        {/* Progress Indicator */}
        <div className="flex justify-center mb-6">
            {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                        step === s ? "bg-blue-600 text-white" : step > s ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                    )}>
                        {step > s ? <Check className="h-5 w-5" /> : s}
                    </div>
                    {s < 3 && (
                        <div className={cn(
                            "h-1 w-16 mx-2",
                            step > s ? "bg-green-500" : "bg-gray-200"
                        )} />
                    )}
                </div>
            ))}
        </div>

        {renderStep()}
      </form>
    </FormProvider>
  );
}