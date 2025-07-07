"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { OnGoingProject as PrismaOnGoingProject, ProjectStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Shadcn UI Badge
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils"; // Assuming you have a utility for combining class names
import Link from "next/link";
import Image from "next/image";

// --- New type definition for the fetched project data ---
// We need to extend the Prisma type to include the related models
interface OnGoingProjectWithRelations extends PrismaOnGoingProject {
  facultyAdvisors: {
    id: string;
    name: string;
    email: string;
  }[];
  members: {
    id: string;
    name: string;
    email: string;
  }[];
  // Re-declare to ensure correct type from Prisma schema
  status: ProjectStatus;
}

function CarouselOngoingProject() {
  // Use the new type for state
  const [ongoingProjectData, setOngoingProjectData] = useState<
    OnGoingProjectWithRelations[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOngoingProjects = async () => {
      try {
        setIsLoading(true);
        // We can add a filter to only show 'PUBLISH' or 'ONGOING' projects if needed
        // For example: `/api/paper/ongoingProject?status=PUBLISH`
        const response = await axios.get("/api/paper/ongoingProject");
        console.log("ongoing project response is ", response.data);
        setOngoingProjectData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch ongoing projects:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOngoingProjects();
  }, []);

  // Format the date to a more readable format
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true, // Loop the carousel for a continuous flow
      }}
      // Add Autoplay plugin
      plugins={[
        Autoplay({
          delay: 5000, // Increased delay for better reading time
        }),
      ]}
      className="w-full h-full p-3"
    >
      <CarouselContent>
        {/*
          This is where the map function and conditional rendering should be.
          The CarouselItem and its content MUST be inside the map.
        */}
        {isLoading ? (
          <CarouselItem className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* A simple spinner animation can be added here */}
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="text-lg text-gray-600">Loading projects...</p>
            </div>
          </CarouselItem>
        ) : ongoingProjectData.length > 0 ? (
          ongoingProjectData.map((project) => (
            // Use project.id as key for stability
            <CarouselItem key={project.id} className="w-full h-full">
              <div className="p-1 w-full h-full">
                {/* Use 'group' class for the hover animation container */}
                <Card className="h-full group transition-transform duration-500 hover:scale-[1.02] hover:shadow-lg">
                  <CardContent
                    // FIX: Use a responsive grid or flex layout for better alignment
                    className="flex flex-col md:grid md:grid-cols-2 h-full p-6 gap-6 md:gap-8"
                  >
                    {/* Project Image Section */}
                    <div className="relative w-full aspect-video md:aspect-square rounded-lg overflow-hidden shadow-md">
                      {/* Use Next.js Image component for optimization */}
                      <Image
                        src={project.projectImage || "/home/gpu.png"} // Use a default image if projectImage is null
                        alt={`${project.title} image`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        style={{ objectFit: "cover" }}
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    {/* Project Details Section */}
                    <div
                      // FIX: Use flex-col and overflow-y-auto to manage content
                      className="flex flex-col h-full overflow-hidden"
                    >
                      {/* Title and Status Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <h2 className="text-2xl md:text-3xl font-bold leading-tight pr-4">
                          {project.title}
                        </h2>
                        {/* Display status with a Shadcn Badge */}
                        <Badge
                          variant="outline"
                          className={cn(
                            "py-1 px-3 text-sm font-semibold rounded-full min-w-max",
                            project.status === "ONGOING" && "bg-yellow-100 text-yellow-800 border-yellow-300",
                            project.status === "COMPLETED" && "bg-green-100 text-green-800 border-green-300",
                            project.status === "CANCELLED" && "bg-red-100 text-red-800 border-red-300",
                            project.status === "UPLOAD" && "bg-gray-100 text-gray-800 border-gray-300",
                            project.status === "PUBLISH" && "bg-blue-100 text-blue-800 border-blue-300"
                          )}
                        >
                          {project.status}
                        </Badge>
                      </div>

                      {/* Description & Metadata Section with controlled overflow */}
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Description */}
                        <p className="text-base text-gray-700 leading-relaxed mb-4">
                          {project.description}
                        </p>

                        {/* Dates */}
                        <div className="text-sm text-gray-600 space-y-1 mb-4">
                          <p>
                            <span className="font-semibold">Start Date:</span>{" "}
                            {formatDate(project.startDate)}
                          </p>
                          <p>
                            <span className="font-semibold">End Date:</span>{" "}
                            {project.endDate ? formatDate(project.endDate) : "Ongoing"}
                          </p>
                        </div>

                        {/* Tags */}
                        {project.projectTags && project.projectTags.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold mb-2 text-sm text-gray-800">
                              Tags:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {project.projectTags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Team Info */}
                        <div className="text-sm space-y-1 mb-4">
                          <p>
                            <span className="font-semibold">Members:</span>{" "}
                            {project.members
                              ?.map((member) => member.name)
                              .join(", ") || "N/A"}
                          </p>
                          <p>
                            <span className="font-semibold">Faculty Advisors:</span>{" "}
                            {project.facultyAdvisors
                              ?.map((advisor) => advisor.name)
                              .join(", ") || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Project Link - Aligned to the bottom */}
                      {project.projectLink && (
                        <div className="mt-auto pt-4 border-t border-gray-200">
                          <Link
                            href={project.projectLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block" // Ensure the link is a block-level element for proper alignment
                          >
                            <Badge className="bg-blue-600 text-white hover:bg-blue-700 transition-colors py-2 px-4 text-base">
                              View Project
                            </Badge>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))
        ) : (
          <CarouselItem className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500 text-lg">No ongoing projects found.</p>
          </CarouselItem>
        )}
      </CarouselContent>
      {/* Conditionally render navigation buttons */}
      {ongoingProjectData.length > 1 && (
        <>
          <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
          <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />
        </>
      )}
    </Carousel>
  );
}

// The main component remains the same, but now it renders the enhanced Carousel
const OngoingProject = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-3 md:px-7 xl:px-16 pb-10">
      <h1 className="text-4xl font-bold text-center mb-4">Ongoing Projects</h1>
      <div className="w-full aspect-square md:aspect-auto md:h-[80vh] lg:h-[85vh] flex items-center justify-center">
        <CarouselOngoingProject />
      </div>
    </div>
  );
};

export default OngoingProject;