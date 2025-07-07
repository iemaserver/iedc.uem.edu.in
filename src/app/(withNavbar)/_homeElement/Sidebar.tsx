import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

const Sidebar = () => {
  return (
    <div className="flex flex-col items-center justify-around h-full w-full">
      <p className="text-2xl font-medium">Achievement</p>
      <Card className="w-full h-16 bg-gray-200 my-2">
        <CardContent className="">a</CardContent>
      </Card>
      <Card className="w-full h-16 bg-gray-200 my-2">
        <CardContent className="">a</CardContent>
      </Card>
      <Card className="w-full h-16 bg-gray-200 my-2">
        <CardContent className="">a</CardContent>
      </Card>
      <Card className="w-full h-16 bg-gray-200 my-2">
        <CardContent className="">a</CardContent>
      </Card>
      <Card className="w-full h-16 bg-gray-200 my-2">
        <CardContent className="">a</CardContent>
      </Card>
      <Button variant={"outline"} className="bg-blue-200/70 text-black font-medium w-full shadow-md shadow-black py-5">View All</Button>
    </div>
  );
};

export default Sidebar;
