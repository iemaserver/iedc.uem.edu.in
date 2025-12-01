"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X, Search } from "lucide-react";
import { useTeacherProfile } from "@/hooks/useTeacherProfile";
import axios from "axios";

const inventorSchema = z.object({
  teacherId: z.string().min(1, "Inventor is required"),
  orderIndex: z.number(),
});

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  applicant: z.string().min(1, "Applicant is required"),
  applicationNo: z.string().optional(),
  patentNumber: z.string().optional(),
  filedAt: z.string().optional(),
  submittedAt: z.string().optional(),
  publishedAt: z.string().optional(),
  grantedAt: z.string().optional(),
  publicationLink: z.string().url().optional().or(z.literal("")),
  patentLink: z.string().url().optional().or(z.literal("")),
  country: z.string().optional(),
  isPublic: z.boolean(),
  inventors: z.array(inventorSchema).min(1, "At least one inventor is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface PatentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patent?: any;
  onSuccess: () => void;
}

export function PatentFormDialog({ open, onOpenChange, patent, onSuccess }: PatentFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const isEdit = !!patent;
  const { teacherProfile } = useTeacherProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: patent?.title || "",
      applicant: patent?.applicant || "",
      applicationNo: patent?.applicationNo || "",
      patentNumber: patent?.patentNumber || "",
      filedAt: patent?.filedAt ? new Date(patent.filedAt).toISOString().split('T')[0] : "",
      submittedAt: patent?.submittedAt ? new Date(patent.submittedAt).toISOString().split('T')[0] : "",
      publishedAt: patent?.publishedAt ? new Date(patent.publishedAt).toISOString().split('T')[0] : "",
      grantedAt: patent?.grantedAt ? new Date(patent.grantedAt).toISOString().split('T')[0] : "",
      publicationLink: patent?.publicationLink || "",
      patentLink: patent?.patentLink || "",
      country: patent?.country || "",
      isPublic: patent?.isPublic || false,
      inventors: patent?.inventors?.map((inventor: any, idx: number) => ({
        teacherId: inventor.teacherId,
        orderIndex: idx,
      })) || (teacherProfile ? [{ teacherId: teacherProfile.id, orderIndex: 0 }] : []),
    },
  });

  useEffect(() => {
    const searchTeachers = async () => {
      if (searchQuery.length < 2) {
        setTeachers([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await axios.get(`/api/teacher?search=${encodeURIComponent(searchQuery)}&limit=10`);
        setTeachers(response.data.data || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };
    const timer = setTimeout(searchTeachers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addInventor = (teacher: any) => {
    const current = form.getValues("inventors");
    if (current.some(inventor => inventor.teacherId === teacher.id)) return;
    form.setValue("inventors", [...current, { teacherId: teacher.id, orderIndex: current.length }]);
    setSearchQuery("");
    setTeachers([]);
  };

  const removeInventor = (index: number) => {
    const current = form.getValues("inventors");
    form.setValue("inventors", current.filter((_, i) => i !== index).map((inventor, idx) => ({ ...inventor, orderIndex: idx })));
  };

  const getTeacherName = (teacherId: string) => {
    if (teacherId === teacherProfile?.id) return teacherProfile?.user?.name || "Current User";
    const inventor = patent?.inventors?.find((inv: any) => inv.teacherId === teacherId);
    return inventor?.teacher?.user?.name || teacherId;
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const payload: any = {
        title: data.title,
        applicant: data.applicant,
        applicationNo: data.applicationNo || undefined,
        patentNumber: data.patentNumber || undefined,
        filedAt: data.filedAt || undefined,
        submittedAt: data.submittedAt || undefined,
        publishedAt: data.publishedAt || undefined,
        grantedAt: data.grantedAt || undefined,
        publicationLink: data.publicationLink || undefined,
        patentLink: data.patentLink || undefined,
        country: data.country || undefined,
        isPublic: data.isPublic,
        inventors: data.inventors,
      };

      const url = isEdit ? `/api/teacher/patent/${patent.id}` : "/api/teacher/patent";
      const response = await axios({
        method: isEdit ? "patch" : "post",
        url,
        data: payload,
      });

      if (response.status === 200 || response.status === 201) {
        onSuccess();
        onOpenChange(false);
        form.reset();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || "Failed to save patent");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} Patent</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title *</FormLabel><FormControl><Input {...field} placeholder="Enter patent title" /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="applicant" render={({ field }) => (
              <FormItem><FormLabel>Applicant *</FormLabel><FormControl><Input {...field} placeholder="Enter applicant name" /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="applicationNo" render={({ field }) => (
                <FormItem><FormLabel>Application Number</FormLabel><FormControl><Input {...field} placeholder="APP-12345" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="patentNumber" render={({ field }) => (
                <FormItem><FormLabel>Patent Number</FormLabel><FormControl><Input {...field} placeholder="PAT-12345" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField control={form.control} name="filedAt" render={({ field }) => (
                <FormItem><FormLabel>Filed Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="submittedAt" render={({ field }) => (
                <FormItem><FormLabel>Submitted Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="publishedAt" render={({ field }) => (
                <FormItem><FormLabel>Published Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="grantedAt" render={({ field }) => (
                <FormItem><FormLabel>Granted Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} placeholder="e.g., India, USA" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="publicationLink" render={({ field }) => (
                <FormItem><FormLabel>Publication Link</FormLabel><FormControl><Input {...field} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="patentLink" render={({ field }) => (
              <FormItem><FormLabel>Patent Link</FormLabel><FormControl><Input {...field} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="isPublic" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Public Visibility</FormLabel>
                  <div className="text-sm text-muted-foreground">Make this patent publicly visible</div>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />

            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <FormLabel>Inventors *</FormLabel>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search for inventors by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />}
              </div>
              {teachers.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer" onClick={() => addInventor(teacher)}>
                      <div className="text-sm">
                        <div className="font-medium">{teacher.user?.name || "Unknown"}</div>
                        <div className="text-muted-foreground text-xs">{teacher.user?.email}</div>
                      </div>
                      <Button type="button" size="sm" variant="outline">Add</Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {form.watch("inventors")?.map((inventor, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2 py-1 px-3">
                    <span>{getTeacherName(inventor.teacherId)}</span>
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeInventor(index)} />
                  </Badge>
                ))}
              </div>
              <FormMessage>{form.formState.errors.inventors?.message}</FormMessage>
            </div>

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
