"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X, UserPlus } from "lucide-react";
import { useTeacherProfile } from "@/hooks/useTeacherProfile";
import {
  fetchTeachers,
  createConference,
  updateConference,
} from "@/lib/api/teacherApi";

const formSchema = z.object({
  conferenceName: z.string().min(1, "Conference name is required"),
  mode: z.string().optional(),
  typeOfConference: z.string().optional(),
  indexOfConference: z.string().optional(),
  publisher: z.string().optional(),
  location: z.string().optional(),
  conferenceStartDate: z.string(),
  conferenceEndDate: z.string(),
  status: z.enum(["ACCEPTED", "COMMUNICATED", "PUBLISHED"]),
  statusDate: z.string(),
  paperLinkDOI: z.string().optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  reimbursementDate: z.string().optional(),
  isPublic: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConferenceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conference?: any;
  onSuccess: () => void;
}

export function ConferenceFormDialog({
  open,
  onOpenChange,
  conference,
  onSuccess,
}: ConferenceFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<any[]>([]);
  const [searchAuthor, setSearchAuthor] = useState("");
  const isEdit = !!conference;
  const { teacherProfile } = useTeacherProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      conferenceName: "",
      mode: "",
      typeOfConference: "",
      indexOfConference: "",
      publisher: "",
      location: "",
      conferenceStartDate: "",
      conferenceEndDate: "",
      status: "COMMUNICATED",
      statusDate: "",
      paperLinkDOI: "",
      registrationFees: undefined,
      reimbursementStatus: "",
      reimbursementDate: "",
      isPublic: true,
    },
  });

  useEffect(() => {
    if (open) {
      fetchTeachers()
        .then((result) => setTeachers(result.data || []))
        .catch(console.error);
      if (conference) {
        form.reset({
          conferenceName: conference.conferenceName || "",
          mode: conference.mode || "OFFLINE",
          typeOfConference: conference.typeOfConference || "",
          indexOfConference: conference.indexOfConference || "",
          publisher: conference.publisher || "",
          location: conference.location || "",
          conferenceStartDate: conference.conferenceStartDate
            ? new Date(conference.conferenceStartDate)
                .toISOString()
                .split("T")[0]
            : "",
          conferenceEndDate: conference.conferenceEndDate
            ? new Date(conference.conferenceEndDate).toISOString().split("T")[0]
            : "",
          status: conference.status || "COMMUNICATED",
          statusDate: conference.statusDate
            ? new Date(conference.statusDate).toISOString().split("T")[0]
            : "",
          paperLinkDOI: conference.paperLinkDOI || "",
          registrationFees: conference.registrationFees || 0,
          reimbursementStatus: conference.reimbursementStatus || "",
          reimbursementDate: conference.reimbursementDate
            ? new Date(conference.reimbursementDate).toISOString().split("T")[0]
            : "",
          isPublic: conference.isPublic ?? true,
        });
        setSelectedAuthors(
          conference.authors?.map((a: any) => a.teacher) || []
        );
      } else {
        form.reset({
          conferenceName: "",
          mode: "OFFLINE",
          typeOfConference: "",
          indexOfConference: "",
          publisher: "",
          location: "",
          conferenceStartDate: "",
          conferenceEndDate: "",
          status: "COMMUNICATED",
          statusDate: "",
          paperLinkDOI: "",
          registrationFees: 0,
          reimbursementStatus: "",
          reimbursementDate: "",
          isPublic: true,
        });
        setSelectedAuthors(teacherProfile ? [teacherProfile] : []);
      }
    }
  }, [open, conference, teacherProfile, form]);

  const filteredTeachers = teachers.filter(
    (t) =>
      !selectedAuthors.find((a) => a.id === t.id) &&
      (t.user.name.toLowerCase().includes(searchAuthor.toLowerCase()) ||
        t.user.email.toLowerCase().includes(searchAuthor.toLowerCase()))
  );

  const onSubmit = async (data: FormValues) => {
    if (selectedAuthors.length === 0) {
      alert("Please select at least one author");
      return;
    }
    setIsLoading(true);
    try {
      const payload = { ...data, authorIds: selectedAuthors.map((a) => a.id) };
      if (isEdit) {
        await updateConference(conference.id, payload);
      } else {
        await createConference(payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} Conference Paper</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <FormLabel>Authors *</FormLabel>
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormLabel className="mt-0">Visible to public</FormLabel>
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
              <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[50px]">
                {selectedAuthors.map((author) => (
                  <Badge
                    key={author.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {author.user.name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setSelectedAuthors((prev) =>
                          prev.filter((a) => a.id !== author.id)
                        )
                      }
                    />
                  </Badge>
                ))}
              </div>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teachers..."
                    value={searchAuthor}
                    onChange={(e) => setSearchAuthor(e.target.value)}
                  />
                </div>
                {searchAuthor && filteredTeachers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredTeachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedAuthors((prev) => [...prev, teacher]);
                          setSearchAuthor("");
                        }}
                      >
                        <div className="font-medium">{teacher.user.name}</div>
                        <div className="text-xs text-gray-500">
                          {teacher.user.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>


            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="conferenceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conference Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="publisher"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publisher</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OFFLINE">Offline</SelectItem>
                        <SelectItem value="ONLINE">Online</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="typeOfConference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input placeholder="International/National" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="indexOfConference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Index</FormLabel>
                    <FormControl>
                      <Input placeholder="Scopus/IEEE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="conferenceStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="conferenceEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="COMMUNICATED">
                          Communicated
                        </SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
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
                    <FormLabel>Status Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                  <FormLabel>Paper Link / DOI</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="registrationFees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Fees</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
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
                      <Input placeholder="Approved/Pending" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reimbursementDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reimbursement Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
