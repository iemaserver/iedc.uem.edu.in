"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ResearchPaper } from "@prisma/client";
import { ResearchPaperWithRelations } from "../page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import Link from "next/link";

export function CarouselPublishedProject({
  paper,
}: {
  paper: ResearchPaperWithRelations[];
}) {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 3000,
        }),
      ]}
      className="w-full h-[34rem] p-3"
    >
      <CarouselContent>
        {paper.length > 0 ? (
          paper.map((paper, index) => (
            <CarouselItem
              key={paper.id || index}
              className="w-full h-full lg:basis-1/2"
            >
              <div className="p-1 w-full h-full">
                <Card className="w-full h-full">
                  <CardHeader>
                    <h2 className="text-lg font-semibold text-center">
                      {paper.title}
                    </h2>
                  </CardHeader>
                  <CardContent className="flex w-full h-full flex-col items-center justify-center p-6 gap-4">
                    {paper.abstract && (
                      <p className=" text-gray-600 mb-2 text-center line-clamp-3">
                        {paper.abstract.length > 400
                          ? `${paper.abstract.slice(0, 400)}...`
                          : paper.abstract}
                      </p>
                    )}
                    {paper.author.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {paper.author.map((author) => (
                          <Badge
                            key={author.id}
                            variant="outline"
                            className="text-sm font-semibold mb-2"
                          >
                            {author.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {paper.facultyAdvisors &&
                      paper.facultyAdvisors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          Faculty Advisors : 
                          {paper.facultyAdvisors.map((advisor) => (
                            <Badge
                              key={advisor.id}
                              variant="outline"
                              className="text-sm font-semibold mb-2"
                            >
                              {advisor.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    {paper.reviewer && (
                      <p className="text-lg text-gray-500">
                        Reviewers: {paper.reviewer.name}
                      </p>
                    )}
                    {paper.submissionDate && (
                      <p className="text-xs text-gray-400 mt-2">
                        Published on:{" "}
                        {new Date(paper.submissionDate).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="flex justify-between w-full">
                      <Button variant="outline">
                        <Link
                          href={`/paper/${paper.id}`}
                          className="flex items-center"
                        >
                          View Details
                        </Link>
                      </Button>
                      <Button variant="default">
                        
                        <a
                          href={paper.filePath}
                          target="_blank"
                          rel="noopener noreferrer">
                            <DownloadIcon className="w-4 h-4 mr-2 inline" />
                            Download
                          </a>
                        </Button>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </CarouselItem>
          ))
        ) : (
          <CarouselItem className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">
                No published papers found.
              </p>
              <p className="text-gray-400 text-sm">
                Check back later for updates.
              </p>
            </div>
          </CarouselItem>
        )}
      </CarouselContent>
      {paper.length > 1 && (
        <>
          <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
          <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />
        </>
      )}
    </Carousel>
  );
}

const PublishedProject = ({
  paper,
}: {
  paper: ResearchPaperWithRelations[];
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-3 md:px-7 xl:px-16 pb-10">
      <h1 className="text-3xl font-bold text-center mb-4">
        Recent Published Papers
      </h1>
      <div className="w-full aspect-square md:aspect-auto md:h-[80vh] lg:h-[85vh] flex items-center justify-center">
        <CarouselPublishedProject paper={paper} />
      </div>
    </div>
  );
};

export default PublishedProject;
