"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X, Activity, DollarSign, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { 
  glassmorphismPresets, 
  glassmorphismStyles, 
  glassmorphismColorSchemes, 
  glassmorphismAnimations 
} from "@/lib/glassmorphism";

const formSchema = z.object({
  journalName: z.string().min(2, "Journal name is required"),
  typeOfJournal: z.string().optional(),
  indexOfJournal: z.string().optional(),
  impactFactor: z.number().positive().optional(),
  impactFactorDate: z.date().optional(),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.date(),
  paperLinkDOI: z.string().url("Invalid URL").optional().or(z.literal("")),
  registrationFees: z.number().positive().optional(),
  reimbursementStatus: z.string().optional(),
  isPublic: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface Journal {
  id: string;
  journalName: string;
  typeOfJournal?: string | null;
  indexOfJournal?: string | null;
  impactFactor?: number | null;
  impactFactorDate?: string | null;
  publisher?: string | null;
  status: PublicationStatus;
  statusDate: string;
  paperLinkDOI?: string | null;
  registrationFees?: number | null;
  reimbursementStatus?: string | null;
  isPublic: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journal: Journal | null;
  onSuccess: () => void;
}

export function EditJournalDialog({ open, onOpenChange, journal, onSuccess }: Props) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      journalName: "",
      typeOfJournal: "",
      indexOfJournal: "",
      impactFactor: undefined,
      impactFactorDate: undefined,
      publisher: "",
      status: PublicationStatus.COMMUNICATED,
      statusDate: new Date(),
      paperLinkDOI: "",
      registrationFees: undefined,
      reimbursementStatus: "",
      isPublic: false,
    },
  });

  React.useEffect(() => {
    if (journal && open) {
      form.reset({
        journalName: journal.journalName,
        typeOfJournal: journal.typeOfJournal || "",
        indexOfJournal: journal.indexOfJournal || "",
        impactFactor: journal.impactFactor || undefined,
        impactFactorDate: journal.impactFactorDate ? new Date(journal.impactFactorDate) : undefined,
        publisher: journal.publisher || "",
        status: journal.status,
        statusDate: journal.statusDate ? new Date(journal.statusDate) : new Date(),
        paperLinkDOI: journal.paperLinkDOI || "",
        registrationFees: journal.registrationFees || undefined,
        reimbursementStatus: journal.reimbursementStatus || "",
        isPublic: journal.isPublic,
      });
    }
  }, [journal, open, form]);

  const onSubmit = async (formData: FormSchema) => {
    if (!journal) return;

    try {
      const payload = {
        ...formData,
        statusDate: formData.statusDate ? formData.statusDate.toISOString() : new Date().toISOString(),
        impactFactorDate: formData.impactFactorDate?.toISOString(),
        paperLinkDOI: formData.paperLinkDOI || undefined,
        registrationFees: formData.registrationFees || undefined,
        impactFactor: formData.impactFactor || undefined,
        typeOfJournal: formData.typeOfJournal || undefined,
        indexOfJournal: formData.indexOfJournal || undefined,
        publisher: formData.publisher || undefined,
        reimbursementStatus: formData.reimbursementStatus || undefined,
      };
      
      console.log("Updating journal:", payload);
      const response = await axios.put(`/api/teacher/journals?id=${journal.id}`, payload);
      
      if (response.status !== 200) {
        throw new Error("Failed to update journal");
      }

      onOpenChange(false);
      onSuccess();
      toast.success("Journal updated successfully");
    } catch (error) {
      console.error("Failed to update journal:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Failed to update journal";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to update journal");
      }
    }
  };

  const handleClose = () => {
    if (form.formState.isSubmitting) {
      return; // Prevent closing while submitting
    }
    onOpenChange(false);
  };

  const getStatusBadgeColor = (status: PublicationStatus) => {
    switch (status) {
      case PublicationStatus.COMMUNICATED:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case PublicationStatus.ACCEPTED:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case PublicationStatus.PUBLISHED:
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!journal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${glassmorphismPresets.formDialog} w-[95vw] max-w-6xl h-[95vh] border-0 p-0 flex flex-col`}>
        <DialogHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-br ${glassmorphismColorSchemes.journal.gradient} p-4 md:p-6 rounded-t-2xl flex-shrink-0`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2 md:p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Save className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl md:text-3xl font-bold text-white text-center">
                Edit Journal
              </DialogTitle>
              <p className="text-blue-100 text-center mt-1 text-base md:text-lg">
                Update journal publication details
              </p>
            </div>
          </div>
          <div className="flex justify-center mt-2 md:mt-4 gap-2">
            <Badge className={`${getStatusBadgeColor(journal.status)} font-medium px-3 py-1 text-xs md:text-sm`}>
              {journal.status}
            </Badge>
            {journal.impactFactor && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-medium px-3 py-1 text-xs md:text-sm">
                <Star className="mr-1 h-3 w-3" />
                IF: {journal.impactFactor}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ScrollArea className="flex-1" data-scroll-area>
            <div className="p-4 md:p-6 space-y-6 md:space-y-8 min-h-0 max-h-full"
                 style={{ maxHeight: 'calc(95vh - 180px)' }}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
                
                {/* Basic Information Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-blue-500/90 to-indigo-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-semibold">
                      <div className="p-1.5 md:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Activity className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="journalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Journal Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter journal name"
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
                        name="typeOfJournal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Type of Journal</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., International, National, Review"
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
                        name="indexOfJournal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Index/Category</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., SCI, SCOPUS, SCIE"
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
                  </CardContent>
                </Card>

                {/* Impact Factor */}
                <Card className="border-2 border-yellow-200 dark:border-yellow-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                  <CardHeader className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                      Impact Factor Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="impactFactor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Impact Factor</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.001"
                                placeholder="e.g., 2.345"
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
                        name="impactFactorDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Impact Factor Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="w-full h-11"
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : undefined;
                                  field.onChange(date);
                                }}
                                max={format(new Date(), "yyyy-MM-dd")}
                                min="1900-01-01"
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
                            <Select onValueChange={field.onChange} value={field.value}>
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
                            <FormControl>
                              <Input
                                type="date"
                                className="w-full h-11"
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : undefined;
                                  field.onChange(date);
                                }}
                                max={format(new Date(), "yyyy-MM-dd")}
                                min="1900-01-01"
                              />
                            </FormControl>
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
                                placeholder="e.g., 3000.00"
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
                        <span className="text-white font-bold text-sm">5</span>
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
                              Allow others to view this journal record
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

                {/* Footer Actions */}
                <div className="border-t bg-gray-50 dark:bg-slate-700 p-6 flex-shrink-0 rounded-b-lg">
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={form.formState.isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Journal
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
