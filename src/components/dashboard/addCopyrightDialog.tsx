"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, PlusIcon } from "lucide-react"
import { toast } from "react-hot-toast"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

// -----------------------------------------------------------------------------
// 📦 Zod Schema for Copyright Data
// -----------------------------------------------------------------------------
const copyrightSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  inventors: z.string().min(1, { message: "Inventors are required." }),
  filedAt: z.date().nullable().optional(),
  submittedAt: z.date().nullable().optional(),
  publishedAt: z.date().nullable().optional(),
  grantedAt: z.date().nullable().optional(),
  isPublic: z.boolean().default(false).optional(),
})

type CopyrightFormValues = z.infer<typeof copyrightSchema>

// -----------------------------------------------------------------------------
// 📄 AddCopyrightDialog Component
// -----------------------------------------------------------------------------
export function AddCopyrightDialog({
  onCopyrightAdded,
}: {
  onCopyrightAdded: () => void
}) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const form = useForm<CopyrightFormValues>({
    resolver: zodResolver(copyrightSchema),
    defaultValues: {
      title: "",
      inventors: "",
      filedAt: null,
      submittedAt: null,
      publishedAt: null,
      grantedAt: null,
      isPublic: false,
    },
  })

  const onSubmit = async (values: CopyrightFormValues) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to add a copyright.")
      return
    }

    try {
      const payload = {
        ...values,
        teacherId: session.user.id,
        filedAt: values.filedAt?.toISOString() || null,
        submittedAt: values.submittedAt?.toISOString() || null,
        publishedAt: values.publishedAt?.toISOString() || null,
        grantedAt: values.grantedAt?.toISOString() || null,
      }

      console.log("Submitting new copyright:", payload)
      const postData = await axios.post("/api/teacher/copyrights", payload)
      console.log("Copyright added:", postData.data)

      toast.success("Copyright added successfully!")
      form.reset()
      setOpen(false)
      onCopyrightAdded()
    } catch (error) {
      console.error("Error adding copyright:", error)
      toast.error("Failed to add copyright.")
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="secondary"
          className="ml-2 bg-blue-950 shadow-sm shadow-black"
        >
          <p className="text-white font-bold">Add Copyright</p>
          <PlusIcon className="font-bold text-white ml-2" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add New Copyright</AlertDialogTitle>
          <AlertDialogDescription>
            Fill in the details for the new copyright entry.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Copyright Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Inventors */}
            <FormField
              control={form.control}
              name="inventors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventors</FormLabel>
                  <FormControl>
                    <Input placeholder="Inventor Names" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reusable Date Picker */}
            {["filedAt", "submittedAt", "publishedAt", "grantedAt"].map(
              (fieldName) => (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName as keyof CopyrightFormValues}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="capitalize">
                        {fieldName.replace("At", " At")}
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value instanceof Date ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 pointer-events-auto" // Corrected line
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={
                              field.value instanceof Date
                                ? field.value
                                : undefined
                            }
                            onSelect={(date) => field.onChange(date ?? null)}
                            captionLayout="dropdown"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )
            )}

            {/* Is Public */}
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Make Public</FormLabel>
                    <FormDescription>
                      This copyright will be visible to everyone.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => form.reset()}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction type="submit">
                Add Copyright
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}