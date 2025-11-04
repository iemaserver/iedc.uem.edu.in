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
import { Loader2, Save, DollarSign, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PublicationStatus } from "@prisma/client";

const formSchema = z.object({
  status: z.nativeEnum(PublicationStatus),
  name: z.string().min(2, "Chapter name is required"),
  registrationFees: z.number().positive().optional(),
  reimbursementStatus: z.string().optional(),
  isbnIssn: z.string().optional(),
  isPublic: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface BookChapter {
  id: string;
  status: PublicationStatus;
  name: string;
  registrationFees?: number | null;
  reimbursementStatus?: string | null;
  isbnIssn?: string | null;
  isPublic: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookChapter: BookChapter | null;
  onSuccess: () => void;
}

export function EditBookChapterDialog({ open, onOpenChange, bookChapter, onSuccess }: Props) {
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

  React.useEffect(() => {
    if (bookChapter && open) {
      form.reset({
        status: bookChapter.status,
        name: bookChapter.name,
        registrationFees: bookChapter.registrationFees || undefined,
        reimbursementStatus: bookChapter.reimbursementStatus || "",
        isbnIssn: bookChapter.isbnIssn || "",
        isPublic: bookChapter.isPublic,
      });
    }
  }, [bookChapter, open, form]);

  const onSubmit = async (formData: FormSchema) => {
    if (!bookChapter) return;

    try {
      const payload = {
        ...formData,
        registrationFees: formData.registrationFees || undefined,
        reimbursementStatus: formData.reimbursementStatus || undefined,
        isbnIssn: formData.isbnIssn || undefined,
      };
      
      const response = await axios.put(`/api/teacher/book-chapters?id=${bookChapter.id}`, payload);
      
      if (response.status !== 200) {
        throw new Error("Failed to update book chapter");
      }

      onOpenChange(false);
      onSuccess();
      toast.success("Book chapter updated successfully");
    } catch (error) {
      console.error("Failed to update book chapter:", error);
      toast.error("Failed to update book chapter");
    }
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

  if (!bookChapter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="border-b bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
          <DialogTitle className="text-2xl font-bold text-center">Edit Book Chapter</DialogTitle>
          <div className="flex justify-center mt-2">
            <Badge className={`${getStatusBadgeColor(bookChapter.status)} font-medium`}>
              {bookChapter.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-col min-h-0 flex-1">
         
            <Form {...form}>
               <ScrollArea className="flex-1 px-6 py-4">
              <form id="edit-book-chapter-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Basic Information */}
                <Card className="border-2 border-blue-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chapter Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter book chapter name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Publication Status *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
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
                        name="isbnIssn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ISBN/ISSN</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter ISBN or ISSN" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                                placeholder="e.g., 2000.00"
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
                              <Input placeholder="e.g., Pending, Approved" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Settings */}
                <Card className="border-2 border-orange-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
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
                              Allow others to view this book chapter record
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
                 <div className="border-t bg-white p-6 flex-shrink-0">
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" form="edit-book-chapter-form" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Chapter
                  </>
                )}
              </Button>
            </div>
          </div>
              </form>
          </ScrollArea>
            </Form>

          {/* Footer Actions */}
         
        </div>
      </DialogContent>
    </Dialog>
  );
}
