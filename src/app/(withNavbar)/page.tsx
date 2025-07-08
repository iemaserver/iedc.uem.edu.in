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
  const [error, setError] = useState<string | null>(null);
  const [ongoingProjectData, setOngoingProjectData] = useState<OnGoingProjectWithRelations[]>([]);
  const [researchPaper, setResearchPaper] = useState<ResearchPaperWithRelations[]>([]);

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
        setIsLoading(true);
        setError(null);
        const response = await axios.get("/api/paper/ongoingProject");
        console.log("ongoing project response is ", response.data);
        
        if (response.data && response.data.data) {
          setOngoingProjectData(response.data.data);
        } else {
          setOngoingProjectData([]);
        }
      } catch (error) {
        console.error("Failed to fetch ongoing projects:", error);
        setError("Failed to load ongoing projects. Please try again later.");
        setOngoingProjectData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOngoingProjects();
  }, []);

  // Fetch research papers
  useEffect(() => {
    const fetchResearchPapers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/paper/researchPaper");
        setResearchPaper(response.data.data || []);
        console.log("Published papers fetched:", response.data.data);
      } catch (error) {
        console.error("Failed to fetch published papers:", error);
        setResearchPaper([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResearchPapers();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-600">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-auto w-full">
      <HomeFirstElement />
      <WhoAreWe />
      
      {/* Ongoing Projects Section with Error Handling */}
      <div className="w-full h-full flex flex-col items-center justify-start p-3 md:px-7 xl:px-16 pb-10">
        <h1 className="text-4xl font-bold text-center mb-4">Ongoing Projects</h1>
        {error ? (
          <div className="w-full flex flex-col items-center justify-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 font-medium">Error Loading Projects</p>
              </div>
              <p className="text-red-600 text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <OngoingProject ongoingProjectData={ongoingProjectData} />
        )}
      </div>
      
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
      
      <PublishedProject paper={researchPaper}/>
    </div>
  );
}
