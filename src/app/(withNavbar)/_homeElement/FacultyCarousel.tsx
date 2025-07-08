"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { User } from "@prisma/client"; // Assuming `User` is imported from Prisma client
import { Button } from "@/components/ui/button"; // Assuming you have a Shadcn UI Button component
import Image from "next/image";

// --- Custom CSS for the overlay and background image ---
// You can add this to your global CSS file (e.g., globals.css or a dedicated component CSS file)
// and import it.
//
// .faculty-card-bg {
//   position: relative;
//   overflow: hidden;
// }
//
// .faculty-card-bg::before {
//   content: '';
//   position: absolute;
//   top: 0;
//   left: 0;
//   width: 100%;
//   height: 100%;
//   background-size: cover;
//   background-position: center;
//   transition: transform 0.5s ease-in-out;
//   filter: brightness(0.8);
//   z-index: 1; /* Below the content */
// }
//
// .group:hover .faculty-card-bg::before {
//   transform: scale(1.1);
// }
//
// .content-overlay {
//   position: absolute;
//   bottom: 0;
//   left: 0;
//   width: 100%;
//   background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
//   color: white;
//   padding: 1rem;
//   transform: translateY(100%);
//   transition: transform 0.5s ease-in-out;
//   z-index: 2; /* Above the background */
// }
//
// .group:hover .content-overlay {
//   transform: translateY(0);
// }




export const FacultyData = [
  {
    id: "1",
    name: "Prof. (Dr.) Sandip Mandal",
    position: "Head of Department of CSE(Iot, CS, BT)",
    profileImage: "/faculty/sandipMandalSir.png", // Replace with actual image path
  },
  {
    id: "2",
    name: "Sweta Saha",
    position: "Associate Professor of CSE(IoT, CS, BT)",
    profileImage: "/faculty/swetamam.jpg", // Replace with actual image path
  },
  {
    id: "3",
    name: "Dr. Susmita Biswas",
    position: "Assistant Professor of CSE(IoT, CS, BT)",
    profileImage: "/faculty/susmitamam.jpg", // Replace with actual image path
  },
  {
    id: "4",
    name: "Dr. Siddhartha Roy",
    position: "Assistant Professor of CSE(IoT, CS, BT)",
    profileImage: "/faculty/shiddharthasir.jpg", // Replace with actual image path
  },
  {
    id: "5",
    name: "Dr. Arijeet Ghosh",
    position: "Associate Professor of CSE(IoT, CS, BT)",
    profileImage: "/faculty/arijeetsir.png", // Replace with actual image path
  },

  {
    id: "6",
    name: "Avik Kumar Das",
    position: "Associate Professor of CSE(IoT, CS, BT)",
    profileImage: "/faculty/aviksir.png", // Replace with actual image path
  },
  {
    id: "7",
    name: "Sangita Dutta",
    position: "Associate Professor of CSE(IoT, CS, BT)",
    profileImage: "/faculty/sangitamam.jpg", // Replace with actual image path
  },
  {
    id: "8",
    name: "Apurba Nandi",
    position: "Associate Professor of CSE(IoT, CS, BT)",
    profileImage: "/faculty/apurbasir.png", // Replace with actual image path
  },
  
]

const FacultyCarousel = () => {
 

  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false })
  );

  return (
    <div className="w-full h-fit lg:block hidden">
      <Carousel
        opts={{
          align: "start",
        }}
        plugins={[plugin.current]}
        className="w-full h-[25rem]"
      >
        <CarouselContent className="h-full">
          {FacultyData && FacultyData.length > 0 ? (
            FacultyData.map((faculty, index) => (
              <CarouselItem
                key={faculty.id || index}
                className="md:basis-1/3 lg:basis-1/4"
              >
                <div className="p-1 h-full">
                  <Card className="w-full h-full group relative overflow-hidden rounded-lg shadow-lg">
                    {/* Image as a background */}
                    <div className="absolute inset-0 w-full h-full">
                      <Image
                        src={faculty.profileImage || "/placeholder-profile.png"}
                        alt={faculty.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                        className="transition-transform duration-500 group-hover:scale-110 filter brightness-75"
                      />
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100">
                      <h3 className="text-2xl font-bold text-white mb-1 transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
                        {faculty.name}
                      </h3>
                      <p className="text-base text-gray-200 mb-4 transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
                        {faculty.position || "Faculty Member"}
                      </p>
                      <Button
                        variant="outline"
                        className="w-fit transition-transform duration-500 translate-y-4 group-hover:translate-y-0 bg-white text-black hover:bg-gray-200"
                      >
                        View Profile
                      </Button>
                    </div>
                  </Card>
                </div>
              </CarouselItem>
            ))
          ) : (
            <CarouselItem className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500 text-lg">
                No faculty profiles found.
              </p>
            </CarouselItem>
          )}
        </CarouselContent>
        <CarouselPrevious className="left-4 top-1/2 -translate-y-1/2" />
        <CarouselNext className="right-4 top-1/2 -translate-y-1/2" />
      </Carousel>
    </div>
  );
};

export default FacultyCarousel;

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-cards";

import "./faculty.css"; // Make sure this CSS file exists and has the necessary styles

// import required modules
import { EffectCards } from "swiper/modules";
import Link from "next/link";

// You might need to add `npm install swiper` if you haven't already.

export function SmFacultyCarousel() {
 

  return (
    <div className="md:hidden w-full h-[25rem] py-4 px-2">
      {FacultyData && FacultyData.length > 0 ? (
        <Swiper
          effect={"cards"}
          grabCursor={true}
          modules={[EffectCards]}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          className="mySwiper w-full h-full"
        >
          {FacultyData.map((faculty, index) => (
            <SwiperSlide
              key={faculty.id || index}
              className="group relative rounded-xl overflow-hidden shadow-xl"
            >
              {/* Image as a responsive background */}
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src={faculty.profileImage || "/placeholder-profile.png"}
                  alt={faculty.name}
                  fill
                  sizes="100vw"
                  style={{ objectFit: "cover" }}
                  className="transition-transform duration-500 group-hover:scale-110 filter brightness-75"
                />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100">
                <h3 className="text-2xl font-bold text-white mb-1 transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
                  {faculty.name}
                </h3>
                <p className="text-base text-gray-200 mb-4 transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
                  {faculty.position || "Faculty Member"}
                </p>
                <Link href={`/profile/${faculty.id}`} className="w-fit">
                  <Button
                    variant="outline"
                    className="w-fit transition-transform duration-500 translate-y-4 group-hover:translate-y-0 bg-white text-black hover:bg-gray-200"
                  >
                    View Profile
                  </Button>
                </Link>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-500 text-lg">No faculty profiles found.</p>
        </div>
      )}
    </div>
  );
}
