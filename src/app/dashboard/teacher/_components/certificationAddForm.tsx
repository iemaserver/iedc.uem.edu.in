"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "react-hot-toast";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Plus, Award, Calendar, Shield, Star, CheckCircle, Link, Eye, EyeOff } from "lucide-react";
import { glassmorphismPresets, glassmorphismColorSchemes, glassmorphismStyles, glassmorphismAnimations } from "@/lib/glassmorphism";

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CertificationAddForm({ open, onOpenChange, onSuccess }: Props) {
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

  const onSubmit = async (formData: FormSchema) => {
    try {
      const payload = {
        ...formData,
        offeredBy: formData.offeredBy || undefined,
        link: formData.link || undefined,
        remarks: formData.remarks || undefined,
      };

      const response = await axios.post("/api/teacher/certifications", payload);
      
      if (response.status !== 201) {
        throw new Error("Failed to create certification");
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
      toast.success("Certification added successfully");
    } catch (error) {
      console.error("Failed to create certification:", error);
      toast.error("Failed to add certification");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${glassmorphismPresets.formDialog} w-[95vw] max-w-6xl h-[95vh] border-0 p-0 flex flex-col`}>
        <DialogHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-br ${glassmorphismColorSchemes.certification.gradient} p-4 md:p-6 rounded-t-2xl flex-shrink-0`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2 md:p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Award className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl md:text-3xl font-bold text-white text-center">
                Add New Certification
              </DialogTitle>
              <p className="text-emerald-100 text-center mt-1 text-base md:text-lg">
                Create a professional certification record
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 md:mt-4">
            <Star className="w-4 h-4 text-yellow-300" />
            <span className="text-xs md:text-sm text-emerald-100">Enhance your professional profile</span>
            <Star className="w-4 h-4 text-yellow-300" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 md:p-6 space-y-6 md:space-y-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
                
                {/* Basic Information Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-emerald-500/90 to-teal-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-semibold">
                      <div className="p-1.5 md:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Award className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      Certification Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className={glassmorphismAnimations.slideIn}>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            Certification Name *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., AWS Certified Solutions Architect" 
                              className={`${glassmorphismPresets.formInput} h-10 md:h-12 text-base md:text-lg focus:ring-2 focus:ring-emerald-400/30`}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                      <FormField
                        control={form.control}
                        name="certificationName"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              Certification Type *
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Professional Certification, Course Certificate" 
                                className={`${glassmorphismPresets.formInput} h-10 md:h-12`}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="offeredBy"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-500" />
                              Offered By
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Amazon Web Services, Microsoft" 
                                className={`${glassmorphismPresets.formInput} h-10 md:h-12`}
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
                      name="remarks"
                      render={({ field }) => (
                        <FormItem className={glassmorphismAnimations.slideIn}>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Remarks & Additional Notes
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any additional notes, achievements, or comments about this certification..."
                              className={`${glassmorphismPresets.formInput} min-h-[100px] md:min-h-[120px] resize-none`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Timeline Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-blue-500/90 to-indigo-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-semibold">
                      <div className="p-1.5 md:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      Completion Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <FormField
                      control={form.control}
                      name="completedAt"
                      render={({ field }) => (
                        <FormItem className={glassmorphismAnimations.slideIn}>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            Completion Date *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              className={`${glassmorphismPresets.formInput} h-10 md:h-12 text-base md:text-lg`}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Certificate Link Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-green-500/90 to-emerald-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-semibold">
                      <div className="p-1.5 md:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Link className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      Certificate Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <FormField
                      control={form.control}
                      name="link"
                      render={({ field }) => (
                        <FormItem className={glassmorphismAnimations.slideIn}>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Link className="w-4 h-4 text-green-500" />
                            Certificate URL
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="url" 
                              placeholder="https://www.example.com/certificate"
                              className={`${glassmorphismPresets.formInput} h-10 md:h-12`}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                          <p className="text-xs text-gray-500 mt-1">
                            Add a link to your digital certificate or verification page
                          </p>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Visibility Settings Card */}
                <Card className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10`}>
                  <CardHeader className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-purple-500/90 to-pink-600/90 text-white rounded-t-xl`}>
                    <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-semibold">
                      <div className="p-1.5 md:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Eye className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      Privacy Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className={`${glassmorphismAnimations.slideIn} flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 rounded-xl ${glassmorphismStyles.formSection} border-0 gap-4`}>
                          <div className="space-y-2">
                            <FormLabel className="text-base md:text-lg font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                              {field.value ? (
                                <Eye className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                              ) : (
                                <EyeOff className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                              )}
                              Make Public
                            </FormLabel>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-md">
                              {field.value 
                                ? "This certification will be visible to others and included in your public profile."
                                : "This certification will remain private and only visible to you."
                              }
                            </p>
                          </div>
                          <FormControl>
                            <div className="p-1 bg-white/50 rounded-full backdrop-blur-sm flex-shrink-0">
                              <Switch 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-green-500"
                              />
                            </div>
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
                    className={`${glassmorphismPresets.primaryButton} h-10 md:h-12 px-6 md:px-8 text-sm md:text-base font-medium bg-gradient-to-r ${glassmorphismColorSchemes.certification.gradient}`}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                        Adding Certification...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                        Add Certification
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