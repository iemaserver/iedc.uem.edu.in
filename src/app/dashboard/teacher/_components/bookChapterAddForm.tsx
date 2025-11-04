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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  Plus,
  DollarSign,
  Hash,
  BookOpen,
  CheckCircle,
  Star,
  Eye,
  EyeOff,
  FileText,
  CreditCard,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PublicationStatus } from "@prisma/client";
import {
  glassmorphismPresets,
  glassmorphismColorSchemes,
  glassmorphismStyles,
  glassmorphismAnimations,
} from "@/lib/glassmorphism";

// ---------------- Validation ----------------
const formSchema = z.object({
  status: z.nativeEnum(PublicationStatus),
  name: z.string().min(2, "Chapter name is required"),
  registrationFees: z.number().positive().optional(),
  reimbursementStatus: z.string().optional(),
  isbnIssn: z.string().optional(),
  isPublic: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

// ---------------- Props ----------------
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ---------------- Component ----------------
export function AddBookChapterDrawer({ open, onOpenChange, onSuccess }: Props) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: PublicationStatus.COMMUNICATED,
      name: "",
      registrationFees: undefined,
      reimbursementStatus: "",
      isbnIssn: "",
      isPublic: false,
    },
  });

  const onSubmit = async (formData: FormSchema) => {
    try {
      const payload = {
        ...formData,
        registrationFees: formData.registrationFees || undefined,
        reimbursementStatus: formData.reimbursementStatus || undefined,
        isbnIssn: formData.isbnIssn || undefined,
      };

      const response = await axios.post("/api/teacher/book-chapters", payload);

      if (response.status !== 201) {
        throw new Error("Failed to create book chapter");
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
      toast.success("Book chapter added successfully");
    } catch (error) {
      console.error("Failed to add book chapter:", error);
      toast.error("Failed to add book chapter");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${glassmorphismPresets.formDialog} max-w-5xl h-[92vh] flex flex-col overflow-hidden border-0`}
      >
        {/* Sticky Header */}
        <DialogHeader
          className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-br ${glassmorphismColorSchemes.bookChapter.gradient} p-6 rounded-t-2xl -m-6 mb-0 shadow-md`}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold text-white text-center">
                Add New Book Chapter
              </DialogTitle>
              <p className="text-violet-100 text-center mt-1 text-lg">
                Create a new book chapter publication record
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Star className="w-4 h-4 text-yellow-300" />
            <span className="text-sm text-violet-100">
              Advance your academic portfolio
            </span>
            <Star className="w-4 h-4 text-yellow-300" />
          </div>
        </DialogHeader>

        {/* Form with scrollable content */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <ScrollArea className="flex-1 pr-4 h-[calc(92vh-200px)]">
            <Form {...form}>
              <div className="space-y-8 py-6">
                {/* ---------------- Chapter Info ---------------- */}
                <Card
                  className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10`}
                >
                  <CardHeader
                    className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-violet-500/90 to-purple-600/90 text-white rounded-t-xl`}
                  >
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      Chapter Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className={glassmorphismAnimations.slideIn}>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <CheckCircle className="w-4 h-4 text-violet-500" />
                            Chapter Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Advanced Machine Learning Techniques"
                              className={`${glassmorphismPresets.formInput} h-12 text-lg focus:ring-2 focus:ring-violet-400/30`}
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
                        name="status"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              <FileText className="w-4 h-4 text-blue-500" />
                              Publication Status *
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={`${glassmorphismPresets.formInput} h-12`}
                                >
                                  <SelectValue placeholder="Select publication status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent
                                className={glassmorphismStyles.floatingCard}
                              >
                                <SelectItem
                                  value={PublicationStatus.COMMUNICATED}
                                  className="text-orange-600 font-medium"
                                >
                                  📝 Communicated
                                </SelectItem>
                                <SelectItem
                                  value={PublicationStatus.ACCEPTED}
                                  className="text-blue-600 font-medium"
                                >
                                  ✅ Accepted
                                </SelectItem>
                                <SelectItem
                                  value={PublicationStatus.PUBLISHED}
                                  className="text-green-600 font-medium"
                                >
                                  🎉 Published
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isbnIssn"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              <Hash className="w-4 h-4 text-green-500" />
                              ISBN/ISSN
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 978-3-16-148410-0"
                                className={`${glassmorphismPresets.formInput} h-12`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                            <p className="text-xs text-gray-500 mt-1">
                              International Standard Book/Serial Number
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* ---------------- Financial Info ---------------- */}
                <Card
                  className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10`}
                >
                  <CardHeader
                    className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-purple-500/90 to-pink-600/90 text-white rounded-t-xl`}
                  >
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
                            <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              Registration Fees (₹)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g., 2500.00"
                                className={`${glassmorphismPresets.formInput} h-12`}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined
                                  )
                                }
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                            <p className="text-xs text-gray-500 mt-1">
                              Publication or processing fees paid
                            </p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reimbursementStatus"
                        render={({ field }) => (
                          <FormItem className={glassmorphismAnimations.slideIn}>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                              Reimbursement Status
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Pending, Approved, Completed"
                                className={`${glassmorphismPresets.formInput} h-12`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                            <p className="text-xs text-gray-500 mt-1">
                              Current status of fee reimbursement
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* ---------------- Privacy ---------------- */}
                <Card
                  className={`${glassmorphismPresets.formCard} border-0 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10`}
                >
                  <CardHeader
                    className={`${glassmorphismStyles.dialogHeader} bg-gradient-to-r from-indigo-500/90 to-blue-600/90 text-white rounded-t-xl`}
                  >
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
                        <FormItem
                          className={`${glassmorphismAnimations.slideIn} flex flex-row items-center justify-between p-6 rounded-xl ${glassmorphismStyles.formSection} border-0`}
                        >
                          <div className="space-y-2">
                            <FormLabel className="flex items-center gap-2 text-lg font-medium text-gray-700 dark:text-gray-200">
                              {field.value ? (
                                <Eye className="w-5 h-5 text-green-500" />
                              ) : (
                                <EyeOff className="w-5 h-5 text-gray-500" />
                              )}
                              Make Public
                            </FormLabel>
                            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                              {field.value
                                ? "This book chapter will be visible to others and included in your public profile."
                                : "This book chapter will remain private and only visible to you."}
                            </p>
                          </div>
                          <FormControl>
                            <div className="p-1 bg-white/50 rounded-full backdrop-blur-sm">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-violet-500"
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
            {/* Sticky Footer */}
            <div
              className={`${glassmorphismPresets.formFooter}  mt-6 rounded-b-2xl -mx-6 -mb-6 px-6 py-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md`}
            >
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
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className={`${glassmorphismPresets.primaryButton} h-12 px-8 text-base font-medium bg-gradient-to-r ${glassmorphismColorSchemes.bookChapter.gradient}`}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Adding Chapter...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" />
                      Add Chapter
                    </>
                  )}
                </Button>
              </div>
            </div>{" "}
          </ScrollArea>
        </form>
      </DialogContent>
    </Dialog>
  );
}
