import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { Achievement } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import React from "react";

const Sidebar = ({ achievements }: { achievements: Achievement[] }) => {
  return (
    <div className="flex flex-col items-center w-full gap-4">
      <p className="text-2xl font-medium">Achievements</p>

      {achievements.length > 0 ? (
        achievements.map((achievement) => {
          const cardContent = (
            <Card
              key={achievement.id}
              className="w-full max-h-32 flex items-center gap-3 px-3 py-2 rounded-xl border flex-row justify-center"
            >
              {/* FIXED: Use non-fill Image and fixed size */}
              <div className="h-full w-24 flex-shrink-0 relative rounded-md overflow-hidden">
                <Image
                  src={achievement.image || "/default-achievement.jpg"}
                  alt={achievement.title}
                  className="object-cover rounded-md"
                  width={96}
                  height={96}
                />
              </div>

              {/* Info */}
              <div className="flex flex-col justify-between w-full overflow-hidden h-full py-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-semibold line-clamp-1">
                    {achievement.title}
                  </h3>
                  <Badge variant="outline" className="text-xs capitalize">
                    {achievement.category}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {achievement.description}
                </p>

                <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-auto">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {format(new Date(achievement.achievementDate), "dd MMM yyyy")}
                  </div>
                 
                </div>
              </div>
            </Card>
          );

          return achievement.link ? (
            <Link
              href={achievement.link}
              target="_blank"
              rel="noopener noreferrer"
              key={achievement.id}
              className="w-full"
            >
              {cardContent}
            </Link>
          ) : (
            <div key={achievement.id} className="w-full">
              {cardContent}
            </div>
          );
        })
      ) : (
        <p className="text-gray-500">No achievements found.</p>
      )}

      <Button
        variant="outline"
        className="bg-blue-200/70 text-black font-medium w-full shadow-md py-5"
      >
        View All
      </Button>
    </div>
  );
};

export default Sidebar;
