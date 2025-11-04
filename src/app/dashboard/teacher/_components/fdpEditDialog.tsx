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
import { Loader2, Save, Calendar, Clock, MapPin, DollarSign, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FDPStatus } from "@prisma/client";

const formSchema = z.object({
  title: z.string().min(2, "FDP title is required"),
  organizer: z.string().min(2, "Organizer is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  duration: z.number().positive("Duration must be positive"),
  topics: z.string().optional(),
  location: z.string().optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  status: z.nativeEnum(FDPStatus),
  isPublic: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface FDP {
  id: string;
  title: string;
  organizer: string;
  startDate: string;
  endDate: string;
  duration: number;
  topics?: string | null;
  location?: string | null;
  registrationFees?: number | null;
  reimbursementStatus?: string | null;
  status: FDPStatus;
  isPublic: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fdp: FDP | null;
  onSuccess: () => void;
}

export function EditFDPDialog({ open, onOpenChange, fdp, onSuccess }: Props) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      organizer: "",
      startDate: "",
      endDate: "",
      duration: 1,
      topics: "",
      location: "",
      registrationFees: undefined,
      reimbursementStatus: "",
      status: FDPStatus.UPCOMING,
      isPublic: false,
    },
  });

  React.useEffect(() => {
    if (fdp && open) {
      form.reset({
        title: fdp.title,
        organizer: fdp.organizer,
        startDate: fdp.startDate.split('T')[0], // Format for date input
        endDate: fdp.endDate.split('T')[0], // Format for date input
        duration: fdp.duration,
        topics: fdp.topics || "",
        location: fdp.location || "",
        registrationFees: fdp.registrationFees || undefined,
        reimbursementStatus: fdp.reimbursementStatus || "",
        status: fdp.status,
        isPublic: fdp.isPublic,
      });
    }
  }, [fdp, open, form]);

  const onSubmit = async (formData: FormSchema) => {
    if (!fdp) return;

    try {
      const payload = {
        ...formData,
        topics: formData.topics || undefined,
        location: formData.location || undefined,
        registrationFees: formData.registrationFees || undefined,
        reimbursementStatus: formData.reimbursementStatus || undefined,
      };
      
      const response = await axios.put(`/api/teacher/fdps?id=${fdp.id}`, payload);
      
      if (response.status !== 200) {
        throw new Error("Failed to update FDP");
      }

      onOpenChange(false);
      onSuccess();
      toast.success("FDP updated successfully");
    } catch (error) {
      console.error("Failed to update FDP:", error);
      toast.error("Failed to update FDP");
    }
  };

  const getStatusBadgeColor = (status: FDPStatus) => {
    switch (status) {
      case FDPStatus.UPCOMING:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case FDPStatus.ONGOING:
        return "bg-green-100 text-green-800 border-green-200";
      case FDPStatus.COMPLETED:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case FDPStatus.CANCELLED:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!fdp) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="border-b bg-gradient-to-r from-indigo-800 to-indigo-900 text-white p-6">
          <DialogTitle className="text-2xl font-bold text-center">Edit FDP</DialogTitle>
          <div className="flex justify-center mt-2">
            <Badge className={`${getStatusBadgeColor(fdp.status)} font-medium`}>
              {fdp.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-col min-h-0 flex-1">
          <ScrollArea className="flex-1 px-6 py-4">
            <Form {...form}>
              <form id="edit-fdp-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Program Information */}
                <Card className="border-2 border-indigo-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Program Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>FDP Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Faculty Development Program title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="organizer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organizer *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., IIT Delhi, NPTEL" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={FDPStatus.UPCOMING}>Upcoming</SelectItem>
                                <SelectItem value={FDPStatus.ONGOING}>Ongoing</SelectItem>
                                <SelectItem value={FDPStatus.COMPLETED}>Completed</SelectItem>
                                <SelectItem value={FDPStatus.CANCELLED}>Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="topics"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topics/Subjects Covered</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of topics covered in the FDP"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Schedule & Location */}
                <Card className="border-2 border-blue-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Schedule & Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (Days) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 5"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location/Venue</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Online, IIT Delhi, New Delhi" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Financial Details */}
                <Card className="border-2 border-purple-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Financial Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="registrationFees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration Fees (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g., 5000"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reimbursementStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reimbursement Status</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Approved, Pending, Not Applicable" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                              Allow others to view this FDP record
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
              <Button type="submit" form="edit-fdp-form" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update FDP
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
