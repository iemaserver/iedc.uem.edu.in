"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import Autoplay from "embla-carousel-autoplay";
export  const homePageElements = [
    {
      deviceName: "NVIDIA RTX 5070",
      deviceDescribetion: "High-performance GPU for advanced computations and AI model training.",
      bgImage: "/home/gpu.png",
      labImage: "/home/gpulab.jpg",
    },
    {
      deviceName: "RMS Superspec 32-channel EEG Machine",
      deviceDescribetion: "Advanced electroencephalography system for brain activity monitoring.",
      bgImage: "/home/eeg.jpg",
      labImage: "/home/eeglab.jpg",
    },
    {
      deviceName: "NAS Server",
      deviceDescribetion: "Network Attached Storage for secure and scalable data storage and sharing.",
      bgImage: "/home/nas.png",
      labImage: "/home/naslab.jpg",
    },
    {
      deviceName: "NVIDIA Jetson Nano & Orin",
      deviceDescribetion: "Compact, powerful AI computers for embedded applications and robotics.",
      bgImage: "/home/jetson.png",
      labImage: "/home/jetsonlab.jpg",
    },
    {
      deviceName: "3D Printer",
      deviceDescribetion: "Rapid prototyping machine for creating physical models from digital designs.",
      bgImage: "/home/3dprinter.jpg",
      labImage: "/home/3dprinterlAB.jpg",
    },
    {
      deviceName: "Soldering Unit",
      deviceDescribetion: "Essential tool for electronic circuit assembly and repair.",
      bgImage: "/home/solderingunit.jpg",
      labImage: "/home/solderingunitlab.jpg",
    },
    {
      deviceName: "Raspberry Pi 5",
      deviceDescribetion: "Latest generation single-board computer for various DIY projects and embedded systems.",
      bgImage: "/home/respberry.jpg",
      labImage: "/home/respberryla.jpg",
    },
    {
      deviceName: "Arduino Uno",
      deviceDescribetion: "Versatile microcontroller board for rapid prototyping of electronic projects.",
      bgImage: "/home/arduino.jpg",
      labImage: "/home/arduinolab.jpg",
    },
   
  ];
const HomeFirstElement = () => {
 
  return (
    // The main container for the carousel, maintaining the 2:1 aspect ratio
    <div className="aspect-[2/1] w-full">
      {/* Carousel component with autoplay plugin enabled */}
      <Carousel
        opts={{
          align: "start",
          loop: true, // Enable looping for a continuous effect
        }}
         plugins={[
           Autoplay({
             delay: 3000, // Autoplay every 3 seconds
             stopOnInteraction: false, // Continue autoplay even on user interaction
           }),
         ]}
        // Ensure the carousel fills its parent container
        className="w-full h-full"
      >
        <CarouselContent className="w-full h-full">
          {homePageElements.map((value, index) => (
            // Each carousel item takes full width and height
            <CarouselItem key={index} className="w-full h-full">
              {/* Padding around the card */}
              <div className="p-1 w-full h-full">
                {/* Card component acts as the slide container, relative for absolute positioning of content */}
                <Card className="relative w-full h-full rounded-lg overflow-hidden">
                  {/* Background image div, covering the entire card */}
                  <div
                    className="absolute inset-0 bg-cover bg-center filter brightness-75 flex justify-center items-center" // Added brightness filter for better text contrast
                    style={{ backgroundImage: `url(${value.bgImage})` }}
                  >
                    {value.deviceName && (
                        <p className="text-[4vw] bg-white/10 backdrop-blur-sm p-2 rounded-md md:hidden font-bold text-white"
                        >{value.deviceName}</p>
                      )}
                  </div>

                  {/* Card content for device name and lab image/description */}
                  <CardContent className="relative flex flex-col justify-between w-full h-full p-6 text-white">
                    

                    {/* Lab Image and Description - Positioned at the bottom right */}
                    <div className={`absolute -bottom-3 shadow-md  left-2 hidden  p-2 ${index!==1?"bg-white/20":"bg-black/30"} backdrop-blur-sm max-w-full md:w-[24rem] rounded-md  md:flex`}>
                      {value.labImage && (
                        <img
                          src={value.labImage}
                          alt={`${value.deviceName} lab`}
                          className="w-30 h-30 object-cover rounded-md mb-2 sm:mb-0 sm:mr-4   shadow-md shadow-black/70"
                          // Fallback for image loading errors
                          onError={(e) => { 
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = "/home/respberryla.jpg";
                          }}
                        />
                      )}
                      
                      {/* Container for the description text */}
                      <div className={`${index !==1?"text-white":"text-black"} flex flex-col justify-around `}>
                        <h4 className="text-lg font-bold mb-1">
                          {value.deviceName} 
                        </h4>
                        {value.deviceDescribetion && (
                          <p className="text-sm font-light">{value.deviceDescribetion}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default HomeFirstElement;
