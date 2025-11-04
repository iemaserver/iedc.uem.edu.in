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
import { CalendarIcon, Activity, DollarSign } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "react-hot-toast";
import { PublicationStatus } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  transactionName: z.string().min(2, "Transaction name is required"),
  typeOfTransaction: z.string().optional(),
  indexOfTransaction: z.string().optional(),
  impactFactor: z.number().optional(),
  impactFactorDate: z.date().optional(),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.date(),
  paperLinkDOI: z.string().url("Invalid URL").optional().or(z.literal("")),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  isPublic: z.boolean(),
});

type EditFormSchema = z.infer<typeof editSchema>;

// Props
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  onSuccess: () => void;
}

export default function EditTransactionDialog({ 
  open, 
  onOpenChange, 
  transactionId, 
  onSuccess 
}: Props) {
  
  const form = useForm<EditFormSchema>({
    resolver: zodResolver(editSchema),
    defaultValues: { 
      transactionName: "",
      typeOfTransaction: "",
      indexOfTransaction: "",
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

  // Load existing transaction data
  React.useEffect(() => {
    if (open && transactionId) {
      const loadTransaction = async () => {
        try {
          const response = await axios.get(`/api/teacher/transactions?id=${transactionId}`);
          const transaction = response.data.data[0];
          
          if (transaction) {
            form.reset({
              transactionName: transaction.transactionName,
              typeOfTransaction: transaction.typeOfTransaction || "",
              indexOfTransaction: transaction.indexOfTransaction || "",
              impactFactor: transaction.impactFactor || undefined,
              impactFactorDate: transaction.impactFactorDate ? new Date(transaction.impactFactorDate) : undefined,
              publisher: transaction.publisher || "",
              status: transaction.status,
              statusDate: new Date(transaction.statusDate),
              paperLinkDOI: transaction.paperLinkDOI || "",
              registrationFees: transaction.registrationFees || undefined,
              reimbursementStatus: transaction.reimbursementStatus || "",
              isPublic: transaction.isPublic,
            });
          }
        } catch (error) {
          toast.error("Failed to load transaction data");
        }
      };
      loadTransaction();
    }
  }, [open, transactionId, form]);

  const onSubmit = async (data: EditFormSchema) => {
    try {
      const payload = {
        transactionName: data.transactionName,
        typeOfTransaction: data.typeOfTransaction || undefined,
        indexOfTransaction: data.indexOfTransaction || undefined,
        impactFactor: data.impactFactor || undefined,
        impactFactorDate: data.impactFactorDate || null,
        publisher: data.publisher || undefined,
        status: data.status,
        statusDate: data.statusDate,
        paperLinkDOI: data.paperLinkDOI || undefined,
        registrationFees: data.registrationFees || undefined,
        reimbursementStatus: data.reimbursementStatus || undefined,
        isPublic: data.isPublic,
      };

      console.log("Updating transaction:", payload);
      const response = await axios.put(`/api/teacher/transactions?id=${transactionId}`, payload);

      if (response.status === 200) {
        toast.success("Transaction updated successfully!");
        onSuccess();
        onOpenChange(false);
        form.reset();
      }
    } catch (error) {
      console.error("Failed to update transaction:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Failed to update transaction";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to update transaction");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-5xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-2 border-blue-200 dark:border-slate-700 shadow-2xl">
        <DialogHeader className="flex-shrink-0 border-b border-blue-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white p-6 -m-6 mb-6 rounded-t-lg">
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            ✏️ Edit Transaction
          </DialogTitle>
          <p className="text-sm text-blue-100 text-center mt-2 font-medium">
            Update your transaction information with ease
          </p>
        </DialogHeader>
        
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-4 py-2 scroll-smooth">
            <Form {...form}>
              <form id="edit-transaction-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-8">
                
                {/* Basic Information Section */}
                <div className="bg-gradient-to-r from-white to-blue-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border-2 border-blue-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">📝</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Basic Information</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="transactionName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold text-slate-700 dark:text-slate-300">Transaction Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter transaction name..." 
                              className="h-12 text-base border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200"
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
                        name="typeOfTransaction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300">Type of Transaction</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Journal Publication, Conference" 
                                className="h-12 text-base border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-blue-500 transition-all duration-200"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="indexOfTransaction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300">Index/Category</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., SCI, Scopus, IEEE" 
                                className="h-12 text-base border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-blue-500 transition-all duration-200"
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
                          <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300">Publisher</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter publisher name" 
                              className="h-12 text-base border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-blue-500 transition-all duration-200"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Status and Impact Section */}
                <div className="bg-gradient-to-r from-white to-green-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border-2 border-green-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Status & Impact</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300">Publication Status *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-slate-300 dark:border-slate-600 rounded-lg">
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
                          <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300">Status Date *</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value}
                              onSelect={(selectedDate) => {
                                field.onChange(selectedDate);
                              }}
                              placeholder="Select status date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="impactFactor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300">Impact Factor</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.001"
                              placeholder="e.g., 2.345" 
                              className="h-12 text-base border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-green-500 transition-all duration-200"
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
                          <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300">Impact Factor Date</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value}
                              onSelect={(selectedDate) => {
                                field.onChange(selectedDate);
                              }}
                              placeholder="Select impact factor date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Financial and Links Section */}
                <div className="bg-gradient-to-r from-white to-purple-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border-2 border-purple-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Financial & Links</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="registrationFees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300">Registration Fees (₹)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.01"
                                placeholder="e.g., 5000.00" 
                                className="h-12 text-base border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-purple-500 transition-all duration-200"
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
                            <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300">Reimbursement Status</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Pending, Approved, Rejected" 
                                className="h-12 text-base border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-purple-500 transition-all duration-200"
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
                          <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300">Paper Link/DOI</FormLabel>
                          <FormControl>
                            <Input 
                              type="url"
                              placeholder="https://doi.org/10.xxxx/xxxxx or paper URL" 
                              className="h-12 text-base border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-purple-500 transition-all duration-200"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                            When enabled, other users will be able to view this transaction information
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
                onClick={() => onOpenChange(false)}
                className="h-12 px-8 order-2 sm:order-1 border-2 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 font-semibold transition-all duration-200"
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                form="edit-transaction-form"
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
                    Update Transaction
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
