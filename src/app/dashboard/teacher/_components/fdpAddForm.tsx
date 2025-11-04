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
import { Loader2, Plus, Calendar, Clock, MapPin, DollarSign, BookOpen, CheckCircle, Star, Eye, EyeOff, Users, Building, CreditCard, Target } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { glassmorphismPresets, glassmorphismColorSchemes, glassmorphismStyles, glassmorphismAnimations } from "@/lib/glassmorphism";

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
  isPublic: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FDPAddForm({ open, onOpenChange, onSuccess }: Props) {
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
      isPublic: false,
    },
  });

  const onSubmit = async (formData: FormSchema) => {
    try {
      const payload = {
        ...formData,
        topics: formData.topics || undefined,
        location: formData.location || undefined,
        registrationFees: formData.registrationFees || undefined,
        reimbursementStatus: formData.reimbursementStatus || undefined,
      };
      
      const response = await axios.post("/api/teacher/fdps", payload);
      
      if (response.status !== 201) {
        throw new Error("Failed to create FDP");
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
      toast.success("FDP added successfully");
    } catch (error) {
      console.error("Failed to create FDP:", error);
      toast.error("Failed to add FDP");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${glassmorphismPresets.formDialog} max-w-5xl h-[92vh] overflow-hidden border-0`}>
        <DialogHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-br ${glassmorphismColorSchemes.fdp.gradient} p-6 rounded-t-2xl -m-6 mb-0`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold text-white text-center">
                Add New FDP
              </DialogTitle>
              <p className="text-blue-100 text-center mt-1 text-lg">
                Create a Faculty Development Program record
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Star className="w-4 h-4 text-yellow-300" />
            <span className="text-sm text-blue-100">Enhance your academic journey</span>
            <Star className="w-4 h-4 text-yellow-300" />
          </div>
        </DialogHeader>

        <div className="flex flex-col min-h-0 flex-1 p-6">
          <ScrollArea className={`${glassmorphismStyles.scrollArea} flex-1 pr-4`}>
            <Form {...form}>
              <div className="space-y-8">
                
                {/* Program Information Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-blue-500/90 to-indigo-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      Program Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className={glassmorphismAnimations.slideIn}>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                            FDP Title *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Advances in Machine Learning & AI" 
                              className={`${glassmorphismPresets.formInput} h-12 text-lg focus:ring-2 focus:ring-blue-400/30`}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="organizer"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Building className="w-4 h-4 text-purple-500" />
                              Organizer *
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., IIT Delhi, NPTEL, AICTE" 
                                className={`${glassmorphismPresets.formInput} h-12`}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-green-500" />
                              Duration (Days) *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 5"
                                className={`${glassmorphismPresets.formInput} h-12`}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="topics"
                      render={({ field }) => (
                        <FormItem className={glassmorphismAnimations.slideIn}>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Target className="w-4 h-4 text-orange-500" />
                            Topics/Subjects Covered
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of topics, modules, and key learning outcomes covered in the FDP..."
                              className={`${glassmorphismPresets.formInput} min-h-[120px] resize-none`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Schedule & Location Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-indigo-500/90 to-purple-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Calendar className="w-5 h-5" />
                      </div>
                      Schedule & Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-green-500" />
                              Start Date *
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                className={`${glassmorphismPresets.formInput} h-12`}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-red-500" />
                              End Date *
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                className={`${glassmorphismPresets.formInput} h-12`}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className={glassmorphismAnimations.slideIn}>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            Location/Venue
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Online, IIT Delhi Campus, New Delhi" 
                              className={`${glassmorphismPresets.formInput} h-12`}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                          <p className="text-xs text-gray-500 mt-1">
                            Specify if it's online, hybrid, or physical location
                          </p>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Financial Details Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-purple-500/90 to-pink-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      Financial Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="registrationFees"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              Registration Fees (₹)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g., 5000.00"
                                className={`${glassmorphismPresets.formInput} h-12`}
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                            <p className="text-xs text-gray-500 mt-1">
                              Leave blank if the FDP is free
                            </p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reimbursementStatus"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                              Reimbursement Status
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Approved, Pending, Not Applicable" 
                                className={`${glassmorphismPresets.formInput} h-12`}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                            <p className="text-xs text-gray-500 mt-1">
                              Current status of expense reimbursement
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Visibility Settings Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-green-500/90 to-emerald-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Eye className="w-5 h-5" />
                      </div>
                      Privacy Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className={`${glassmorphismAnimations.slideIn} flex flex-row items-center justify-between p-6 rounded-xl ${glassmorphismStyles.formSection} border-0`}>
                          <div className="space-y-2">
                            <FormLabel className="text-lg font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                              {field.value ? (
                                <Eye className="w-5 h-5 text-green-500" />
                              ) : (
                                <EyeOff className="w-5 h-5 text-gray-500" />
                              )}
                              Make Public
                            </FormLabel>
                            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                              {field.value 
                                ? "This FDP record will be visible to others and included in your public profile."
                                : "This FDP record will remain private and only visible to you."
                              }
                            </p>
                          </div>
                          <FormControl>
                            <div className="p-1 bg-white/50 rounded-full backdrop-blur-sm">
                              <Switch 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </Form>
          </ScrollArea>

          {/* Enhanced Footer */}
          <div className={`${glassmorphismPresets.formFooter} mt-6 rounded-b-2xl -mx-6 -mb-6 px-6 py-4`}>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={form.formState.isSubmitting}
                className={`${glassmorphismPresets.secondaryButton} h-12 px-8 text-base font-medium`}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={form.handleSubmit(onSubmit)} 
                disabled={form.formState.isSubmitting}
                className={`${glassmorphismPresets.primaryButton} h-12 px-8 text-base font-medium bg-gradient-to-r ${glassmorphismColorSchemes.fdp.gradient}`}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adding FDP...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Add FDP
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
