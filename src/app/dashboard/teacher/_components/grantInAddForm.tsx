"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Grant status constants
const GRANT_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE", 
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

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
  isPublic: z.boolean().optional().default(false),
});

type FormSchema = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GrantInAddForm({ open, onOpenChange, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      projectCode: "",
      projectPI: "",
      projectCoPI: "",
      status: GRANT_STATUS.PENDING,
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

  const onSubmit = async (formData: FormSchema) => {
    setIsLoading(true);
    try {
      await axios.post("/api/teacher/grants", formData);
      toast.success("Grant added successfully!");
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error adding grant:", error);
      toast.error(error.response?.data?.error || "Failed to add grant");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="border-b bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-6">
          <DialogTitle className="text-2xl font-bold text-center">Add New Grant</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col min-h-0 flex-1">
          <ScrollArea className="flex-1 px-6 py-4">
            <Form {...form}>
              <form id="grant-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-2 border-blue-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grant Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of the grant" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="projectCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Project code/reference" {...field} />
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
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
              </CardContent>
            </Card>

            {/* Investigators */}
            <Card className="border-2 border-green-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardTitle>Investigators</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <FormField
                  control={form.control}
                  name="projectPI"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal Investigator</FormLabel>
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
                      <FormLabel>Co-Principal Investigator</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Name(s) of Co-Principal Investigator(s)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card className="border-2 border-yellow-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="grantAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grant Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                        <FormLabel>Utilized Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                        <FormLabel>Remaining Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-2 border-purple-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardTitle>Timeline</CardTitle>
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
                          <Input type="number" placeholder="Duration in months" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Publications */}
            <Card className="border-2 border-indigo-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                <CardTitle>Publications</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <FormField
                  control={form.control}
                  name="publication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publication</FormLabel>
                      <FormControl>
                        <Input placeholder="Publication title/reference" {...field} />
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
                        <Textarea placeholder="Additional details about the publication..." {...field} />
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
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Make this grant information publicly visible
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          This grant will be displayed on the public website
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? "Adding..." : "Add Grant"}
              </Button>
            </div>

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
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="grant-form" 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Add Grant
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
