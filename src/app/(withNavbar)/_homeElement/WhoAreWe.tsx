import React from "react";
import AboutUsMarquee from "./WhoWeAreMarquee";
import CountUp from "react-countup";
import { Plus } from "lucide-react";

const WhoAreWe = () => {
  return (
    <div className="min-h-fit md:mt-16 mt-8 h-max flex flex-col lg:flex-row items-start lg:justify-between justify-between w-full md:px-4 gap-9 md:gap-4">
      <div className="text-area flex flex-col gap-3 items-center justify-center h-fit p-3  lg:w-3/4 xl:w-1/2 w-full">
        <h2 className="font-extrabold text-4xl">Who Are We?</h2>
        <p className="text-justify lg:text-left">
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text ever
          since the 1500s, when an unknown printer took a galley of type and
          scrambled it to make a type specimen book. It has survived not only
          five centuries, but also the leap into electronic typesetting,
          remaining essentially unchanged. It was popularised in the 1960s with
          the release of Letraset sheets containing Lorem Ipsum passages, and
          more recently with desktop publishing software like Aldus PageMaker
          including versions of Lorem Ipsum.
        </p>
        <div className="h-auto w-full flex items-center justify-between px-3">
          <div className="flex gap-3 flex-col items-center justify-between">
            <div className="flex gap-1 flex-col items-center justify-center">
              <p className="text-4xl font-medium">Papers</p>
              <CountUp end={100} duration={6} className="text-4xl" suffix="+" />
            </div>
            <div className="flex gap-1 flex-col items-center justify-center">
              <p className="text-4xl font-medium">Students</p>
              <CountUp end={180} duration={6} className="text-4xl" suffix="+" />
            </div>
          </div>
          <div className="flex gap-3 flex-col items-center justify-between">
            <div className="flex gap-1 flex-col items-center justify-center">
              <p className="text-4xl font-medium">Faculties</p>
              <CountUp end={13} duration={6} className="text-4xl" suffix="+" />
            </div>
            <div className="flex gap-1 flex-col items-center justify-center">
              <p className="text-4xl font-medium">Patents</p>
              <CountUp end={30} duration={6} className="text-4xl" suffix="+" />
            </div>
          </div>
        </div>
      </div>
      <div className=" lg:w-1/4 xl:w-1/2 w-full ">
        <AboutUsMarquee />
      </div>
    </div>
  );
};

export default WhoAreWe;
