"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, Check, AlertCircle, User, Calendar, DollarSign, Activity, Users, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PublicationStatus } from "@prisma/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

const formSchema = z.object({
  mode: z.string().optional(),
  conferenceName: z.string().min(2, "Conference name is required"),
  typeOfConference: z.string().optional(),
  indexOfConference: z.string().optional(),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.date(),
  paperLinkDOI: z.string().url("Invalid URL").optional().or(z.literal("")),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  isPublic: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddConferenceDrawer({ open, onOpenChange, onSuccess }: Props) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "",
      conferenceName: "",
      typeOfConference: "",
      indexOfConference: "",
      publisher: "",
      status: PublicationStatus.COMMUNICATED,
      statusDate: new Date(),
      paperLinkDOI: "",
      registrationFees: undefined,
      reimbursementStatus: "",
      isPublic: false,
    },
  });

  const onSubmit = async (formData: FormSchema) => {
    try {
      const payload = {
        ...formData,
        statusDate: formData.statusDate.toISOString(),
        paperLinkDOI: formData.paperLinkDOI || undefined,
        registrationFees: formData.registrationFees || undefined,
        mode: formData.mode || undefined,
        typeOfConference: formData.typeOfConference || undefined,
        indexOfConference: formData.indexOfConference || undefined,
        publisher: formData.publisher || undefined,
        reimbursementStatus: formData.reimbursementStatus || undefined,
      };
      
      console.log("Submitting conference:", payload);
      const response = await axios.post("/api/teacher/conferences", payload);
      
      if (response.status !== 201) {
        throw new Error("Failed to create conference");
      }

      form.reset({
        mode: "",
        conferenceName: "",
        typeOfConference: "",
        indexOfConference: "",
        publisher: "",
        status: PublicationStatus.COMMUNICATED,
        statusDate: new Date(),
        paperLinkDOI: "",
        registrationFees: undefined,
        reimbursementStatus: "",
        isPublic: false,
      });
      
      onOpenChange(false);
      onSuccess();
      toast.success("Conference added successfully");
    } catch (error) {
      console.error("Failed to add conference:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Failed to add conference";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to add conference");
      }
    }
  };

  const handleClose = () => {
    if (form.formState.isSubmitting) {
      return; // Prevent closing while submitting
    }
    form.reset({
      mode: "",
      conferenceName: "",
      typeOfConference: "",
      indexOfConference: "",
      publisher: "",
      status: PublicationStatus.COMMUNICATED,
      statusDate: new Date(),
      paperLinkDOI: "",
      registrationFees: undefined,
      reimbursementStatus: "",
      isPublic: false,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="w-full h-[90vh] sm:h-[85vh] mt-auto rounded-t-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 flex flex-col">
        <DrawerHeader className="border-b bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-900 flex-shrink-0">
          <DrawerTitle className="text-2xl font-bold text-center text-white">
            Add New Conference
          </DrawerTitle>
          <p className="text-sm text-slate-300 text-center">
            Fill in the details to register a new conference submission
          </p>
        </DrawerHeader>

        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-6 py-3 sm:py-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 dark:scrollbar-thumb-slate-600 dark:scrollbar-track-slate-800 scroll-smooth">
            <Form {...form}>
              <form id="conference-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
                
                {/* Basic Information */}
                <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">1</span>
                      </div>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="conferenceName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Conference Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter conference name"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="mode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Mode</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select conference mode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Online">Online</SelectItem>
                                <SelectItem value="Offline">Offline</SelectItem>
                                <SelectItem value="Hybrid">Hybrid</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="typeOfConference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Type of Conference</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., International, National, Workshop"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="indexOfConference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Index/Category</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., SCI, Scopus, IEEE"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="publisher"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Publisher</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter publisher name"
                                className="h-11"
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

                {/* Status and Timeline */}
                <Card className="border-2 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      Status & Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Publication Status *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={PublicationStatus.COMMUNICATED}>Communicated</SelectItem>
                                <SelectItem value={PublicationStatus.ACCEPTED}>Accepted</SelectItem>
                                <SelectItem value={PublicationStatus.PUBLISHED}>Published</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="statusDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Status Date *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={`w-full h-11 justify-start text-left font-normal ${
                                      !field.value && "text-muted-foreground"
                                    }`}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : "Pick a date"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Financial and Links */}
                <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      Financial & Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="registrationFees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Registration Fees (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g., 5000.00"
                                className="h-11"
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
                            <FormLabel className="text-sm font-medium">Reimbursement Status</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Pending, Approved, Rejected"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="paperLinkDOI"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Paper Link/DOI</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://doi.org/10.xxxx/xxxxx or paper URL"
                              className="h-11"
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
                <Card className="border-2 border-orange-200 dark:border-orange-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">4</span>
                      </div>
                      Visibility Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">
                              Make Public
                            </FormLabel>
                            <div className="text-sm text-gray-600">
                              Allow others to view this conference record
                            </div>
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
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>

          {/* Footer Actions */}
          <div className="border-t bg-white dark:bg-slate-800 p-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={form.formState.isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="conference-form"
                disabled={form.formState.isSubmitting}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Conference...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Conference
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
