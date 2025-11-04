"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, X, Check, AlertCircle, User, Calendar, DollarSign, Activity, Users, MapPin, Star, BookOpen, FileText, Globe } from "lucide-react";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddJournalDialog({ open, onOpenChange, onSuccess }: Props) {
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

  const onSubmit = async (formData: FormSchema) => {
    try {
      const payload = {
        ...formData,
        statusDate: formData.statusDate.toISOString(),
        impactFactorDate: formData.impactFactorDate?.toISOString(),
        paperLinkDOI: formData.paperLinkDOI || undefined,
        registrationFees: formData.registrationFees || undefined,
        impactFactor: formData.impactFactor || undefined,
        typeOfJournal: formData.typeOfJournal || undefined,
        indexOfJournal: formData.indexOfJournal || undefined,
        publisher: formData.publisher || undefined,
        reimbursementStatus: formData.reimbursementStatus || undefined,
      };
      
      console.log("Submitting journal:", payload);
      const response = await axios.post("/api/teacher/journals", payload);
      
      if (response.status !== 201) {
        throw new Error("Failed to create journal");
      }

      form.reset({
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
      });
      
      onOpenChange(false);
      onSuccess();
      toast.success("Journal added successfully");
    } catch (error) {
      console.error("Failed to add journal:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Failed to add journal";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to add journal");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${glassmorphismPresets.formDialog} w-[95vw] max-w-6xl h-[95vh] border-0 p-0 flex flex-col`}>
        <DialogHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-br ${glassmorphismColorSchemes.journal.gradient} p-4 md:p-6 rounded-t-2xl flex-shrink-0`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2 md:p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl md:text-3xl font-bold text-white text-center">
                Add New Journal
              </DialogTitle>
              <p className="text-blue-100 text-center mt-1 text-base md:text-lg">
                Register a new journal publication
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 md:mt-4">
            <Star className="w-4 h-4 text-yellow-300" />
            <span className="text-xs md:text-sm text-blue-100">Enhance your research profile</span>
            <Star className="w-4 h-4 text-yellow-300" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 md:p-6 space-y-6 md:space-y-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
                
                {/* Basic Information Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-blue-500/90 to-indigo-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-semibold">
                      <div className="p-1.5 md:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FileText className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      Journal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                    <FormField
                      control={form.control}
                      name="journalName"
                      render={({ field }) => (
                        <FormItem className={glassmorphismAnimations.slideIn}>
                          <FormLabel className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300">Journal Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter journal name"
                              className={`${glassmorphismPresets.formInput} h-10 md:h-12 text-sm md:text-base`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      <FormField
                        control={form.control}
                        name="typeOfJournal"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300">Type of Journal</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., International, National, Review"
                                className={`${glassmorphismPresets.formInput} h-10 md:h-12 text-sm md:text-base`}
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
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300">Index/Category</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., SCI, SCOPUS, SCIE"
                                className={`${glassmorphismPresets.formInput} h-10 md:h-12 text-sm md:text-base`}
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
                        <FormItem className={glassmorphismAnimations.slideIn}>
                          <FormLabel className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300">Publisher</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter publisher name"
                              className={`${glassmorphismPresets.formInput} h-10 md:h-12 text-sm md:text-base`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Impact Factor Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-purple-500/90 to-pink-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-semibold">
                      <div className="p-1.5 md:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Star className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      Impact Factor Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      <FormField
                        control={form.control}
                        name="impactFactor"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300">Impact Factor</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.001"
                                placeholder="e.g., 2.345"
                                className={`${glassmorphismPresets.formInput} h-10 md:h-12 text-sm md:text-base`}
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
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300">Impact Factor Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className={`${glassmorphismPresets.formInput} w-full h-10 md:h-12 text-sm md:text-base`}
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

                {/* Status & Timeline Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-green-500/90 to-emerald-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-semibold">
                      <div className="p-1.5 md:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Activity className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      Status & Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300">Publication Status *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className={`${glassmorphismPresets.formInput} h-10 md:h-12 text-sm md:text-base`}>
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
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300">Status Date *</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className={`${glassmorphismPresets.formInput} w-full h-10 md:h-12 text-sm md:text-base`}
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

                {/* Financial & Links Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-orange-500/90 to-red-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-semibold">
                      <div className="p-1.5 md:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      Financial & Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      <FormField
                        control={form.control}
                        name="registrationFees"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300">Registration Fees (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g., 3000.00"
                                className={`${glassmorphismPresets.formInput} h-10 md:h-12 text-sm md:text-base`}
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
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300">Reimbursement Status</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Pending, Approved, Rejected"
                                className={`${glassmorphismPresets.formInput} h-10 md:h-12 text-sm md:text-base`}
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
                        <FormItem className={glassmorphismAnimations.slideIn}>
                          <FormLabel className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300">Paper Link/DOI</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://doi.org/10.xxxx/xxxxx or paper URL"
                              className={`${glassmorphismPresets.formInput} h-10 md:h-12 text-sm md:text-base`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Visibility Settings Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-slate-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-slate-500/90 to-gray-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-semibold">
                      <div className="p-1.5 md:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Globe className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      Visibility Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className={`${glassmorphismAnimations.slideIn} flex flex-row items-center justify-between rounded-lg border border-white/20 p-4 backdrop-blur-sm bg-white/10`}>
                          <div className="space-y-0.5">
                            <FormLabel className="text-base md:text-lg font-medium text-slate-700 dark:text-slate-300">
                              Make Public
                            </FormLabel>
                            <div className="text-sm md:text-base text-slate-600 dark:text-slate-400">
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
                
                {/* Submit Button inside form */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)} 
                    disabled={form.formState.isSubmitting}
                    className={`${glassmorphismPresets.secondaryButton} h-10 md:h-12 px-6 md:px-8 text-sm md:text-base font-medium`}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={form.formState.isSubmitting}
                    className={`${glassmorphismPresets.primaryButton} h-10 md:h-12 px-6 md:px-8 text-sm md:text-base font-medium bg-gradient-to-r ${glassmorphismColorSchemes.journal.gradient}`}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                        Adding Journal...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                        Add Journal
                      </>
                    )}
                  </Button>
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
