"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X, UserPlus } from "lucide-react";
import { useTeacherProfile } from "@/hooks/useTeacherProfile";
import { fetchTeachers, createFDP, updateFDP } from "@/lib/api/teacherApi";

const formSchema = z.object({
  name: z.string().min(3),
  organizedBy: z.string().optional(),
  sponsoredBy: z.string().optional(),
  venue: z.string().optional(),
  duration: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  topic: z.string().optional(),
  certificateUrl: z.string().optional(),
  remarks: z.string().optional(),
  isPublic: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface FDPFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fdp?: any;
  onSuccess: () => void;
}

export function FDPFormDialog({ open, onOpenChange, fdp, onSuccess }: FDPFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<any[]>([]);
  const [searchParticipant, setSearchParticipant] = useState("");
  const isEdit = !!fdp;
  const { teacherProfile } = useTeacherProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      organizedBy: "",
      sponsoredBy: "",
      venue: "",
      duration: "",
      startDate: "",
      endDate: "",
      topic: "",
      certificateUrl: "",
      remarks: "",
      isPublic: true,
    },
  });

  useEffect(() => {
    if (open) {
      fetchTeachers().then((result) => setTeachers(result.data || [])).catch(console.error);
      if (fdp) {
        form.reset({
          name: fdp.name || "",
          organizedBy: fdp.organizedBy || "",
          sponsoredBy: fdp.sponsoredBy || "",
          venue: fdp.venue || "",
          duration: fdp.duration || "",
          startDate: fdp.startDate ? new Date(fdp.startDate).toISOString().split('T')[0] : "",
          endDate: fdp.endDate ? new Date(fdp.endDate).toISOString().split('T')[0] : "",
          topic: fdp.topic || "",
          certificateUrl: fdp.certificateUrl || "",
          remarks: fdp.remarks || "",
          isPublic: fdp.isPublic ?? true,
        });
        setSelectedParticipants(fdp.participants?.map((p: any) => p.teacher) || []);
      } else {
        form.reset({
          name: "",
          organizedBy: "",
          sponsoredBy: "",
          venue: "",
          duration: "",
          startDate: "",
          endDate: "",
          topic: "",
          certificateUrl: "",
          remarks: "",
          isPublic: true,
        });
        setSelectedParticipants(teacherProfile ? [teacherProfile] : []);
      }
    }
  }, [open, fdp, teacherProfile, form]);

  const filteredTeachers = teachers.filter(t => 
    !selectedParticipants.find(p => p.id === t.id) &&
    (t.user.name.toLowerCase().includes(searchParticipant.toLowerCase()) || t.user.email.toLowerCase().includes(searchParticipant.toLowerCase()))
  );

  const onSubmit = async (data: FormValues) => {
    if (selectedParticipants.length === 0) {
      alert("Please select at least one participant");
      return;
    }
    setIsLoading(true);
    try {
      const payload = { 
        ...data, 
        participants: selectedParticipants.map((p, idx) => ({ teacherId: p.id, participationType: idx === 0 ? "ORGANIZER" : "PARTICIPANT" })) 
      };
      if (isEdit) {
        await updateFDP(fdp.id, payload);
      } else {
        await createFDP(payload);
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
          <DialogTitle>{isEdit ? "Edit" : "Add"} FDP</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <FormLabel>Participants *</FormLabel>
                <FormField control={form.control} name="isPublic" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="mt-0">Visible to public</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[50px]">
                {selectedParticipants.map((participant) => (
                  <Badge key={participant.id} variant="secondary" className="flex items-center gap-1">
                    {participant.user.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedParticipants(prev => prev.filter(p => p.id !== participant.id))} />
                  </Badge>
                ))}
              </div>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search teachers..." value={searchParticipant} onChange={(e) => setSearchParticipant(e.target.value)} />
                </div>
                {searchParticipant && filteredTeachers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredTeachers.map((teacher) => (
                      <div key={teacher.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setSelectedParticipants(prev => [...prev, teacher]); setSearchParticipant(""); }}>
                        <div className="font-medium">{teacher.user.name}</div>
                        <div className="text-xs text-gray-500">{teacher.user.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>FDP Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="organizedBy" render={({ field }) => (
                <FormItem><FormLabel>Organized By</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="sponsoredBy" render={({ field }) => (
                <FormItem><FormLabel>Sponsored By</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="venue" render={({ field }) => (
                <FormItem><FormLabel>Venue</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="duration" render={({ field }) => (
                <FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="e.g. 5 days" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="topic" render={({ field }) => (
              <FormItem><FormLabel>Topic/Theme</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="certificateUrl" render={({ field }) => (
              <FormItem><FormLabel>Certificate URL</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="remarks" render={({ field }) => (
              <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
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
