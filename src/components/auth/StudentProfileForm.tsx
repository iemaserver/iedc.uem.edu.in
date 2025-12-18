"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface StudentProfileData {
  rollNumber: string;
  batch: string;
  year: number;
  section: string;
  department: string;
  phoneNumber?: string;
  address?: string;
  bio?: string;
}

const DEPARTMENTS = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical",
  "Chemical",
  "Other",
];

const SECTIONS = ["A", "B", "C", "D", "E"];
const YEARS = [1, 2, 3, 4];

export function StudentProfileForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<StudentProfileData>({
    rollNumber: "",
    batch: new Date().getFullYear().toString(),
    year: 1,
    section: "",
    department: "",
    phoneNumber: "",
    address: "",
    bio: "",
  });

  const totalSteps = 3; // Added preview step

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile/complete-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to complete profile");
      }

      toast.success("Profile completed successfully!");
      
      // Refresh the page to trigger session update
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast.error(error.message || "Failed to complete profile");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.rollNumber && formData.department && formData.section;
    }
    return true;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-white">Step {step} of {totalSteps}</span>
          <span className="text-sm text-[var(--forth-color)]">{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--third-color)] to-[var(--forth-color)]"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Academic Information */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Academic Information</h2>
              <p className="text-[var(--forth-color)] text-sm">Tell us about your academic details</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="rollNumber" className="text-white">Roll Number *</Label>
                <Input
                  id="rollNumber"
                  type="text"
                  placeholder="e.g., 2024UG1234"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="batch" className="text-white">Batch Year</Label>
                  <Input
                    id="batch"
                    type="text"
                    placeholder="2024"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div>
                  <Label htmlFor="year" className="text-white">Current Year *</Label>
                  <Select value={formData.year.toString()} onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}>
                    <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department" className="text-white">Department *</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                    <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="section" className="text-white">Section *</Label>
                  <Select value={formData.section} onValueChange={(value) => setFormData({ ...formData, section: value })}>
                    <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((section) => (
                        <SelectItem key={section} value={section}>{section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Personal Information */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Personal Information</h2>
              <p className="text-[var(--forth-color)] text-sm">Tell us more about yourself</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phoneNumber" className="text-white">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-white">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Your complete address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-white">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself, your interests, and goals..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  rows={4}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Review Your Profile</h2>
              <p className="text-[var(--forth-color)] text-sm">Please review your information before submitting</p>
            </div>

            <div className="bg-white/10 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[var(--forth-color)] text-sm">Roll Number</p>
                  <p className="text-white font-semibold">{formData.rollNumber}</p>
                </div>
                <div>
                  <p className="text-[var(--forth-color)] text-sm">Department</p>
                  <p className="text-white font-semibold">{formData.department}</p>
                </div>
                <div>
                  <p className="text-[var(--forth-color)] text-sm">Year</p>
                  <p className="text-white font-semibold">{formData.year}</p>
                </div>
                <div>
                  <p className="text-[var(--forth-color)] text-sm">Section</p>
                  <p className="text-white font-semibold">{formData.section}</p>
                </div>
              </div>

              {formData.phoneNumber && (
                <div>
                  <p className="text-[var(--forth-color)] text-sm">Phone Number</p>
                  <p className="text-white font-semibold">{formData.phoneNumber}</p>
                </div>
              )}

              {formData.address && (
                <div>
                  <p className="text-[var(--forth-color)] text-sm">Address</p>
                  <p className="text-white">{formData.address}</p>
                </div>
              )}

              {formData.bio && (
                <div>
                  <p className="text-[var(--forth-color)] text-sm">Bio</p>
                  <p className="text-white">{formData.bio}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-white/20">
        <Button
          type="button"
          onClick={handlePrevious}
          disabled={step === 1}
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
        >
          Previous
        </Button>
        
        {step < totalSteps ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-gradient-to-r from-[var(--third-color)] to-[var(--forth-color)] text-[var(--first-color)] hover:from-[var(--forth-color)] hover:to-[var(--third-color)]"
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-gradient-to-r from-[var(--third-color)] to-[var(--forth-color)] text-[var(--first-color)] hover:from-[var(--forth-color)] hover:to-[var(--third-color)]"
          >
            {isLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
            Complete Profile
          </Button>
        )}
      </div>
    </div>
  );
}
