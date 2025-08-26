"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Loader2, CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import axios from "axios"
import { toast } from "react-hot-toast"

// ------------------------
// DatePicker Component
// ------------------------
interface DatePickerProps {
  date?: Date
  onSelect: (date?: Date) => void
  placeholder?: string
}

function DatePicker({ date, onSelect, placeholder = "Pick a date" }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${!date ? "text-gray-500" : ""}`}
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
            onSelect(d)
            setIsOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

// ------------------------
// Zod Schema
// ------------------------
const editSchema = z.object({
  title: z.string().min(2, "Title is required"),
  inventors: z.array(z.string().email("Invalid email")), // Make it non-optional
  filedAt: z.date().optional(),
  submittedAt: z.date().optional(),
  publishedAt: z.date().optional(),
  grantedAt: z.date().optional(),
  isPublic: z.boolean(),
})

type EditFormSchema = z.infer<typeof editSchema>

type InventorStatus = "idle" | "loading" | "present" | "not-found"
type InventorInfo = { status: InventorStatus; userId: string | null }

// ------------------------
// Props
// ------------------------
interface Props {
  isEditDialogOpen: boolean
  setIsEditDialogOpen: (open: boolean) => void
  copyrightId: string
  onUpdate: (updated: any) => void
}

// ------------------------
// Component
// ------------------------
export default function EditCopyrightDialog({ isEditDialogOpen, setIsEditDialogOpen, copyrightId, onUpdate }: Props) {
  const [inventorCount, setInventorCount] = React.useState(0)
  const [inventorStatus, setInventorStatus] = React.useState<InventorInfo[]>([])
  
  const form = useForm<EditFormSchema>({
    resolver: zodResolver(editSchema),
    defaultValues: { title: "", inventors: [], filedAt: undefined, submittedAt: undefined, publishedAt: undefined, grantedAt: undefined, isPublic: false },
  })
  
  // Set default values with a more controlled method
  React.useEffect(() => {
    if (!isEditDialogOpen) {
      form.reset(); // Reset form on close
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/teacher/copyrights`, { params: { id: copyrightId } });
        const data = res.data.data[0];

        // Prepare initial form data
        const initialFormValues: EditFormSchema = {
          title: data.title,
          inventors: data.inventors.map((i: any) => i.email),
          filedAt: data.filedAt ? new Date(data.filedAt) : undefined,
          submittedAt: data.submittedAt ? new Date(data.submittedAt) : undefined,
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
          grantedAt: data.grantedAt ? new Date(data.grantedAt) : undefined,
          isPublic: data.isPublic,
        };

        form.reset(initialFormValues);
        setInventorCount(data.inventors.length);
        setInventorStatus(data.inventors.map((i: any) => ({ status: "present", userId: i.userId })));
        
      } catch (err) {
        toast.error("Failed to fetch copyright details");
      }
    };
    fetchData();
  }, [isEditDialogOpen, copyrightId, form]);

  // ------------------------
  // Check inventor by email
  // ------------------------
  const checkUser = async (email: string, index: number) => {
    if (!email.includes("@")) return
    setInventorStatus((prev) => {
      const arr = [...prev]
      arr[index] = { status: "loading", userId: null }
      return arr
    })
    try {
      const res = await axios.get("/api/general/user/findUser", { params: { email } })
      setInventorStatus((prev) => {
        const arr = [...prev]
        arr[index] = { status: res.data ? "present" : "not-found", userId: res.data?.id ?? null }
        return arr
      })
    } catch {
      setInventorStatus((prev) => {
        const arr = [...prev]
        arr[index] = { status: "not-found", userId: null }
        return arr
      })
    }
  }

  // ------------------------
  // Submit
  // ------------------------
  const onSubmit = async (data: EditFormSchema) => {
    try {
      const validInventors = inventorStatus.filter((i) => i.status === "present" && i.userId).map((i) => i.userId)
      const payload = { ...data, inventors: validInventors }
      const res = await axios.put(`/api/teacher/copyrights`, { params: { id: copyrightId }, data: payload })
      toast.success("Copyright updated successfully")
      onUpdate(res.data)
      setIsEditDialogOpen(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to update copyright")
    }
  }

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-[600px] overflow-auto max-h-screen">
        <DialogHeader>
          <DialogTitle>Edit Copyright</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter copyright title" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Inventor Count */}
            <div>
              <FormLabel>Number of Inventors</FormLabel>
              <Input type="number" min={0} value={inventorCount} onChange={(e) => {
                const count = Number(e.target.value);
                setInventorCount(count);
                // Adjust the form array and status to match the new count
                const currentInventors = form.getValues("inventors") || [];
                const newInventors = Array(count).fill(null).map((_, i) => currentInventors[i] || "");
                form.setValue("inventors", newInventors);
                setInventorStatus(Array(count).fill({ status: "idle", userId: null }));
              }} />
            </div>

            {/* Inventor Emails */}
            {Array.from({ length: inventorCount }).map((_, i) => (
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
                          {...field}
                          // This line is the fix. It correctly binds the input value to the field array.
                          onChange={(e) => {
                              field.onChange(e.target.value);
                              const email = e.target.value;
                              if (email.endsWith(".com") || email.endsWith(".in")) {
                                checkUser(email, i);
                              } else {
                                setInventorStatus((prev) => {
                                  const arr = [...prev];
                                  arr[i] = { status: "idle", userId: null };
                                  return arr;
                                });
                              }
                            }}
                        />
                      </FormControl>
                      {inventorStatus[i]?.status !== "idle" && (
                        <Badge
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          variant={inventorStatus[i]?.status === "present" ? "default" : inventorStatus[i]?.status === "not-found" ? "destructive" : "outline"}
                        >
                          {inventorStatus[i]?.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : inventorStatus[i]?.status === "present" ? "User Present" : "No User"}
                        </Badge>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            ))}

            {/* Dates */}
            {(["filedAt", "submittedAt", "grantedAt", "publishedAt"] as (keyof EditFormSchema)[]).map((fieldName) => (
              <FormField
                key={fieldName}
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fieldName.replace("At", " At")}</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value instanceof Date ? field.value : (typeof field.value === "string" && field.value ? new Date(field.value) : undefined)}
                        onSelect={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}

            {/* Public Toggle */}
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel>Make Public</FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Updating..." : "Update Copyright"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}