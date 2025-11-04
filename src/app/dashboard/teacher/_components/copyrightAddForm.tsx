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
import { Loader2, Plus, X, Check, AlertCircle, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Assuming the API response for a user is of this shape
interface User {
  id: string;
  email: string;
  fullName: string;
}

interface InventorItem {
  id: string;
  email: string;
  fullName?: string;
  status: "validating" | "valid" | "invalid" | "pending";
}

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  filedAt: z.date().optional(),
  submittedAt: z.date().optional(),
  publishedAt: z.date().optional(),
  grantedAt: z.date().optional(),
  inventors: z.array(z.string().uuid("Invalid user ID")).min(1, "At least one inventor is required"),
  isPublic: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  setData: React.Dispatch<React.SetStateAction<any[]>>;
}

export function AddCopyrightDrawer({ open, onClose, setData }: Props) {
  const [inventors, setInventors] = React.useState<InventorItem[]>([]);
  const [newInventorEmail, setNewInventorEmail] = React.useState("");
  const [isValidatingEmail, setIsValidatingEmail] = React.useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      filedAt: undefined,
      submittedAt: undefined,
      publishedAt: undefined,
      grantedAt: undefined,
      inventors: [],
      isPublic: false,
    },
  });

  // Update form when inventors change
  React.useEffect(() => {
    const validEmails = inventors
      .filter(inv => inv.status === "valid")
      .map(inv => inv.email);
    form.setValue("inventors", validEmails);
  }, [inventors, form]);

  const validateEmail = async (email: string): Promise<InventorItem> => {
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email format");
    }

    try {
      const response = await axios.get(`/api/general/user/teacher/available?email=${email}`);

      if (response.status === 200 && response.data?.id) {
        const user = response.data;
        return {
          id: user.id,
          email: email,
          fullName: user.fullName || "Unknown User",
          status: "valid"
        };
      } else {
        return {
          id: crypto.randomUUID(),
          email: email,
          status: "invalid"
        };
      }
    } catch (error) {
      console.error("Failed to validate email:", error);
      return {
        id: crypto.randomUUID(),
        email: email,
        status: "invalid"
      };
    }
  };

  const handleAddInventor = async () => {
    if (!newInventorEmail || !newInventorEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check if email already exists
    if (inventors.some(inv => inv.email === newInventorEmail)) {
      toast.error("This inventor is already added");
      return;
    }

    setIsValidatingEmail(true);
    
    try {
      const inventorItem = await validateEmail(newInventorEmail);
      
      setInventors(prev => [...prev, inventorItem]);
      setNewInventorEmail("");
      
      if (inventorItem.status === "valid") {
        toast.success(`${inventorItem.fullName} added as inventor`);
      } else {
        toast.error("User not found in the system. Please check the email address.");
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Failed to validate email. Please try again.");
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const handleRemoveInventor = (inventorId: string) => {
    setInventors(prev => prev.filter(inv => inv.id !== inventorId));
    toast.success("Inventor removed");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddInventor();
    }
  };

  const onSubmit = async (formData: FormSchema) => {
    const validInventors = inventors.filter(inv => inv.status === "valid");
    
    if (validInventors.length === 0) {
      toast.error("Please add at least one valid inventor");
      return;
    }

    try {
      const payload = {
        ...formData,
        filedAt: formData.filedAt?.toISOString() ?? null,
        submittedAt: formData.submittedAt?.toISOString() ?? null,
        grantedAt: formData.grantedAt?.toISOString() ?? null,
        publishedAt: formData.publishedAt?.toISOString() ?? null,
        inventors: validInventors.map(inv => inv.id),
      };
      
      console.log("Submitting copyright:", payload);
      const response = await axios.post("/api/teacher/copyrights", payload);
      
      if (response.status !== 201) {
        throw new Error("Failed to create copyright");
      }

      // Handle the API response structure with data wrapper
      const newCopyright = response.data.data || response.data;
      setData((prev) => [...prev, newCopyright]);
      
      form.reset();
      setInventors([]);
      setNewInventorEmail("");
      onClose();
      toast.success("Copyright added successfully");
    } catch (error) {
      console.error("Failed to add copyright:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Failed to add copyright";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to add copyright");
      }
    }
  };

  const handleClose = () => {
    if (form.formState.isSubmitting) {
      return; // Prevent closing while submitting
    }
    form.reset();
    setInventors([]);
    setNewInventorEmail("");
    onClose();
  };

  const dateFields: { key: keyof FormSchema; label: string }[] = [
    { key: "filedAt", label: "Filed Date" },
    { key: "submittedAt", label: "Submitted Date" },
    { key: "publishedAt", label: "Published Date" },
    { key: "grantedAt", label: "Granted Date" },
  ];

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="w-full h-[90vh] sm:h-[85vh] mt-auto rounded-t-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 flex flex-col">
        <DrawerHeader className="border-b bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-900 flex-shrink-0">
          <DrawerTitle className="text-2xl font-bold text-center text-white">
            Add New Copyright
          </DrawerTitle>
          <p className="text-sm text-slate-300 text-center">
            Fill in the details to register a new copyright
          </p>
        </DrawerHeader>

        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-6 py-3 sm:py-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 dark:scrollbar-thumb-slate-600 dark:scrollbar-track-slate-800 scroll-smooth">
            <Form {...form}>
              <form id="copyright-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
                {/* Basic Info */}
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
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Copyright Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter a descriptive title for your copyright"
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

                {/* Inventors */}
                <Card className="border-2 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                      Inventors
                    </CardTitle>
                    <p className="text-sm text-green-100">
                      Add inventors by their email addresses. We'll verify if they exist in our system.
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                  {/* Add New Inventor */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="email"
                        placeholder="Enter inventor's email address"
                        value={newInventorEmail}
                        onChange={(e) => setNewInventorEmail(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="h-11"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddInventor}
                      disabled={isValidatingEmail || !newInventorEmail}
                      className="h-11 px-6"
                    >
                      {isValidatingEmail ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {isValidatingEmail ? "Validating..." : "Add"}
                    </Button>
                  </div>

                  {/* Inventors List */}
                  {inventors.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Added Inventors ({inventors.length})</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {inventors.map((inventor) => (
                          <div
                            key={inventor.id}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                              inventor.status === "valid"
                                ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                                : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                inventor.status === "valid" 
                                  ? "bg-green-100 dark:bg-green-900" 
                                  : "bg-red-100 dark:bg-red-900"
                              }`}>
                                {inventor.status === "valid" ? (
                                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {inventor.fullName || inventor.email}
                                </p>
                                {inventor.fullName && (
                                  <p className="text-xs text-gray-500">{inventor.email}</p>
                                )}
                                <Badge
                                  variant={inventor.status === "valid" ? "default" : "destructive"}
                                  className="text-xs mt-1"
                                >
                                  {inventor.status === "valid" ? "✓ Verified Teacher" : "✗ Not Found"}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveInventor(inventor.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {inventors.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        No inventors added yet
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Add at least one verified teacher as an inventor to continue.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dates */}
              <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    Important Dates
                  </CardTitle>
                  <p className="text-sm text-purple-100">
                    Track key milestones in your copyright process (all optional)
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dateFields.map((field) => (
                      <FormField
                        key={field.key}
                        control={form.control}
                        name={field.key}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              {field.label}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-11"
                                {...formField}
                                value={
                                  formField.value instanceof Date
                                    ? formField.value.toISOString().substring(0, 10)
                                    : ""
                                }
                                onChange={(e) => {
                                  const date = e.target.value
                                    ? new Date(e.target.value)
                                    : undefined;
                                  formField.onChange(date);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Visibility */}
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-1">
                          <FormLabel className="font-medium">Make Publicly Available</FormLabel>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Allow others to view this copyright information
                          </p>
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

          {/* Action Buttons - Fixed at bottom */}
          <div className="border-t bg-white dark:bg-slate-800 p-3 sm:p-4 md:p-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-10 sm:h-11 px-4 sm:px-6 md:px-8 order-2 sm:order-1 text-sm sm:text-base"
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                form="copyright-form"
                disabled={
                  form.formState.isSubmitting || 
                  inventors.filter(inv => inv.status === "valid").length === 0 ||
                  !form.getValues("title")
                }
                className="h-10 sm:h-11 px-4 sm:px-6 md:px-8 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 order-1 sm:order-2 text-sm sm:text-base"
                onClick={form.handleSubmit(onSubmit)}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Copyright
                    {inventors.filter(inv => inv.status === "valid").length > 0 && (
                      <span className="ml-2 text-xs bg-slate-600 dark:bg-slate-500 px-2 py-1 rounded">
                        {inventors.filter(inv => inv.status === "valid").length} inventors
                      </span>
                    )}
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
