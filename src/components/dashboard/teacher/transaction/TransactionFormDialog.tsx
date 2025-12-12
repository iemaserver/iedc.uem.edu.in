"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X, Search } from "lucide-react";
import { useTeacherProfile } from "@/hooks/useTeacherProfile";
import axios from "axios";

const authorSchema = z.object({
  teacherId: z.string().min(1, "Author is required"),
  orderIndex: z.number(),
});

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  transactionName: z.string().min(1, "Transaction name is required"),
  typeOfTransaction: z.string().optional(),
  indexOfTransaction: z.string().optional(),
  impactFactor: z.string().optional(),
  impactFactorDate: z.string().optional(),
  publisher: z.string().optional(),
  status: z.enum(["ACCEPTED", "COMMUNICATED", "PUBLISHED"]),
  statusDate: z.string(),
  paperLinkDOI: z.string().url().optional().or(z.literal("")),
  registrationFees: z.string().optional(),
  reimbursementStatus: z.string().optional(),
  isPublic: z.boolean(),
  authors: z.array(authorSchema).min(1, "At least one author is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: any;
  onSuccess: () => void;
}

export function TransactionFormDialog({ open, onOpenChange, transaction, onSuccess }: TransactionFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const isEdit = !!transaction;
  const { teacherProfile } = useTeacherProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: transaction?.title || "",
      transactionName: transaction?.transactionName || "",
      typeOfTransaction: transaction?.typeOfTransaction || "",
      indexOfTransaction: transaction?.indexOfTransaction || "",
      impactFactor: transaction?.impactFactor?.toString() || "",
      impactFactorDate: transaction?.impactFactorDate ? new Date(transaction.impactFactorDate).toISOString().split('T')[0] : "",
      publisher: transaction?.publisher || "",
      status: transaction?.status || "COMMUNICATED",
      statusDate: transaction?.statusDate ? new Date(transaction.statusDate).toISOString().split('T')[0] : "",
      paperLinkDOI: transaction?.paperLinkDOI || "",
      registrationFees: transaction?.registrationFees?.toString() || "",
      reimbursementStatus: transaction?.reimbursementStatus || "",
      isPublic: transaction?.isPublic || false,
      authors: transaction?.authors?.map((author: any, idx: number) => ({
        teacherId: author.teacherId,
        orderIndex: idx,
      })) || (teacherProfile ? [{ teacherId: teacherProfile.id, orderIndex: 0 }] : []),
    },
  });

  useEffect(() => {
    const searchTeachers = async () => {
      if (searchQuery.length < 2) {
        setTeachers([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await axios.get(`/api/teacher?search=${encodeURIComponent(searchQuery)}&limit=10`);
        setTeachers(response.data.data || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };
    const timer = setTimeout(searchTeachers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addAuthor = (teacher: any) => {
    const current = form.getValues("authors");
    if (current.some(author => author.teacherId === teacher.id)) return;
    form.setValue("authors", [...current, { teacherId: teacher.id, orderIndex: current.length }]);
    setSearchQuery("");
    setTeachers([]);
  };

  const removeAuthor = (index: number) => {
    const current = form.getValues("authors");
    form.setValue("authors", current.filter((_, i) => i !== index).map((author, idx) => ({ ...author, orderIndex: idx })));
  };

  const getTeacherName = (teacherId: string) => {
    if (teacherId === teacherProfile?.id) return teacherProfile?.user?.name || "Current User";
    const author = transaction?.authors?.find((a: any) => a.teacherId === teacherId);
    return author?.teacher?.user?.name || teacherId;
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const payload: any = {
        title: data.title,
        transactionName: data.transactionName,
        typeOfTransaction: data.typeOfTransaction || undefined,
        indexOfTransaction: data.indexOfTransaction || undefined,
        impactFactor: data.impactFactor ? parseFloat(data.impactFactor) : undefined,
        impactFactorDate: data.impactFactorDate || undefined,
        publisher: data.publisher || undefined,
        status: data.status,
        statusDate: data.statusDate,
        paperLinkDOI: data.paperLinkDOI || undefined,
        registrationFees: data.registrationFees ? parseFloat(data.registrationFees) : undefined,
        reimbursementStatus: data.reimbursementStatus || undefined,
        isPublic: data.isPublic,
      };

      // For POST requests, include full authors array with orderIndex
      // For PATCH requests, include only authorIds array
      if (isEdit) {
        payload.authorIds = data.authors.map((author) => author.teacherId);
      } else {
        payload.authors = data.authors;
      }

      const url = isEdit ? `/api/teacher/transaction/${transaction.id}` : "/api/teacher/transaction";
      const response = await axios({
        method: isEdit ? "patch" : "post",
        url,
        data: payload,
      });

      if (response.status === 200 || response.status === 201) {
        onSuccess();
        onOpenChange(false);
        form.reset();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || "Failed to save transaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} Transaction</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title *</FormLabel><FormControl><Input {...field} placeholder="Enter transaction title" /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="transactionName" render={({ field }) => (
              <FormItem><FormLabel>Transaction Name *</FormLabel><FormControl><Input {...field} placeholder="Enter transaction name" /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="typeOfTransaction" render={({ field }) => (
                <FormItem><FormLabel>Type of Transaction</FormLabel><FormControl><Input {...field} placeholder="e.g., Conference, Workshop" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="indexOfTransaction" render={({ field }) => (
                <FormItem><FormLabel>Index of Transaction</FormLabel><FormControl><Input {...field} placeholder="e.g., Scopus, SCI" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="impactFactor" render={({ field }) => (
                <FormItem><FormLabel>Impact Factor</FormLabel><FormControl><Input type="number" step="0.001" {...field} placeholder="0.000" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="impactFactorDate" render={({ field }) => (
                <FormItem><FormLabel>Impact Factor Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="publisher" render={({ field }) => (
                <FormItem><FormLabel>Publisher</FormLabel><FormControl><Input {...field} placeholder="Publisher name" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="COMMUNICATED">Communicated</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="statusDate" render={({ field }) => (
                <FormItem><FormLabel>Status Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="paperLinkDOI" render={({ field }) => (
              <FormItem><FormLabel>DOI / Paper Link</FormLabel><FormControl><Input {...field} placeholder="https://doi.org/..." /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="registrationFees" render={({ field }) => (
                <FormItem><FormLabel>Registration Fees (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="reimbursementStatus" render={({ field }) => (
                <FormItem><FormLabel>Reimbursement Status</FormLabel><FormControl><Input {...field} placeholder="e.g., Pending, Approved, Paid" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="isPublic" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Public Visibility</FormLabel>
                  <div className="text-sm text-muted-foreground">Make this transaction publicly visible</div>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />

            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <FormLabel>Authors *</FormLabel>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search for authors by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />}
              </div>
              {teachers.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer" onClick={() => addAuthor(teacher)}>
                      <div className="text-sm">
                        <div className="font-medium">{teacher.user?.name || "Unknown"}</div>
                        <div className="text-muted-foreground text-xs">{teacher.user?.email}</div>
                      </div>
                      <Button type="button" size="sm" variant="outline">Add</Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {form.watch("authors")?.map((author, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2 py-1 px-3">
                    <span>{getTeacherName(author.teacherId)}</span>
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeAuthor(index)} />
                  </Badge>
                ))}
              </div>
              <FormMessage>{form.formState.errors.authors?.message}</FormMessage>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isEdit ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
