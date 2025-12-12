"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X } from "lucide-react";
import { useTeacherProfile } from "@/hooks/useTeacherProfile";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { fetchTeachers, createBookChapter, updateBookChapter } from "@/lib/api/teacherApi";

const formSchema = z.object({
  title: z.string().min(3, "Title is required"),
  status: z.enum(["ACCEPTED", "COMMUNICATED", "PUBLISHED"]),
  isbnIssn: z.string().optional(),
  registrationFees: z.coerce.number().optional(),
  reimbursement: z.coerce.number().int().optional(),
  authorIds: z.array(z.string()).min(1, "At least one author is required"),
  isPublic: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface BookChapterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookChapter?: any;
  onSuccess: () => void;
}

export function BookChapterFormDialog({ open, onOpenChange, bookChapter, onSuccess }: BookChapterFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<any[]>([]);
  const isEdit = !!bookChapter;
  const { teacherProfile } = useTeacherProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      status: "COMMUNICATED",
      isbnIssn: "",
      registrationFees: undefined,
      reimbursement: undefined,
      authorIds: [],
      isPublic: false,
    },
  });

  // Reset form when dialog opens or bookChapter changes
  useEffect(() => {
    if (open) {
      if (bookChapter) {
        form.reset({
          title: bookChapter.title || "",
          status: bookChapter.status || "COMMUNICATED",
          isbnIssn: bookChapter.isbnIssn || "",
          registrationFees: bookChapter.registrationFees || undefined,
          reimbursement: bookChapter.reimbursement || undefined,
          authorIds: bookChapter.authors?.map((a: any) => a.teacherId) || [],
          isPublic: bookChapter.isPublic || false,
        });
      } else if (teacherProfile) {
        form.reset({
          title: "",
          status: "COMMUNICATED",
          isbnIssn: "",
          registrationFees: undefined,
          reimbursement: undefined,
          authorIds: [teacherProfile.id],
          isPublic: false,
        });
      }
    }
  }, [open, bookChapter, teacherProfile, form]);

  // Fetch teachers
  useEffect(() => {
    const loadTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const result = await fetchTeachers({ limit: 1000 });
        setTeachers(result.data || []);
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
      } finally {
        setLoadingTeachers(false);
      }
    };
    if (open) loadTeachers();
  }, [open]);

  // Update selected teachers when authorIds change
  useEffect(() => {
    const authorIds = form.watch("authorIds");
    const selected = teachers.filter((t) => authorIds.includes(t.id));
    setSelectedTeachers(selected);
  }, [form.watch("authorIds"), teachers]);

  const handleAddAuthor = (teacherId: string) => {
    const currentAuthorIds = form.getValues("authorIds");
    if (!currentAuthorIds.includes(teacherId)) {
      form.setValue("authorIds", [...currentAuthorIds, teacherId]);
    }
  };

  const handleRemoveAuthor = (teacherId: string) => {
    const currentAuthorIds = form.getValues("authorIds");
    form.setValue("authorIds", currentAuthorIds.filter((id) => id !== teacherId));
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (isEdit) {
        await updateBookChapter(bookChapter.id, data);
      } else {
        await createBookChapter(data);
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      // Error already shown by toast in API function
      console.error("Failed to save book chapter:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} Book Chapter</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the book chapter details" : "Add a new book chapter publication"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Chapter Title *</FormLabel><FormControl><Input {...field} placeholder="Enter chapter title" /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem><FormLabel>Status *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="COMMUNICATED">Communicated</SelectItem><SelectItem value="ACCEPTED">Accepted</SelectItem><SelectItem value="PUBLISHED">Published</SelectItem></SelectContent>
              </Select><FormMessage /></FormItem>
            )} />

            {/* Authors Section */}
            <div className="space-y-2">
              <FormLabel>Authors *</FormLabel>
              {form.formState.errors.authorIds && (
                <p className="text-sm text-destructive">{form.formState.errors.authorIds.message}</p>
              )}
              
              {/* Selected Authors */}
              <div className="flex flex-wrap gap-2 min-h-[40px] border rounded-md p-2">
                {selectedTeachers.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No authors selected</span>
                ) : (
                  selectedTeachers.map((teacher) => (
                    <Badge key={teacher.id} variant="secondary" className="gap-1">
                      {teacher.user.name}
                      <X
                        className="size-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveAuthor(teacher.id)}
                      />
                    </Badge>
                  ))
                )}
              </div>

              {/* Add Author Dropdown */}
              <Select onValueChange={handleAddAuthor} value="">
                <SelectTrigger>
                  <SelectValue placeholder={loadingTeachers ? "Loading teachers..." : "Add author"} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.filter((t) => !form.watch("authorIds").includes(t.id)).length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No more teachers available</div>
                  ) : (
                    teachers.filter((t) => !form.watch("authorIds").includes(t.id)).map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.user.name} - {teacher.department}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="isbnIssn" render={({ field }) => (
                <FormItem><FormLabel>ISBN/ISSN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="registrationFees" render={({ field }) => (
                <FormItem><FormLabel>Registration Fees</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="reimbursement" render={({ field }) => (
              <FormItem>
                <FormLabel>Reimbursement Amount (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Enter reimbursement amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="isPublic" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Public Visibility</FormLabel>
                  <div className="text-sm text-muted-foreground">Make this book chapter visible to the public</div>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isEdit ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
