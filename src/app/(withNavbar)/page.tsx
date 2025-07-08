"use client";

import { useSession } from "next-auth/react";

import FacultyCarousel, {SmFacultyCarousel} from "./_homeElement/FacultyCarousel";
import OngoingProject from "./_homeElement/OngoingProject";
import PublishedProject from "./_homeElement/PublishedProject";
import LabFacility from "./_homeElement/Facility";
import WhoAreWe from "./_homeElement/WhoAreWe";
import HomeFirstElement from "./_homeElement/homeFirstElement";
import { useEffect, useState } from "react";
import axios from "axios";
import { OnGoingProject as PrismaOnGoingProject, ProjectStatus, ResearchPaper } from "@prisma/client";

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


export interface ResearchPaperWithRelations extends ResearchPaper {
  reviewer: {
    id: string;
    name: string;
    email: string;
  } | null;
  author: {
    id: string;
    name: string;
    email: string;
  }[];
  facultyAdvisors: {
    id: string;
    name: string;
    email: string;
  }[];
}



export default function Home() {
  const {data:session} = useSession();

    const [isLoading, setIsLoading] = useState(true);
    const [ongoingProjectData, setOngoingProjectData] = useState<OnGoingProjectWithRelations[]>([]);
  useEffect(() => {
    if (session) {
      console.log("User session data:", session);
    } else {
      console.log("No user session found");
    }
  }, [session]);


  useEffect(() => {
      const fetchOngoingProjects = async () => {
        try {
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
     const [papers, setPapers] = useState<ResearchPaperWithRelations[]>([]);

      useEffect(() => {
        const fetchPapers = async () => {
          try {
            setIsLoading(true);
            // Adjust this endpoint based on your actual API
            // For now, using a placeholder until you have a papers API
            const response = await axios.get("/api/paper/researchPaper");
            setPapers(response.data.data || []);
            console.log("Published papers fetched:", response.data.data);
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
    <div className="flex flex-col h-auto w-full">
      <HomeFirstElement />
      <WhoAreWe />
      <OngoingProject ongoingProjectData={ongoingProjectData} />
      <div className="flex flex-col lg:flex-row   items-center justify-between w-full px-4 gap-4 my-10">
        <div className="w-full  flex flex-col items-center justify-start">
          <p className="font-extrabold md:text-4xl text-2xl mb-4">
            Laboratory Facilities
          </p>
          <p className="text-justify text-md">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem alias
            vel itaque quibusdam dignissimos similique doloribus provident
            quidem suscipit, asperiores obcaecati repellendus laudantium animi
            modi impedit a? Animi, similique dicta?
          </p>
          <p className="hidden md:block">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consequatur odio voluptatum alias! Sed necessitatibus aliquam
            tempora itaque, porro eligendi molestiae laboriosam quis ex
            voluptatum cupiditate veniam, harum laborum minus saepe!Lorem Lorem
            ipsum dolor sit amet consectetur adipisicing elit. Delectus earum at
            quasi autem harum reiciendis quisquam provident quos mollitia
            distinctio tempore, vero placeat odit similique, perferendis
            debitis. Alias, laborum placeat.
          </p>
        </div>
        <div className="w-full lg:1/2">
          <LabFacility />
        </div>
      </div>
      <div className="flex flex-col  items-center justify-between w-full px-4">
        <p className="font-extrabold text-4xl mb-4">Our Faculties</p>
        <FacultyCarousel />

        <SmFacultyCarousel />
      </div>
      <PublishedProject paper={papers} />
    </div>
  );
}
