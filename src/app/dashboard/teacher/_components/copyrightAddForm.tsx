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
import { Loader2 } from "lucide-react";

// Assuming the API response for a user is of this shape
interface User {
  id: string;
  email: string;
}

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  filedAt: z.date().optional(),
  submittedAt: z.date().optional(),
  publishedAt: z.date().optional(),
  grantedAt: z.date().optional(),
  inventors: z.array(z.string().email("Invalid email")),
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
};

export function AddCopyrightDrawer({ open, onClose, setData }: Props) {
  const [inventorCount, setInventorCount] = React.useState(0);
  const [debouncedCount, setDebouncedCount] = React.useState(0);
  const [inventorStatus, setInventorStatus] = React.useState<InventorInfo[]>(
    []
  );

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

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCount(inventorCount);
      // When the number of inventors changes, resize the inventor status array and reset values.
      setInventorStatus(
        Array(inventorCount).fill({ status: "idle", userId: null })
      );
      // Also reset the form's inventors array to avoid validation errors
      form.setValue("inventors", Array(inventorCount).fill(""));
    }, 500);
    return () => clearTimeout(handler);
  }, [inventorCount, form]);

  const askUserData = React.useCallback(
    async (email: string, index: number) => {
      if (!email || !email.includes("@")) return;

      // Set loading first
      setInventorStatus((prev) => {
        const newStatus = [...prev];
        newStatus[index] = { ...newStatus[index], status: "loading" };
        return newStatus;
      });

      try {
        const response = await axios.get("/api/general/user/findUser", {
          params: { email },
        });

        // Adjust based on your API structure:
        const user = response.data; // try both

        if (response.status === 200 && user?.id) {
          setInventorStatus((prev) => {
            const newStatus = [...prev];
            newStatus[index] = { status: "present", userId: user.id };
            return newStatus;
          });
          toast.success("User found!");
        } else {
          setInventorStatus((prev) => {
            const newStatus = [...prev];
            newStatus[index] = { status: "not-found", userId: null };
            return newStatus;
          });
          toast.error("User not found.");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setInventorStatus((prev) => {
          const newStatus = [...prev];
          newStatus[index] = { status: "not-found", userId: null };
          return newStatus;
        });
        toast.error("Failed to find user.");
      }
    },
    []
  );

  const onSubmit = async (formData: FormSchema) => {
    try {
      // Filter out non-existent user IDs and only send emails for "present" users
      const inventorsWithIds = inventorStatus
        .filter(
          (status) => status.status === "present" && status.userId !== null
        )
        .map((status) => status.userId);

      const payload = {
        ...formData,
        filedAt: formData.filedAt?.toISOString() ?? null,
        submittedAt: formData.submittedAt?.toISOString() ?? null,
        grantedAt: formData.grantedAt?.toISOString() ?? null,
        publishedAt: formData.publishedAt?.toISOString() ?? null,
        // Replace the inventors email array with the array of user IDs
        inventors: inventorsWithIds,
      };
      console.log("Submitting copyright:", payload);
      const response = await axios.post("/api/teacher/copyrights", payload);
      if (response.status !== 201)
        throw new Error("Failed to create copyright");

      setData((prev) => [...prev, response.data.data]);
      form.reset();
      onClose();
      toast.success("Copyright added successfully");
    } catch (error) {
      console.error("Failed to add copyright:", error);
      toast.error("Failed to add copyright");
    }
  };

  const dateFields: (keyof FormSchema)[] = [
    "filedAt",
    "submittedAt",
    "publishedAt",
    "grantedAt",
  ];

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="w-full h-[65%] mt-auto rounded-t-2xl overflow-hidden dark">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-semibold">
            Add New Copyright
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto h-full px-6 pb-6 scrollbar-thin">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter copyright title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Dates */}
              <Card>
                <CardHeader>
                  <CardTitle>Dates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dateFields.map((fieldName) => (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {fieldName.replace("At", " At")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={
                                  field.value instanceof Date
                                    ? field.value.toISOString().substring(0, 10)
                                    : ""
                                }
                                onChange={(e) => {
                                  const date = e.target.value
                                    ? new Date(e.target.value)
                                    : undefined;
                                  field.onChange(date);
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

              {/* Inventors */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Number of Inventors</Label>
                      <Input
                        type="number"
                        min={0}
                        onChange={(e) =>
                          setInventorCount(Number(e.target.value))
                        }
                        placeholder="Enter number of inventors"
                      />
                    </div>
                    {Array.from({ length: debouncedCount }).map((_, i) => (
                      <FormField
                        key={i}
                        control={form.control}
                        name={`inventors.${i}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inventor {i + 1} Email</FormLabel>
                            <div className="relative flex items-center">
                              <FormControl>
                                <Input
                                  type="email"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value); // update react-hook-form value
                                    const email = e.target.value;

                                    // Simple debounce with setTimeout
                                    if (
                                      email.endsWith(".com") ||
                                      email.endsWith(".in")
                                    ) {
                                      clearTimeout(
                                        (field as any)._debounceTimer
                                      );
                                      (field as any)._debounceTimer =
                                        setTimeout(() => {
                                          askUserData(email, i); // call API after 500ms of inactivity
                                        }, 500);
                                    } else {
                                      setInventorStatus((prev) => {
                                        const newStatus = [...prev];
                                        newStatus[i] = {
                                          status: "idle",
                                          userId: null,
                                        };
                                        return newStatus;
                                      });
                                    }
                                  }}
                                />
                              </FormControl>
                              {inventorStatus[i]?.status !== "idle" && (
                                <Badge
                                  className="absolute right-2 top-1/2 -translate-y-1/2"
                                  variant={
                                    inventorStatus[i]?.status === "present"
                                      ? "default"
                                      : inventorStatus[i]?.status ===
                                          "not-found"
                                        ? "destructive"
                                        : "outline"
                                  }
                                >
                                  {inventorStatus[i]?.status === "loading" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : inventorStatus[i]?.status ===
                                    "present" ? (
                                    "User Present"
                                  ) : (
                                    "No User"
                                  )}
                                </Badge>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Public Toggle */}
              <Card>
                <CardHeader>
                  <CardTitle>Visibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <FormLabel>Publicly Available</FormLabel>
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

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="text-white"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
