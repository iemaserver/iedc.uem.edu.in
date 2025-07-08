"use client";
import React from "react";
import {
  OnGoingProject as PrismaOnGoingProject,
  ProjectStatus,
} from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface OnGoingProjectWithRelations extends PrismaOnGoingProject {
  facultyAdvisors: { id: string; name: string; email: string }[];
  members: { id: string; name: string; email: string }[];
  status: ProjectStatus;
}

function CarouselOngoingProject({
  ongoingProjectData,
}: {
  ongoingProjectData?: OnGoingProjectWithRelations[];
}) {
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
      opts={{ align: "start", loop: true }}
      plugins={[
        Autoplay({
          delay: 5000,
        }),
      ]}
      className="w-full h-full"
    >
      <CarouselContent>
        {(ongoingProjectData?.length ?? 0) > 0 ? (
          (ongoingProjectData ?? []).map((project) => (
            <CarouselItem key={project.id} className="w-full h-full">
              <div className="p-1 w-full h-full">
                <Card className="h-fit group transition-transform duration-500 hover:scale-[1.02] hover:shadow-lg">
                  <CardContent className="flex flex-col md:grid md:grid-cols-2 h-fit p-4 gap-4 md:gap-6">
                    {/* Image */}
                    <div className="w-full h-[20rem] relative rounded-lg overflow-hidden shadow-md">
                      <Image
                        src={project.projectImage || "/home/gpu.png"}
                        alt={`${project.title} image`}
                        width={600}
                        height={400}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex flex-col h-full overflow-y-auto max-h-[350px] pr-1">
                      <div className="flex items-start justify-between mb-2">
                        <h2 className="text-xl md:text-2xl font-bold leading-tight pr-4">
                          {project.title}
                        </h2>
                        <Badge
                          variant="outline"
                          className={cn(
                            "py-1 px-3 text-sm font-semibold rounded-full min-w-max",
                            project.status === "ONGOING" &&
                              "bg-yellow-100 text-yellow-800 border-yellow-300",
                            project.status === "COMPLETED" &&
                              "bg-green-100 text-green-800 border-green-300",
                            project.status === "CANCELLED" &&
                              "bg-red-100 text-red-800 border-red-300",
                            project.status === "UPLOAD" &&
                              "bg-gray-100 text-gray-800 border-gray-300",
                            project.status === "PUBLISH" &&
                              "bg-blue-100 text-blue-800 border-blue-300"
                          )}
                        >
                          {project.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-700 leading-normal mb-3">
                        {project.description}
                      </p>

                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        <p>
                          <span className="font-semibold">Start Date:</span>{" "}
                          {formatDate(project.startDate)}
                        </p>
                        <p>
                          <span className="font-semibold">End Date:</span>{" "}
                          {project.endDate
                            ? formatDate(project.endDate)
                            : "Ongoing"}
                        </p>
                      </div>

                      {project.projectTags?.length > 0 && (
                        <div className="mb-3">
                          <h4 className="font-semibold mb-1 text-sm text-gray-800">
                            Tags:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {project.projectTags.map((tag, i) => (
                              <Badge key={i} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-sm space-y-2 mb-3">
                        <div className="flex flex-row flex-wrap gap-2 items-center">
                          <span className="font-semibold">Members:</span>
                          {project.members?.map((member) => (
                            <Badge
                              key={member.id}
                              variant="secondary"
                              className="text-sm px-2 py-1"
                            >
                              {member.name}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-row flex-wrap gap-2 items-center">
                          <span className="font-semibold">Faculty:</span>
                          {project.facultyAdvisors?.map((advisor) => (
                            <Badge
                              key={advisor.id}
                              variant="secondary"
                              className="text-sm px-2 py-1"
                            >
                              {advisor.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {project.projectLink && (
                        <div className="mt-auto pt-2 border-t border-gray-200">
                          <Link
                            href={project.projectLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <Badge className="bg-blue-600 text-white hover:bg-blue-700 transition-colors py-2 px-4 text-sm">
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
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 text-lg font-medium mb-2">
                No ongoing projects available
              </p>
              <p className="text-gray-500 text-sm text-center max-w-md">
                We're currently working on exciting new projects. Check back
                soon for updates!
              </p>
            </div>
          </CarouselItem>
        )}
      </CarouselContent>

      {(ongoingProjectData?.length ?? 0) > 1 && (
        <>
          <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
          <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />
        </>
      )}
    </Carousel>
  );
}

const OngoingProject = ({
  ongoingProjectData,
}: {
  ongoingProjectData?: OnGoingProjectWithRelations[];
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-0 md:px-7 xl:px-16 pb-10">
      <h1 className="text-4xl font-bold text-center my-4">
        Ongoing Projects
      </h1>
      <div className="w-full aspect-auto flex items-center justify-center">
        <CarouselOngoingProject ongoingProjectData={ongoingProjectData} />
      </div>
    </div>
  );
};

export default OngoingProject;
