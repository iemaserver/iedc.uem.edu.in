"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "react-hot-toast";
import axios from "axios";
import { 
  Award, 
  DollarSign, 
  Users, 
  Calendar, 
  Save, 
  Loader2 
} from "lucide-react";

// Grant status constants
const GRANT_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE", 
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

// Define the interface for Grant (matching Prisma schema)
interface GrantIn {
  id: string;
  name: string;
  teacherId: string;
  projectCode?: string | null;
  projectPI?: string | null;
  projectCoPI?: string | null;
  status?: string | null;
  appliedAt?: string | null;
  grantedAt?: string | null;
  durationMonths?: number | null;
  grantAmount?: number | null;
  utilizedAmount?: number | null;
  remainingAmount?: number | null;
  publication?: string | null;
  publicationDetails?: string | null;
  isPublic: boolean;
}

// Form schema (matching backend validation schema)
const formSchema = z.object({
  name: z.string().min(1, "Grant name is required"),
  projectCode: z.string().optional(),
  projectPI: z.string().optional(),
  projectCoPI: z.string().optional(),
  status: z.string().optional(),
  appliedAt: z.string().optional(),
  grantedAt: z.string().optional(),
  durationMonths: z.coerce.number().int().optional(),
  grantAmount: z.coerce.number().positive().optional(),
  utilizedAmount: z.coerce.number().optional(),
  remainingAmount: z.coerce.number().optional(),
  publication: z.string().optional(),
  publicationDetails: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type FormSchema = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grant: GrantIn | null;
  onSuccess: () => void;
}

export function EditGrantInDialog({ open, onOpenChange, grant, onSuccess }: Props) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      projectCode: "",
      projectPI: "",
      projectCoPI: "",
      status: "",
      appliedAt: "",
      grantedAt: "",
      durationMonths: undefined,
      grantAmount: undefined,
      utilizedAmount: undefined,
      remainingAmount: undefined,
      publication: "",
      publicationDetails: "",
      isPublic: false,
    },
  });

  React.useEffect(() => {
    if (grant && open) {
      form.reset({
        name: grant.name,
        projectCode: grant.projectCode || "",
        projectPI: grant.projectPI || "",
        projectCoPI: grant.projectCoPI || "",
        status: grant.status || "",
        appliedAt: grant.appliedAt ? grant.appliedAt.split('T')[0] : "",
        grantedAt: grant.grantedAt ? grant.grantedAt.split('T')[0] : "",
        durationMonths: grant.durationMonths || undefined,
        grantAmount: grant.grantAmount || undefined,
        utilizedAmount: grant.utilizedAmount || undefined,
        remainingAmount: grant.remainingAmount || undefined,
        publication: grant.publication || "",
        publicationDetails: grant.publicationDetails || "",
        isPublic: grant.isPublic || false,
      });
    }
  }, [grant, open, form]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case GRANT_STATUS.ACTIVE:
        return "bg-green-100 text-green-800 border-green-200";
      case GRANT_STATUS.COMPLETED:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case GRANT_STATUS.PENDING:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case GRANT_STATUS.CANCELLED:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const onSubmit = async (formData: FormSchema) => {
    if (!grant) return;

    try {
      const payload = {
        ...formData,
        // Convert empty strings to null for optional fields
        projectCode: formData.projectCode || null,
        projectPI: formData.projectPI || null,
        projectCoPI: formData.projectCoPI || null,
        status: formData.status || null,
        appliedAt: formData.appliedAt || null,
        grantedAt: formData.grantedAt || null,
        publication: formData.publication || null,
        publicationDetails: formData.publicationDetails || null,
        // Handle numeric fields properly
        durationMonths: formData.durationMonths || null,
        grantAmount: formData.grantAmount || null,
        utilizedAmount: formData.utilizedAmount || null,
        remainingAmount: formData.remainingAmount || null,
      };

      const response = await axios.put(`/api/teacher/grants?id=${grant.id}`, payload);

      if (response.status !== 200) {
        throw new Error("Failed to update grant");
      }

      onOpenChange(false);
      onSuccess();
      toast.success("Grant updated successfully");
    } catch (error) {
      console.error("Failed to update grant:", error);
      toast.error("Failed to update grant");
    }
  };

  if (!grant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="border-b bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-6">
          <DialogTitle className="text-2xl font-bold text-center">Edit Grant</DialogTitle>
          <div className="flex justify-center mt-2">
            <Badge className={`${getStatusBadgeColor(grant.status || "")} font-medium`}>
              {grant.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-col min-h-0 flex-1">
          <ScrollArea className="flex-1 px-6 py-4">
            <Form {...form}>
              <form id="edit-grant-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Grant Information */}
                <Card className="border-2 border-emerald-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Grant Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grant Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter grant name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="projectCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Code</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., DST/1234/2024" {...field} />
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
                            <FormLabel>Grant Status *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={GRANT_STATUS.PENDING}>Pending</SelectItem>
                                <SelectItem value={GRANT_STATUS.ACTIVE}>Active</SelectItem>
                                <SelectItem value={GRANT_STATUS.COMPLETED}>Completed</SelectItem>
                                <SelectItem value={GRANT_STATUS.CANCELLED}>Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Information */}
                <Card className="border-2 border-blue-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Financial Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="grantAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grant Amount (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="utilizedAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Utilized Amount (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="remainingAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Remaining Amount (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Team Information */}
                <Card className="border-2 border-purple-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Research Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="projectPI"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Principal Investigator (PI)</FormLabel>
                          <FormControl>
                            <Input placeholder="Name of Principal Investigator" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="projectCoPI"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Co-Principal Investigator(s)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Names of Co-Principal Investigators (separate multiple names with commas)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="border-2 border-orange-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Project Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="appliedAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Applied Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="grantedAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Granted Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="durationMonths"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (Months)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                min="0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Publications */}
                <Card className="border-2 border-teal-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                    <CardTitle>Publications</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="publication"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publication Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Title of publication from this grant" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="publicationDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publication Details</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Journal name, volume, issue, pages, DOI, etc."
                              className="min-h-[100px]"
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
                              Allow others to view this grant record
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="edit-grant-form" 
                disabled={form.formState.isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Grant
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