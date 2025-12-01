"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X } from "lucide-react";
import { useTeacherProfile } from "@/hooks/useTeacherProfile";
import { fetchTeachers, createCertification, updateCertification } from "@/lib/api/teacherApi";

const formSchema = z.object({
  certificationName: z.string().min(3, "Certification name is required"),
  offeredBy: z.string().min(1, "Offered by is required"),
  completedAt: z.string().min(1, "Completion date is required"),
  link: z.string().url().optional().or(z.literal("")),
  remarks: z.string().optional(),
  isPublic: z.boolean(),
  holderIds: z.array(z.string()).min(1, "At least one holder is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CertificationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certification?: any;
  onSuccess: () => void;
}

export function CertificationFormDialog({ open, onOpenChange, certification, onSuccess }: CertificationFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<any[]>([]);
  const isEdit = !!certification;
  const { teacherProfile } = useTeacherProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      certificationName: "",
      offeredBy: "",
      completedAt: "",
      link: "",
      remarks: "",
      isPublic: false,
      holderIds: [],
    },
  });

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const result = await fetchTeachers({ limit: 1000 });
        setTeachers(result.data || []);
      } catch (error) {
        console.error("Error loading teachers:", error);
      }
    };
    loadTeachers();
  }, []);

  useEffect(() => {
    if (open) {
      if (certification) {
        const holderIds = certification.holders?.map((h: any) => h.teacherId) || [];
        const holders = certification.holders?.map((h: any) => h.teacher) || [];
        
        form.reset({
          certificationName: certification.certificationName || "",
          offeredBy: certification.offeredBy || "",
          completedAt: certification.completedAt ? new Date(certification.completedAt).toISOString().split('T')[0] : "",
          link: certification.link || "",
          remarks: certification.remarks || "",
          isPublic: certification.isPublic || false,
          holderIds: holderIds,
        });
        setSelectedTeachers(holders);
      } else {
        const defaultHolders = teacherProfile ? [teacherProfile.id] : [];
        const defaultTeachers = teacherProfile ? [teacherProfile] : [];
        
        form.reset({
          certificationName: "",
          offeredBy: "",
          completedAt: "",
          link: "",
          remarks: "",
          isPublic: false,
          holderIds: defaultHolders,
        });
        setSelectedTeachers(defaultTeachers);
      }
    }
  }, [open, certification, form, teacherProfile]);

  const handleAddHolder = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (teacher && !selectedTeachers.find((t) => t.id === teacherId)) {
      const newTeachers = [...selectedTeachers, teacher];
      setSelectedTeachers(newTeachers);
      form.setValue("holderIds", newTeachers.map((t) => t.id));
    }
  };

  const handleRemoveHolder = (teacherId: string) => {
    const newTeachers = selectedTeachers.filter((t) => t.id !== teacherId);
    setSelectedTeachers(newTeachers);
    form.setValue("holderIds", newTeachers.map((t) => t.id));
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (isEdit) {
        await updateCertification(certification.id, data);
      } else {
        await createCertification(data);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving certification:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} Certification</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="certificationName" render={({ field }) => (
              <FormItem><FormLabel>Certification Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <FormField control={form.control} name="offeredBy" render={({ field }) => (
              <FormItem><FormLabel>Offered By *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="completedAt" render={({ field }) => (
              <FormItem><FormLabel>Completion Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="link" render={({ field }) => (
              <FormItem><FormLabel>Certificate Link (URL)</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="remarks" render={({ field }) => (
              <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="holderIds" render={({ field }) => (
              <FormItem>
                <FormLabel>Holders *</FormLabel>
                <div className="space-y-2">
                  <Select onValueChange={handleAddHolder}>
                    <SelectTrigger><SelectValue placeholder="Add holder..." /></SelectTrigger>
                    <SelectContent>
                      {teachers
                        .filter((t) => !selectedTeachers.find((st) => st.id === t.id))
                        .map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.user?.name || teacher.user?.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeachers.map((teacher) => (
                      <Badge key={teacher.id} variant="secondary" className="gap-1">
                        {teacher.user?.name || teacher.user?.email}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveHolder(teacher.id)} />
                      </Badge>
                    ))}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="isPublic" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Public Visibility</FormLabel>
                  <div className="text-sm text-muted-foreground">Make this certification visible to public</div>
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
