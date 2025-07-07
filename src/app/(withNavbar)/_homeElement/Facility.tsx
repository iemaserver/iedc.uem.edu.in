import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import React from 'react'
import {homePageElements} from './homeFirstElement'
const RecentProjects = () => {
  return (
    <div className='w-full h-fit '>
      <Carousel
            opts={{
              align: "start",
            }}  
             
                  plugins={[
              Autoplay({
                delay: 3000,
              }),
            ]}
      
            // Added h-full and w-full to make the carousel fill its parent container
            className="w-full h-[20rem] "
          >
            <CarouselContent>
              {homePageElements.map((value, index) => (
                // Adjusted height to h-full for all screen sizes
                <CarouselItem key={index} className="">
                  <div className="p-1 w-full h-full">
                    {/* Ensure Card and CardContent also fill the available space */}
                    <Card className="w-full h-full"  style={{backgroundImage: `url(${value.labImage})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
                      <CardContent className="flex  aspect-square md:aspect-auto min-h-full items-center justify-center p-6">
                        <span className="text-3xl font-semibold">{index + 1}</span>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
          </Carousel>
    </div>
  )
}

export default RecentProjects
