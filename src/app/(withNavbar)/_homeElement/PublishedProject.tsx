"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// Placeholder type for paper data - adjust based on your actual schema
interface PublishedPaper {
  id: string;
  title: string;
  description?: string;
  authors?: string[];
  publishedDate?: string;
  journal?: string;
  doi?: string;
}

export function CarouselPublishedProject() {
  const [papers, setPapers] = useState<PublishedPaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setIsLoading(true);
        // Adjust this endpoint based on your actual API
        // For now, using a placeholder until you have a papers API
        const response = await axios.get("/api/paper/published");
        setPapers(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch published papers:", error);
        setPapers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPapers();
  }, []);

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
      className="w-full h-full p-3"
    >
      <CarouselContent>
        {isLoading ? (
          <CarouselItem className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="text-lg text-gray-600">Loading published papers...</p>
            </div>
          </CarouselItem>
        ) : papers.length > 0 ? (
          papers.map((paper, index) => (
            <CarouselItem key={paper.id || index} className="w-full h-full lg:basis-1/2">
              <div className="p-1 w-full h-full">
                <Card className="w-full h-full">
                  <CardContent className="flex w-full h-full flex-col items-center justify-center p-6">
                    <h3 className="text-xl font-bold mb-2 text-center">{paper.title}</h3>
                    {paper.description && (
                      <p className="text-sm text-gray-600 mb-2 text-center line-clamp-3">
                        {paper.description}
                      </p>
                    )}
                    {paper.authors && (
                      <p className="text-xs text-gray-500 mb-2">
                        Authors: {paper.authors.join(", ")}
                      </p>
                    )}
                    {paper.journal && (
                      <p className="text-xs text-gray-500 mb-2">
                        Published in: {paper.journal}
                      </p>
                    )}
                    {paper.publishedDate && (
                      <p className="text-xs text-gray-500">
                        Date: {new Date(paper.publishedDate).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))
        ) : (
          <CarouselItem className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">No published papers found.</p>
              <p className="text-gray-400 text-sm">Check back later for updates.</p>
            </div>
          </CarouselItem>
        )}
      </CarouselContent>
      {papers.length > 1 && (
        <>
          <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
          <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />
        </>
      )}
    </Carousel>
  );
}

const PublishedProject = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-3 md:px-7 xl:px-16 pb-10">
      <h1 className="text-3xl font-bold text-center mb-4">Recent Published Papers</h1>
      <div className="w-full aspect-square md:aspect-auto md:h-[80vh] lg:h-[85vh] flex items-center justify-center">
        <CarouselPublishedProject />
      </div>
    </div>
  );
};

export default PublishedProject;

