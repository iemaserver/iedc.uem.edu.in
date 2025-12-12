"use client";

import { useState, useEffect } from "react";
import { StatusGraph } from "@/components/dashboard/teacher/ongoing-project/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/ongoing-project/GrowthGraph";
import { OngoingProjectsTable } from "@/components/dashboard/teacher/ongoing-project/OngoingProjectsTable";

export default function FacultyProjectPage() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/ongoing-project");
      if (response.ok) {
        const result = await response.json();
        setProjects(result.data || []);
      }
    } catch (error) {
      console.error("Error loading ongoing projects:", error);
    }
  };

  return (

     <div className="flex flex-1 flex-col gap-6 p-4 ">
           <div>
               <h1 className="text-2xl md:text-4xl font-bold text-[var(--first-color)]">Ongoing Projects</h1>
               <p className="text-sm md:text-base text-muted-foreground">Review and manage student ongoing projects</p>
             </div>
         <div className="w-full h-full min-w-0">
           <div className="flex flex-col w-full h-full gap-4 min-w-0">
             {/* Top section with two columns */}
             <div className="flex flex-col lg:flex-row w-full gap-4">
               <div className="w-full lg:w-1/3">
                 <StatusGraph data={projects}/>
               </div>
               <div className="w-full lg:w-2/3">
               <GrowthGraph data={projects} /></div>
             </div>
             
             {/* Bottom section */}
             {
               projects.length === 0 ?(
               <div className="flex items-center justify-center h-64">
                 <p className="text-muted-foreground">No ongoing projects found.</p>
               </div>
               ):(
               <div className="w-full flex-1 rounded-lg min-h-[300px] overflow-hidden min-w-0">
               <OngoingProjectsTable projects={projects} />
             </div>
               )
             }
             
           </div>
         </div>
         </div>
  
  );
}
