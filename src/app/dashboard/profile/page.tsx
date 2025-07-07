"use client"

import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Camera, Loader2 } from "lucide-react" // Import Loader2 for the spinner
import Image from "next/image"
import { deleteFile, uploadFile } from "@/lib/appwrite"
import { useSession } from "next-auth/react"

// Define the form schema using Zod
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  degree: z.string().optional(),
  year: z.coerce.number().optional(),
  department: z.string().optional(),
  university: z.string().optional(),
  areaOfInterest: z.array(z.string()).optional(),
  position: z.string().optional(),
  facultyAcademicDetails: z.string().optional(),
  facultyResearchInterests: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Helper function to extract the file ID from an Appwrite storage URL
const getAppwriteFileId = (url: string) => {
  try {
    const urlParts = url.split('/')
    const filesIndex = urlParts.indexOf('files')
    if (filesIndex > -1 && urlParts.length > filesIndex + 1) {
      return urlParts[filesIndex + 1]
    }
    return null
  } catch (error) {
    console.error("Failed to parse file ID from URL:", error)
    return null
  }
}

export default function UpdateUserForm() {
  const [initialData, setInitialData] = useState<FormValues | null>(null)
  const [userType, setUserType] = useState<"STUDENT" | "FACULTY" | "ADMIN">("STUDENT")
  const [email, setEmail] = useState("")
  const [profileImage, setProfileImage] = useState<string>("")
  const [interestInput, setInterestInput] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [isImageUploading, setIsImageUploading] = useState(false) // New state for image upload loading
  const [isProfileUpdating, setIsProfileUpdating] = useState(false) // New state for form submission loading

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  const areaOfInterest = watch("areaOfInterest") || []
  const { data: session, status, update } = useSession()

  useEffect(() => {
    async function fetchData() {
      if (status !== "authenticated" || !session?.user?.id) return
      try {
        const res = await axios.get(`/api/user/${session.user.id}`)
        const user = res.data
        setEmail(user.email)
        setUserType(user.userType)
        setInitialData(user)
        setProfileImage(user.profileImage || "")
        reset({
          name: user.name || "",
          degree: user.degree || "",
          year: user.year || undefined,
          department: user.department || "",
          university: user.university || "",
          areaOfInterest: user.areaOfInterest || [],
          position: user.position || "",
          facultyAcademicDetails: user.facultyAcademicDetails || "",
          facultyResearchInterests: user.facultyResearchInterests || "",
        })
      } catch (error) {
        toast.error("Failed to load user data. Please try again.")
      }
    }

    fetchData()
  }, [reset, session?.user?.id, status])

  const handleInterestAdd = () => {
    if (interestInput.trim()) {
      setValue("areaOfInterest", [...areaOfInterest, interestInput.trim()])
      setInterestInput("")
    }
  }

  const handleInterestRemove = (indexToRemove: number) => {
    setValue(
      "areaOfInterest",
      areaOfInterest.filter((_, index) => index !== indexToRemove)
    )
  }

  const onSubmit = async (data: FormValues) => {
    if (!session?.user?.id) {
      toast.error("User session not found.")
      return
    }

    setIsProfileUpdating(true)
    const updateToastId = toast.loading("Updating your profile...")

    try {
      const res = await axios.put(`/api/user/${session.user.id}`, { ...data, profileImage })
      const updatedUser = res.data

      // Check if userType, name, or profileImage has changed and trigger a session update
      if (
        updatedUser.userType !== session.user.userType ||
        updatedUser.name !== session.user.name ||
        updatedUser.profileImage !== session.user.image
      ) {
        await update({
          user: {
            ...session.user,
            name: updatedUser.name,
            userType: updatedUser.userType,
            image: updatedUser.profileImage, // Use 'image' for NextAuth session
          },
        })
      }

      toast.success("Profile updated successfully!", { id: updateToastId })
    } catch (error: any) {
      console.error("Failed to update user:", error)
      toast.error(error.response?.data?.message || "Failed to update profile. Please try again.", { id: updateToastId })
    } finally {
      setIsProfileUpdating(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileToUpload(file)
    }
  }

  const handleImageUploadSubmit = async () => {
    if (!fileToUpload) {
      toast.error("Please select a file to upload.")
      return
    }

    setIsImageUploading(true)
    const uploadToastId = toast.loading("Uploading image...")

    try {
      // Step 1: Check if a profile image already exists and delete it from Appwrite.
      if (profileImage && profileImage.includes('storage/buckets')) {
        const oldFileId = getAppwriteFileId(profileImage)
        if (oldFileId) {
          try {
            await deleteFile(oldFileId)
            console.log("Old Appwrite image deleted successfully.")
          } catch (deleteError) {
            console.error("Failed to delete old Appwrite image:", deleteError)
            // It's okay to continue the upload even if deletion fails, just log the error.
          }
        }
      }
      
      // Step 2: Upload the new image to Appwrite
      const fileUrl = await uploadFile(fileToUpload)
      setProfileImage(fileUrl)
      
      toast.success("Profile image updated!", { id: uploadToastId })
      setDialogOpen(false)
      setFileToUpload(null)
    } catch (err) {
      console.error("Image upload failed:", err)
      toast.error("Image upload failed. Please try again.", { id: uploadToastId })
    } finally {
      setIsImageUploading(false)
    }
  }

  if (!initialData) {
    return (
      <div className="w-full mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/2 mx-auto" />
        <Skeleton className="h-32 w-32 rounded-full mx-auto mt-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10 col-span-2" />
          <Skeleton className="h-24 col-span-2" />
          <Skeleton className="h-24 col-span-2" />
        </div>
        <Skeleton className="h-12 w-full mt-6" />
      </div>
    )
  }

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">Update Profile</h1>
      <div className="flex flex-col items-center relative w-32 h-32 mx-auto">
        <Image
          src={profileImage || "https://via.placeholder.com/128x128/aabbcc/ffffff.png?text=User"}
          alt="Profile"
          width={128}
          height={128}
          className="rounded-full object-cover border-2 border-blue-500 aspect-square"
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="absolute bottom-7 cursor-pointer right-0 bg-white rounded-full">
              <Camera className="h-5 w-5 text-black" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Upload Profile Image</DialogTitle>
            <div className="space-y-4">
              <Label htmlFor="profile-upload">Upload Image</Label>
              <Input id="profile-upload" type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            <DialogFooter>
              <Button onClick={handleImageUploadSubmit} disabled={!fileToUpload || isImageUploading}>
                {isImageUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="year">Year</Label>
            <Input id="year" type="number" {...register("year")} />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input id="department" {...register("department")} />
          </div>
          <div>
            <Label htmlFor="degree">Degree</Label>
            <Input id="degree" {...register("degree")} />
          </div>
          <div>
            <Label htmlFor="university">University</Label>
            <Input id="university" {...register("university")} />
          </div>
        </div>

        <div>
          <Label htmlFor="areaOfInterest">Area of Interest</Label>
          <div className="flex items-center gap-2">
            <Input
              id="areaOfInterest"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" ? (e.preventDefault(), handleInterestAdd()) : null)}
            />
            <Button type="button" onClick={handleInterestAdd} variant="outline" disabled={!interestInput.trim()}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {areaOfInterest.map((item, idx) => (
              <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                {item}
                <button
                  type="button"
                  onClick={() => handleInterestRemove(idx)}
                  className="ml-1 text-xs text-gray-500 hover:text-red-500"
                >
                  &times;
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {userType === "FACULTY" && (
          <>
            <div>
              <Label htmlFor="position">Position</Label>
              <Input id="position" {...register("position")} />
            </div>
            <div>
              <Label htmlFor="facultyAcademicDetails">Faculty Academic Details</Label>
              <Textarea id="facultyAcademicDetails" rows={3} {...register("facultyAcademicDetails")} />
            </div>
            <div>
              <Label htmlFor="facultyResearchInterests">Faculty Research Interests</Label>
              <Textarea id="facultyResearchInterests" rows={3} {...register("facultyResearchInterests")} />
            </div>
          </>
        )}

        <Button type="submit" disabled={isProfileUpdating} className="w-full">
          {isProfileUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Profile"
          )}
        </Button>
      </form>
    </div>
  )
}