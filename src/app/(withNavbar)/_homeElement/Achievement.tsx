import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Link2 } from "lucide-react";
import { Achievement } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import React from "react";

const AchievementPage = ({ achievements }: { achievements: Achievement[] }) => {
  return (
    <div className="flex flex-col items-center w-full gap-6 px-4">
      <p className="text-2xl font-medium">Achievements</p>

      <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {achievements.length > 0 ? (
          achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className="rounded-xl overflow-hidden bg-[#74787d] text-white shadow-md"
            >
              <CardHeader className="flex items-center justify-between p-3">
                {/* Image Container */}
                <div className="relative w-full h-40 ">
                  <Image
                    src={achievement.image || "/default-achievement.jpg"}
                    alt={achievement.title}
                    fill
                    className="object-cover rounded-md "
                  />
                  <Badge
                    variant="secondary"
                    className="absolute -bottom-3 left-2 text-lg bg-blue-500 text-white px-3 "
                  >
                    {achievement.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Content */}
                <div className="pt-8 px-3 pb-4 space-y-2">
                  {/* Title & Price Style */}
                  <h3 className="text-base font-bold">{achievement.title}</h3>

                  {/* Description + Link */}
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <p className="line-clamp-2">
                      {achievement.description.length > 100
                        ? `${achievement.description.slice(0, 100)}...`
                        : achievement.description}
                    </p>
                    {achievement.link && (
                      <a
                        href={achievement.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Link2 className="w-4 h-4 text-blue-400 hover:text-blue-600 transition-colors" />
                      </a>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-lg text-gray-400 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {format(
                      new Date(achievement.achievementDate),
                      "dd MMM yyyy"
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 col-span-full">No achievements found.</p>
        )}
      </div>

      <Button
        variant="outline"
        className="bg-blue-600/70 text-black font-medium w-fit shadow-md py-5"
      >
        View All
      </Button>
    </div>
  );
};

export default AchievementPage;
