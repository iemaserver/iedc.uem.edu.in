"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X, UserPlus } from "lucide-react";
import { useTeacherProfile } from "@/hooks/useTeacherProfile";
import { fetchTeachers, createCopyright, updateCopyright } from "@/lib/api/teacherApi";

const formSchema = z.object({
  title: z.string().min(3),
  filedAt: z.string().optional(),
  submittedAt: z.string().optional(),
  publishedAt: z.string().optional(),
  grantedAt: z.string().optional(),
  isPublic: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface CopyrightFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copyright?: any;
  onSuccess: () => void;
}

export function CopyrightFormDialog({ open, onOpenChange, copyright, onSuccess }: CopyrightFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedInventors, setSelectedInventors] = useState<any[]>([]);
  const [searchInventor, setSearchInventor] = useState("");
  const isEdit = !!copyright;
  const { teacherProfile } = useTeacherProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      filedAt: "",
      submittedAt: "",
      publishedAt: "",
      grantedAt: "",
      isPublic: true,
    },
  });

  useEffect(() => {
    if (open) {
      fetchTeachers().then((result) => setTeachers(result.data || [])).catch(console.error);
      if (copyright) {
        form.reset({
          title: copyright.title || "",
          filedAt: copyright.filedAt ? new Date(copyright.filedAt).toISOString().split('T')[0] : "",
          submittedAt: copyright.submittedAt ? new Date(copyright.submittedAt).toISOString().split('T')[0] : "",
          publishedAt: copyright.publishedAt ? new Date(copyright.publishedAt).toISOString().split('T')[0] : "",
          grantedAt: copyright.grantedAt ? new Date(copyright.grantedAt).toISOString().split('T')[0] : "",
          isPublic: copyright.isPublic ?? true,
        });
        setSelectedInventors(copyright.inventors?.map((i: any) => i.teacher) || []);
      } else {
        form.reset({
          title: "",
          filedAt: "",
          submittedAt: "",
          publishedAt: "",
          grantedAt: "",
          isPublic: true,
        });
        setSelectedInventors(teacherProfile ? [teacherProfile] : []);
      }
    }
  }, [open, copyright, teacherProfile, form]);

  const filteredTeachers = teachers.filter(t => 
    !selectedInventors.find(i => i.id === t.id) &&
    (t.user.name.toLowerCase().includes(searchInventor.toLowerCase()) || t.user.email.toLowerCase().includes(searchInventor.toLowerCase()))
  );

  const onSubmit = async (data: FormValues) => {
    if (selectedInventors.length === 0) {
      alert("Please select at least one inventor");
      return;
    }
    setIsLoading(true);
    try {
      const payload = { ...data, inventorIds: selectedInventors.map(i => i.id) };
      if (isEdit) {
        await updateCopyright(copyright.id, payload);
      } else {
        await createCopyright(payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} Copyright</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <FormLabel>Inventors *</FormLabel>
                <FormField control={form.control} name="isPublic" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="mt-0">Visible to public</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[50px]">
                {selectedInventors.map((inventor) => (
                  <Badge key={inventor.id} variant="secondary" className="flex items-center gap-1">
                    {inventor.user.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedInventors(prev => prev.filter(i => i.id !== inventor.id))} />
                  </Badge>
                ))}
              </div>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search teachers..." value={searchInventor} onChange={(e) => setSearchInventor(e.target.value)} />
                </div>
                {searchInventor && filteredTeachers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredTeachers.map((teacher) => (
                      <div key={teacher.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setSelectedInventors(prev => [...prev, teacher]); setSearchInventor(""); }}>
                        <div className="font-medium">{teacher.user.name}</div>
                        <div className="text-xs text-gray-500">{teacher.user.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="filedAt" render={({ field }) => (
                <FormItem><FormLabel>Filed Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="submittedAt" render={({ field }) => (
                <FormItem><FormLabel>Submitted Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="publishedAt" render={({ field }) => (
                <FormItem><FormLabel>Published Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="grantedAt" render={({ field }) => (
                <FormItem><FormLabel>Granted Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
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
