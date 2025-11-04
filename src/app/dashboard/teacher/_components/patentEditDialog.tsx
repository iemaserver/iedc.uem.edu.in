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
import { Loader2, CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import axios from "axios"
import { toast } from "react-hot-toast"
import { Textarea } from "@/components/ui/textarea"

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
  inventors: z.array(z.string().email("Invalid email")),
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
})

type EditFormSchema = z.infer<typeof editSchema>

// ------------------------
// Props
// ------------------------
interface Props {
  isEditDialogOpen: boolean
  setIsEditDialogOpen: (open: boolean) => void
  patentId: string
  onUpdate: (updated: any) => void
}

// ------------------------
// Component
// ------------------------
export default function EditPatentDialog({ isEditDialogOpen, setIsEditDialogOpen, patentId, onUpdate }: Props) {
  const [isLoading, setIsLoading] = React.useState(false)
  
  const form = useForm<EditFormSchema>({
    resolver: zodResolver(editSchema),
    defaultValues: { 
      title: "", 
      inventors: [], 
      applicant: "",
      applicationNo: "",
      filedAt: undefined, 
      submittedAt: undefined, 
      publishedAt: undefined, 
      grantedAt: undefined,
      publicationLink: "",
      patentLink: "",
      country: "",
      isPublic: false 
    },
  })
  
  // Fetch patent data when dialog opens
  React.useEffect(() => {
    if (!isEditDialogOpen || !patentId) {
      form.reset()
      return
    }

    const fetchPatentData = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get(`/api/teacher/patent?id=${patentId}`)
        const patent = response.data.data[0] // Assuming the API returns an array
        
        if (patent) {
          form.reset({
            title: patent.title || "",
            inventors: patent.inventors || "",
            applicant: patent.applicant || "",
            applicationNo: patent.applicationNo || "",
            filedAt: patent.filedAt ? new Date(patent.filedAt) : undefined,
            submittedAt: patent.submittedAt ? new Date(patent.submittedAt) : undefined,
            publishedAt: patent.publishedAt ? new Date(patent.publishedAt) : undefined,
            grantedAt: patent.grantedAt ? new Date(patent.grantedAt) : undefined,
            publicationLink: patent.publicationLink || "",
            patentLink: patent.patentLink || "",
            country: patent.country || "",
            isPublic: patent.isPublic || false,
          })
        }
      } catch (error) {
        console.error("Failed to fetch patent data:", error)
        toast.error("Failed to load patent data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatentData()
  }, [isEditDialogOpen, patentId, form])

  const onSubmit = async (formData: EditFormSchema) => {
    if (!patentId) return

    try {
      const payload = {
        ...formData,
        filedAt: formData.filedAt?.toISOString() ?? null,
        submittedAt: formData.submittedAt?.toISOString() ?? null,
        publishedAt: formData.publishedAt?.toISOString() ?? null,
        grantedAt: formData.grantedAt?.toISOString() ?? null,
      }

      const response = await axios.put(`/api/teacher/patent?id=${patentId}`, payload)
      
      if (response.status !== 200) {
        throw new Error("Failed to update patent")
      }

      onUpdate(response.data)
      setIsEditDialogOpen(false)
      toast.success("Patent updated successfully")
    } catch (error) {
      console.error("Failed to update patent:", error)
      toast.error("Failed to update patent")
    }
  }

  const dateFields: (keyof EditFormSchema)[] = [
    "filedAt",
    "submittedAt", 
    "publishedAt",
    "grantedAt",
  ]

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Patent</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading patent data...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patent Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter patent title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inventors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventors *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter inventor names (comma separated)"
                          {...field}
                          rows={3}
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
                          <Input placeholder="Enter applicant name" {...field} />
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
                          <Input placeholder="Enter application number" {...field} />
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
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Links</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="publicationLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publication Link</FormLabel>
                        <FormControl>
                          <Input 
                            type="url"
                            placeholder="https://example.com/publication"
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
                        <FormLabel>Patent Link</FormLabel>
                        <FormControl>
                          <Input 
                            type="url"
                            placeholder="https://example.com/patent"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Important Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dateFields.map((fieldName) => (
                    <FormField
                      key={fieldName}
                      control={form.control}
                      name={fieldName}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {fieldName.replace("At", " Date")}
                          </FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value instanceof Date ? field.value : undefined}
                              onSelect={field.onChange}
                              placeholder={`Select ${fieldName.replace("At", " date")}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Public Toggle */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Visibility</h3>
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
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Patent"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
