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
import {
  Loader2,
  CalendarIcon,
  Upload,
  X,
  Plus,
  Minus,
  Users,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { uploadFile } from "@/lib/appwrite";
import { motion, AnimatePresence } from "motion/react";
import { useDropzone } from "react-dropzone";
import { Separator } from "@/components/ui/separator";

// User interface for validation
interface User {
  id: string;
  email: string;
  fullName: string;
}

const formSchema = z.object({
  title: z.string().min(2, "Title is required").max(200),
  inventors: z
    .array(z.string().uuid("Invalid user ID"))
    .min(1, "At least one inventor is required"),
  applicant: z.string().min(2, "Applicant is required"),
  applicationNo: z.string().optional(),
  filedAt: z.date().optional(),
  submittedAt: z.date().optional(),
  publishedAt: z.date().optional(),
  grantedAt: z.date().optional(),
  publicationLink: z.string().url("Invalid URL").optional().or(z.literal("")),
  patentLink: z.string().url("Invalid URL").optional().or(z.literal("")),
  country: z.string().optional(),
  isPublic: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  setData: React.Dispatch<React.SetStateAction<any[]>>;
}

// Custom type to hold validation state and user ID
type InventorStatus = "idle" | "loading" | "present" | "not-found";
type InventorInfo = {
  status: InventorStatus;
  userId: string | null;
  user?: User;
};

// DatePicker Component
interface DatePickerProps {
  date?: Date;
  onSelect: (date?: Date) => void;
  placeholder?: string;
}

function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${!date ? "text-muted-foreground" : ""}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onSelect(d);
            setIsOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export default function AddPatentDrawer({ open, onClose, setData }: Props) {
  const [inventorStatus, setInventorStatus] = React.useState<InventorInfo[]>(
    []
  );
  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      inventors: [""],
      applicant: "",
      applicationNo: "",
      filedAt: undefined,
      submittedAt: undefined,
      publishedAt: undefined,
      grantedAt: undefined,
      publicationLink: "",
      patentLink: "",
      country: "",
      isPublic: false,
    },
  });

  const watchedInventors = form.watch("inventors");

  // Initialize inventor status array
  React.useEffect(() => {
    setInventorStatus(
      Array(watchedInventors.length).fill({ status: "idle", userId: null })
    );
  }, [watchedInventors.length]);

  const validateInventorEmail = React.useCallback(
    async (email: string, index: number) => {
      if (!email || !email.includes("@")) {
        setInventorStatus((prev) => {
          const newStatus = [...prev];
          newStatus[index] = { status: "idle", userId: null };
          return newStatus;
        });
        return;
      }

      // Set loading
      setInventorStatus((prev) => {
        const newStatus = [...prev];
        newStatus[index] = { status: "loading", userId: null };
        return newStatus;
      });

      try {
        const response = await axios.get(
          `/api/general/user/teacher/available?email=${email}`
        );
        const user = response.data;
        console.log("User found:", user);

        setInventorStatus((prev) => {
          const newStatus = [...prev];
          newStatus[index] = { status: "present", userId: user.id, user };

          return newStatus;
        });
      } catch (error) {
        setInventorStatus((prev) => {
          const newStatus = [...prev];
          newStatus[index] = { status: "not-found", userId: null };
          return newStatus;
        });
      }
    },
    []
  );

  const addInventor = () => {
    const currentInventors = form.getValues("inventors");
    form.setValue("inventors", [...currentInventors, ""]);
  };

  const removeInventor = (index: number) => {
    const currentInventors = form.getValues("inventors");
    if (currentInventors.length > 1) {
      form.setValue(
        "inventors",
        currentInventors.filter((_, i) => i !== index)
      );
    }
  };

  const onSubmit = async (formData: FormSchema) => {
    setIsUploading(true);
    try {
      // Extract valid inventor user IDs
      const validInventorIds = inventorStatus
        .filter((status) => status.status === "present" && status.userId)
        .map((status) => status.userId as string);
        console.log(validInventorIds)

      if (validInventorIds.length === 0) {
        toast.error("Please add at least one valid inventor");
        return;
      }

      const payload = {
        ...formData,
        inventors: validInventorIds,
      };

      const response = await axios.post("/api/teacher/patent", payload);

      if (response.status === 201) {
        toast.success("Patent added successfully! 🎉");
        setData((prev) => [response.data, ...prev]);
        onClose();
        form.reset();
        setInventorStatus([]);
      }
    } catch (error: any) {
      console.error("Failed to add patent:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to add patent. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh] overflow-hidden">
        <DrawerHeader className="border-b">
          <DrawerTitle className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <span>Add New Patent</span>
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patent Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter a descriptive patent title"
                              {...field}
                              className="focus:ring-2 focus:ring-primary/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="applicant"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Applicant *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Applicant organization"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="applicationNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Application Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., US20210123456A1"
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
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country/Region</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., United States, India, Europe"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Inventors Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Inventors</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addInventor}
                        className="flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Inventor</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AnimatePresence>
                      {watchedInventors.map((_, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <FormField
                                control={form.control}
                                name={`inventors.${index}`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder={`inventor${index + 1}@university.edu`}
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e); // always update the form state

                                          const value = e.target.value;
                                          if (
                                            value.endsWith(".com") ||
                                            value.endsWith(".in")
                                          ) {
                                            validateInventorEmail(value, index);
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              {inventorStatus[index]?.status === "loading" && (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              )}
                              {inventorStatus[index]?.status === "present" && (
                                <Badge
                                  variant="default"
                                  className="bg-green-500"
                                >
                                  {inventorStatus[index]?.user?.fullName ||
                                    "Found"}
                                </Badge>
                              )}
                              {inventorStatus[index]?.status ===
                                "not-found" && (
                                <Badge variant="destructive">Not Found</Badge>
                              )}

                              {watchedInventors.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeInventor(index)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Important Dates */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Important Dates</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="filedAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Filed Date</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value}
                              onSelect={field.onChange}
                              placeholder="When was it filed?"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="submittedAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Submitted Date</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value}
                              onSelect={field.onChange}
                              placeholder="When was it submitted?"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="publishedAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Published Date</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value}
                              onSelect={field.onChange}
                              placeholder="When was it published?"
                            />
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
                            <DatePicker
                              date={field.value}
                              onSelect={field.onChange}
                              placeholder="When was it granted?"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Links & Documents */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Links & Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="publicationLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publication Link</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://patents.google.com/..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="patentLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patent Office Link</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://uspto.gov/..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Visibility Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Visibility Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-medium">
                              Make this patent public
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Public patents will be visible to all users on the
                              platform
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
              </motion.div>

              {/* Submit Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-end gap-4 pt-4 border-t"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || isUploading}
                >
                  {form.formState.isSubmitting || isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Patent...
                    </>
                  ) : (
                    "Add Patent"
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
