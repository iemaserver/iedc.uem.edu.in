"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ✅ Zod schema for base ResearchWork
const baseResearchSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(5, "Description is too short"),
  publishedYear: z.number().int().min(1900).max(new Date().getFullYear()),
  type: z.enum([
    "COPYRIGHT",
    "PATENT",
    "TRANSACTION",
    "CONFERENCE",
    "JOURNAL",
    "BOOK_CHAPTER",
    "GRANT_IN",
    "FDP",
    "CERTIFICATION",
  ]),
})

// ✅ Extend schema based on type
const typeSpecificSchemas = {
  COPYRIGHT: z.object({ copyrightNumber: z.string().min(1) }),
  PATENT: z.object({ patentNumber: z.string().min(1) }),
  TRANSACTION: z.object({ transactionId: z.string().min(1) }),
  CONFERENCE: z.object({
    conferenceName: z.string().min(1),
    location: z.string().min(1),
  }),
  JOURNAL: z.object({ journalName: z.string().min(1), issn: z.string().min(1) }),
  BOOK_CHAPTER: z.object({ bookTitle: z.string().min(1) }),
  GRANT_IN: z.object({ grantNumber: z.string().min(1) }),
  FDP: z.object({ fdpTitle: z.string().min(1) }),
  CERTIFICATION: z.object({ certificateId: z.string().min(1) }),
} as const

// ✅ Final schema (dynamic)
const researchSchema = baseResearchSchema.and(z.union([
  typeSpecificSchemas.COPYRIGHT,
  typeSpecificSchemas.PATENT,
  typeSpecificSchemas.TRANSACTION,
  typeSpecificSchemas.CONFERENCE,
  typeSpecificSchemas.JOURNAL,
  typeSpecificSchemas.BOOK_CHAPTER,
  typeSpecificSchemas.GRANT_IN,
  typeSpecificSchemas.FDP,
  typeSpecificSchemas.CERTIFICATION,
]))

export function ResearchWorkForm() {
  const [selectedType, setSelectedType] = useState<string>("COPYRIGHT")

  const form = useForm<z.infer<typeof researchSchema>>({
    resolver: zodResolver(researchSchema),
    defaultValues: {
      title: "",
      description: "",
      publishedYear: new Date().getFullYear(),
      type: "COPYRIGHT",
    },
  })

  function onSubmit(values: z.infer<typeof researchSchema>) {
    console.log("ResearchWork submitted:", values)
    // send values to API
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Research title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Brief description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Published Year */}
        <FormField
          control={form.control}
          name="publishedYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Published Year</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1900}
                  max={new Date().getFullYear()}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type Selector */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Research Type</FormLabel>
              <Select
                onValueChange={(val) => {
                  field.onChange(val)
                  setSelectedType(val)
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.keys(typeSpecificSchemas).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dynamic Fields */}
        {selectedType === "COPYRIGHT" && (
          <FormField
            control={form.control}
            name="copyrightNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Copyright Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter copyright number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType === "PATENT" && (
          <FormField
            control={form.control}
            name="patentNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patent Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter patent number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType === "TRANSACTION" && (
          <FormField
            control={form.control}
            name="transactionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter transaction id" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType === "CONFERENCE" && (
          <>
            <FormField
              control={form.control}
              name="conferenceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conference Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Conference name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Conference location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {selectedType === "JOURNAL" && (
          <>
            <FormField
              control={form.control}
              name="journalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Journal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Journal name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="issn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ISSN</FormLabel>
                  <FormControl>
                    <Input placeholder="ISSN number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {selectedType === "BOOK_CHAPTER" && (
          <FormField
            control={form.control}
            name="bookTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Book Title</FormLabel>
                <FormControl>
                  <Input placeholder="Book title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType === "GRANT_IN" && (
          <FormField
            control={form.control}
            name="grantNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grant Number</FormLabel>
                <FormControl>
                  <Input placeholder="Grant number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType === "FDP" && (
          <FormField
            control={form.control}
            name="fdpTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>FDP Title</FormLabel>
                <FormControl>
                  <Input placeholder="FDP title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType === "CERTIFICATION" && (
          <FormField
            control={form.control}
            name="certificateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certificate ID</FormLabel>
                <FormControl>
                  <Input placeholder="Certificate ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit">Submit Research Work</Button>
      </form>
    </Form>
  )
}
