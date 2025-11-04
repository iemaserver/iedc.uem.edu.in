"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Award, Calendar, Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(2, "Certification name is required"),
  certificationName: z.string().min(1, "Certification type is required"),
  offeredBy: z.string().optional(),
  completedAt: z.string().min(1, "Completion date is required"),
  link: z.string().url().optional().or(z.literal("")),
  remarks: z.string().optional(),
  isPublic: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface Certification {
  id: string;
  name: string;
  certificationName: string;
  offeredBy?: string | null;
  completedAt?: string | null;
  link?: string | null;
  remarks?: string | null;
  isPublic: boolean;
  teacherId: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certification: Certification | null;
  onSuccess: () => void;
}

export function EditCertificationDialog({ open, onOpenChange, certification, onSuccess }: Props) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      certificationName: "",
      offeredBy: "",
      completedAt: "",
      link: "",
      remarks: "",
      isPublic: false,
    },
  });

  React.useEffect(() => {
    if (certification && open) {
      form.reset({
        name: certification.name,
        certificationName: certification.certificationName,
        offeredBy: certification.offeredBy || "",
        completedAt: certification.completedAt ? certification.completedAt.split('T')[0] : "", // Format for date input
        link: certification.link || "",
        remarks: certification.remarks || "",
        isPublic: certification.isPublic,
      });
    }
  }, [certification, open, form]);

  const onSubmit = async (formData: FormSchema) => {
    if (!certification) return;

    try {
      const payload = {
        ...formData,
        offeredBy: formData.offeredBy || undefined,
        link: formData.link || undefined,
        remarks: formData.remarks || undefined,
      };
      
      const response = await axios.put(`/api/teacher/certifications?id=${certification.id}`, payload);
      
      if (response.status !== 200) {
        throw new Error("Failed to update certification");
      }

      onOpenChange(false);
      onSuccess();
      toast.success("Certification updated successfully");
    } catch (error) {
      console.error("Failed to update certification:", error);
      toast.error("Failed to update certification");
    }
  };

  if (!certification) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="border-b bg-gradient-to-r from-purple-800 to-purple-900 text-white p-6">
          <DialogTitle className="text-2xl font-bold text-center">Edit Certification</DialogTitle>
          <div className="flex justify-center mt-2">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-medium">
              {certification.isPublic ? "Public" : "Private"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-col min-h-0 flex-1">
          <ScrollArea className="flex-1 px-6 py-4">
            <Form {...form}>
              <form id="edit-certification-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Certification Details */}
                <Card className="border-2 border-purple-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Certification Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certification Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., AWS Certified Solutions Architect" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="certificationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certification Type *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Professional Certification, Course Certificate" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="offeredBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Offered By</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Amazon Web Services, Microsoft" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remarks</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any additional notes or comments about this certification"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Completion Date */}
                <Card className="border-2 border-blue-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Completion Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="completedAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Completion Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Certificate Link */}
                <Card className="border-2 border-green-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Certificate Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="link"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certificate URL</FormLabel>
                          <FormControl>
                            <Input 
                              type="url" 
                              placeholder="https://www.example.com/certificate"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Settings */}
                <Card className="border-2 border-gray-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
                    <CardTitle>Visibility Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">Make Public</FormLabel>
                            <div className="text-sm text-gray-600">
                              Allow others to view this certification record
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </form>
            </Form>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="border-t bg-white p-6 flex-shrink-0">
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" form="edit-certification-form" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Certification
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
