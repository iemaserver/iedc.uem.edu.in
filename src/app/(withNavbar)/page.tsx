"use client";

import { useSession } from "next-auth/react";
import { BentoGridDemo } from "./_homeElement/BentoGrid";
import FacultyCarousel, {SmFacultyCarousel} from "./_homeElement/FacultyCarousel";
import OngoingProject from "./_homeElement/OngoingProject";
import PublishedProject from "./_homeElement/PublishedProject";
import LabFacility from "./_homeElement/Facility";
import WhoAreWe from "./_homeElement/WhoAreWe";
import HomeFirstElement from "./_homeElement/homeFirstElement";
import { useEffect } from "react";

export default function Home() {
  const {data:session} = useSession();
  useEffect(() => {
    if (session) {
      console.log("User session data:", session);
    } else {
      console.log("No user session found");
    }
  }, [session]);
  return (
    <div className="flex flex-col h-auto w-full">
      <HomeFirstElement />
      <WhoAreWe />
      <OngoingProject />
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
      <div className="flex h-max  gap-7 flex-col items-center justify-between w-full px-4 my-10">
        <p className="font-extrabold text-4xl mb-4">Ongoing Projects</p>
        <BentoGridDemo />
      </div>
      <PublishedProject />
    </div>
  );
}
