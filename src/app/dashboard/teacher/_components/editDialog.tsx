"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "react-hot-toast";

// DatePicker Component using Calendar and Popover
interface DatePickerProps {
  date?: Date;
  onSelect: (date?: Date) => void;
  placeholder?: string;
}

function DatePicker({ date, onSelect, placeholder = "Pick a date" }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full h-12 justify-start text-left font-normal border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 transition-all duration-200 ${
            !date && "text-muted-foreground"
          }`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onSelect(selectedDate);
            setOpen(false);
          }}
          initialFocus
        />
        {date && (
          <div className="p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSelect(undefined);
                setOpen(false);
              }}
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear Date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Form Schema
const editSchema = z.object({
  title: z.string().min(2, "Title is required"),
  filedAt: z.date().optional(),
  submittedAt: z.date().optional(),
  publishedAt: z.date().optional(),
  grantedAt: z.date().optional(),
  isPublic: z.boolean(),
});

type EditFormSchema = z.infer<typeof editSchema>;

// Props
interface Props {
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  copyrightId: string;
  onUpdate: (updated: any) => void;
}

export default function EditCopyrightDialog({ 
  isEditDialogOpen, 
  setIsEditDialogOpen, 
  copyrightId, 
  onUpdate 
}: Props) {
  const [inventors, setInventors] = React.useState<string[]>([]);
  
  const form = useForm<EditFormSchema>({
    resolver: zodResolver(editSchema),
    defaultValues: { 
      title: "", 
      isPublic: false 
    },
  });

  // Load existing copyright data
  React.useEffect(() => {
    if (isEditDialogOpen && copyrightId) {
      const loadCopyright = async () => {
        try {
          const response = await axios.get(`/api/teacher/copyrights?copyrightId=${copyrightId}`);
          const copyright = response.data.data[0];
          
          if (copyright) {
            form.reset({
              title: copyright.title,
              filedAt: copyright.filedAt ? new Date(copyright.filedAt) : undefined,
              submittedAt: copyright.submittedAt ? new Date(copyright.submittedAt) : undefined,
              publishedAt: copyright.publishedAt ? new Date(copyright.publishedAt) : undefined,
              grantedAt: copyright.grantedAt ? new Date(copyright.grantedAt) : undefined,
              isPublic: copyright.isPublic,
            });
            setInventors(copyright.inventors.map((inv: any) => inv.user.fullName));
          }
        } catch (error) {
          toast.error("Failed to load copyright data");
        }
      };
      loadCopyright();
    }
  }, [isEditDialogOpen, copyrightId, form]);

  const onSubmit = async (data: EditFormSchema) => {
    try {
      const payload = {
        title: data.title,
        filedAt: data.filedAt || null,
        submittedAt: data.submittedAt || null,
        publishedAt: data.publishedAt || null,
        grantedAt: data.grantedAt || null,
        isPublic: data.isPublic,
      };

      console.log("Updating copyright:", payload);
      const response = await axios.put(`/api/teacher/copyrights?id=${copyrightId}`, payload);

      if (response.status === 200) {
        toast.success("Copyright updated successfully!");
        onUpdate(response.data);
        setIsEditDialogOpen(false);
        form.reset();
      }
    } catch (error) {
      console.error("Failed to update copyright:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Failed to update copyright";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to update copyright");
      }
    }
  };

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="w-full max-w-5xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-2 border-blue-200 dark:border-slate-700 shadow-2xl">
        <DialogHeader className="flex-shrink-0 border-b border-blue-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white p-6 -m-6 mb-6 rounded-t-lg">
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            ✏️ Edit Copyright
          </DialogTitle>
          <p className="text-sm text-blue-100 text-center mt-2 font-medium">
            Update your copyright information with ease
          </p>
        </DialogHeader>
        
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-4 py-2 scroll-smooth">
            <Form {...form}>
              <form id="edit-copyright-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-8">
                {/* Title Section */}
                <div className="bg-gradient-to-r from-white to-blue-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border-2 border-blue-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">📝</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Copyright Title</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold text-slate-700 dark:text-slate-300">Title *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your copyright title..." 
                            className="h-12 text-base border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Date Fields Section */}
                <div className="bg-gradient-to-r from-white to-green-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border-2 border-green-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">📅</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Important Dates</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(['filedAt', 'submittedAt', 'publishedAt', 'grantedAt'] as const).map((fieldName) => (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName}
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              {fieldName === 'filedAt' ? 'Filed Date' :
                               fieldName === 'submittedAt' ? 'Submitted Date' :
                               fieldName === 'publishedAt' ? 'Published Date' :
                               'Granted Date'}
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value}
                                onSelect={(selectedDate) => {
                                  field.onChange(selectedDate);
                                }}
                                placeholder={`Select ${fieldName === 'filedAt' ? 'filed' :
                                                      fieldName === 'submittedAt' ? 'submitted' :
                                                      fieldName === 'publishedAt' ? 'published' :
                                                      'granted'} date`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Inventors Section */}
                <div className="bg-gradient-to-r from-white to-purple-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border-2 border-purple-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">👥</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Inventors</h3>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-700 dark:to-slate-600 p-4 rounded-lg border border-purple-200 dark:border-slate-500">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Current inventors:</p>
                    <div className="flex flex-wrap gap-2">
                      {inventors.map((inventor, index) => (
                        <Badge key={index} className="bg-purple-100 text-purple-700 border border-purple-300 px-3 py-1">
                          {inventor}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                      Note: Inventor management is handled separately. Contact admin to modify inventors.
                    </p>
                  </div>
                </div>

                {/* Visibility Section */}
                <div className="bg-gradient-to-r from-white to-orange-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border-2 border-orange-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">🌐</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Visibility Settings</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 border-orange-200 dark:border-slate-600 p-6 shadow-sm bg-gradient-to-r from-orange-25 to-orange-50 dark:from-slate-700 dark:to-slate-600">
                        <div className="space-y-2">
                          <FormLabel className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Make Publicly Available
                          </FormLabel>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            When enabled, other users will be able to view this copyright information
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-orange-500"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>

          {/* Enhanced Footer */}
          <div className="flex-shrink-0 border-t-2 border-blue-200 dark:border-slate-700 bg-gradient-to-r from-white via-blue-50 to-white dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 p-6">
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="h-12 px-8 order-2 sm:order-1 border-2 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 font-semibold transition-all duration-200"
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                form="edit-copyright-form"
                className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-semibold order-1 sm:order-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                disabled={form.formState.isSubmitting}
                onClick={form.handleSubmit(onSubmit)}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin mr-3 border-2 border-white border-t-transparent rounded-full" />
                    Updating...
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                    Update Copyright
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