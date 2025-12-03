"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X, Plus, Search } from "lucide-react";
import { useTeacherProfile } from "@/hooks/useTeacherProfile";
import axios from "axios";

const investigatorSchema = z.object({
  teacherId: z.string().min(1, "Investigator is required"),
  role: z.enum(["PI", "Co-PI"]),
  orderIndex: z.number(),
});

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  projectCode: z.string().optional(),
  projectPI: z.string().optional(),
  projectCoPI: z.string().optional(),
  status: z.string().optional(),
  appliedAt: z.string().optional(),
  grantedAt: z.string().optional(),
  completedAt: z.string().optional(),
  durationMonths: z.string().optional(),
  grantAmount: z.string().optional(),
  utilizedAmount: z.string().optional(),
  remainingAmount: z.string().optional(),
  publication: z.string().optional(),
  publicationDetails: z.string().optional(),
  isPublic: z.boolean(),
  investigators: z.array(investigatorSchema).min(1, "At least one investigator is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface GrantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grant?: any;
  onSuccess: () => void;
}

export function GrantFormDialog({ open, onOpenChange, grant, onSuccess }: GrantFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const isEdit = !!grant;
  const { teacherProfile } = useTeacherProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: grant?.title || "",
      projectCode: grant?.projectCode || "",
      projectPI: grant?.projectPI || "",
      projectCoPI: grant?.projectCoPI || "",
      status: grant?.status || "",
      appliedAt: grant?.appliedAt ? new Date(grant.appliedAt).toISOString().split('T')[0] : "",
      grantedAt: grant?.grantedAt ? new Date(grant.grantedAt).toISOString().split('T')[0] : "",
      completedAt: grant?.completedAt ? new Date(grant.completedAt).toISOString().split('T')[0] : "",
      durationMonths: grant?.durationMonths?.toString() || "",
      grantAmount: grant?.grantAmount?.toString() || "",
      utilizedAmount: grant?.utilizedAmount?.toString() || "",
      remainingAmount: grant?.remainingAmount?.toString() || "",
      publication: grant?.publication || "",
      publicationDetails: grant?.publicationDetails || "",
      isPublic: grant?.isPublic || false,
      investigators: grant?.investigators?.map((inv: any, idx: number) => ({
        teacherId: inv.teacherId,
        role: inv.role,
        orderIndex: idx,
      })) || (teacherProfile ? [{ teacherId: teacherProfile.id, role: "PI", orderIndex: 0 }] : []),
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

  const addInvestigator = (teacher: any, role: "PI" | "Co-PI") => {
    const current = form.getValues("investigators");
    if (current.some(inv => inv.teacherId === teacher.id)) return;
    form.setValue("investigators", [...current, { teacherId: teacher.id, role, orderIndex: current.length }]);
    setSearchQuery("");
    setTeachers([]);
  };

  const removeInvestigator = (index: number) => {
    const current = form.getValues("investigators");
    form.setValue("investigators", current.filter((_, i) => i !== index).map((inv, idx) => ({ ...inv, orderIndex: idx })));
  };

  const getTeacherName = (teacherId: string) => {
    if (teacherId === teacherProfile?.id) return teacherProfile?.user?.name || "Current User";
    const investigator = grant?.investigators?.find((inv: any) => inv.teacherId === teacherId);
    return investigator?.teacher?.user?.name || teacherId;
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const payload: any = {
        title: data.title,
        projectCode: data.projectCode || undefined,
        projectPI: data.projectPI || undefined,
        projectCoPI: data.projectCoPI || undefined,
        status: data.status || undefined,
        appliedAt: data.appliedAt || undefined,
        grantedAt: data.grantedAt || undefined,
        completedAt: data.completedAt || undefined,
        durationMonths: data.durationMonths ? parseInt(data.durationMonths) : undefined,
        grantAmount: data.grantAmount ? parseFloat(data.grantAmount) : undefined,
        utilizedAmount: data.utilizedAmount ? parseFloat(data.utilizedAmount) : undefined,
        remainingAmount: data.remainingAmount ? parseFloat(data.remainingAmount) : undefined,
        publication: data.publication || undefined,
        publicationDetails: data.publicationDetails || undefined,
        isPublic: data.isPublic,
        investigators: data.investigators,
      };

      const url = isEdit ? `/api/teacher/grant/${grant.id}` : "/api/teacher/grant";
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
      alert(error.response?.data?.error || error.message || "Failed to save grant");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} Grant/Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Project Title *</FormLabel><FormControl><Input {...field} placeholder="Enter project title" /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="projectCode" render={({ field }) => (
                <FormItem><FormLabel>Project Code</FormLabel><FormControl><Input {...field} placeholder="e.g., PRJ-2024-001" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel><FormControl><Input {...field} placeholder="e.g., Applied, Granted, Ongoing, Completed" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="projectPI" render={({ field }) => (
                <FormItem><FormLabel>Principal Investigator (PI)</FormLabel><FormControl><Input {...field} placeholder="PI Name" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="projectCoPI" render={({ field }) => (
                <FormItem><FormLabel>Co-Principal Investigator (Co-PI)</FormLabel><FormControl><Input {...field} placeholder="Co-PI Name" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="appliedAt" render={({ field }) => (
                <FormItem><FormLabel>Applied Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="grantedAt" render={({ field }) => (
                <FormItem><FormLabel>Granted Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="completedAt" render={({ field }) => (
                <FormItem><FormLabel>Completed Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField control={form.control} name="durationMonths" render={({ field }) => (
                <FormItem><FormLabel>Duration (Months)</FormLabel><FormControl><Input type="number" {...field} placeholder="e.g., 24" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="grantAmount" render={({ field }) => (
                <FormItem><FormLabel>Grant Amount (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="utilizedAmount" render={({ field }) => (
                <FormItem><FormLabel>Utilized Amount (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="remainingAmount" render={({ field }) => (
                <FormItem><FormLabel>Remaining Amount (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="publication" render={({ field }) => (
                <FormItem><FormLabel>Publication</FormLabel><FormControl><Input {...field} placeholder="Publication info" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="publicationDetails" render={({ field }) => (
                <FormItem><FormLabel>Publication Details</FormLabel><FormControl><Input {...field} placeholder="Additional details" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="isPublic" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Public Visibility</FormLabel>
                  <div className="text-sm text-muted-foreground">Make this grant publicly visible</div>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />

            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <FormLabel>Investigators *</FormLabel>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search for investigators by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />}
              </div>
              {teachers.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer">
                      <div className="text-sm">
                        <div className="font-medium">{teacher.user?.name || "Unknown"}</div>
                        <div className="text-muted-foreground text-xs">{teacher.user?.email}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => addInvestigator(teacher, "PI")}>Add as PI</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => addInvestigator(teacher, "Co-PI")}>Add as Co-PI</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {form.watch("investigators")?.map((investigator, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2 py-1 px-3">
                    <span>{getTeacherName(investigator.teacherId)}</span>
                    <span className="text-xs">({investigator.role})</span>
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeInvestigator(index)} />
                  </Badge>
                ))}
              </div>
              <FormMessage>{form.formState.errors.investigators?.message}</FormMessage>
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
