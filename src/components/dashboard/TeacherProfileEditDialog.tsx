"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const teacherProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  affiliation: z.string().min(1, "Affiliation is required"),
  officialEmail: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  subjectOfInterest: z.array(z.string()),
  isAvailableForGuidance: z.boolean(),
});

type TeacherProfileFormData = z.infer<typeof teacherProfileSchema>;

interface TeacherProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  profile: any;
}

export function TeacherProfileEditDialog({
  open,
  onOpenChange,
  onSuccess,
  profile,
}: TeacherProfileEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjectInput, setSubjectInput] = useState("");

  const form = useForm<TeacherProfileFormData>({
    resolver: zodResolver(teacherProfileSchema),
    defaultValues: {
      name: profile?.name || "",
      employeeId: profile?.teacherProfile?.employeeId || "",
      department: profile?.teacherProfile?.department || "",
      designation: profile?.teacherProfile?.designation || "",
      affiliation: profile?.teacherProfile?.affiliation || "",
      officialEmail: profile?.teacherProfile?.officialEmail || "",
      phoneNumber: profile?.teacherProfile?.phoneNumber || "",
      address: profile?.teacherProfile?.address || "",
      qualification: profile?.teacherProfile?.qualification || "",
      experience: profile?.teacherProfile?.experience?.toString() || "",
      subjectOfInterest: profile?.teacherProfile?.subjectOfInterest || [],
      isAvailableForGuidance: profile?.teacherProfile?.isAvailableForGuidance ?? true,
    },
  });

  const addSubject = () => {
    if (subjectInput.trim()) {
      const currentSubjects = form.getValues("subjectOfInterest");
      if (!currentSubjects.includes(subjectInput.trim())) {
        form.setValue("subjectOfInterest", [...currentSubjects, subjectInput.trim()]);
      }
      setSubjectInput("");
    }
  };

  const removeSubject = (subject: string) => {
    const currentSubjects = form.getValues("subjectOfInterest");
    form.setValue(
      "subjectOfInterest",
      currentSubjects.filter((s) => s !== subject)
    );
  };

  const onSubmit = async (data: TeacherProfileFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        name: data.name,
        teacherProfile: {
          employeeId: data.employeeId,
          department: data.department,
          designation: data.designation,
          affiliation: data.affiliation,
          officialEmail: data.officialEmail || null,
          phoneNumber: data.phoneNumber || null,
          address: data.address || null,
          qualification: data.qualification || null,
          experience: data.experience ? parseInt(data.experience) : null,
          subjectOfInterest: data.subjectOfInterest,
          isAvailableForGuidance: data.isAvailableForGuidance,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Teacher Profile</DialogTitle>
          <DialogDescription>
            Update your professional information
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your full name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., EMP-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Assistant Professor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Computer Science" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="affiliation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Affiliation *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., UEM Kolkata" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="officialEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="official@university.edu" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+91 XXXXXXXXXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter your address" rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="qualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highest Qualification</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Ph.D. in Computer Science" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="e.g., 5" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subjectOfInterest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Areas of Interest</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={subjectInput}
                          onChange={(e) => setSubjectInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSubject();
                            }
                          }}
                          placeholder="Type and press Enter"
                        />
                        <Button type="button" onClick={addSubject}>
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((subject) => (
                          <Badge key={subject} variant="secondary">
                            {subject}
                            <button
                              type="button"
                              onClick={() => removeSubject(subject)}
                              className="ml-2"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAvailableForGuidance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Available for Student Guidance
                    </FormLabel>
                    <FormDescription>
                      Allow students to request you as their advisor for projects and papers
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
