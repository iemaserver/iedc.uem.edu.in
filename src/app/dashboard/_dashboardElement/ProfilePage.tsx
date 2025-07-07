
import Image from "next/image";
import React, { useState } from "react";
import { User } from "@prisma/client";
import DefaultAvatar from "@/components/ui/default-avatar";


const ProfilePage = ({userData}:{userData?: User | null}) => {
  const [imageError, setImageError] = useState(false);

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-fit bg-gray-100 w-full">
        <p>Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center font-inter dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-blue-500">
            {userData.profileImage && !imageError ? (
              <Image
                src={userData.profileImage}
                alt="Profile Picture"
                width={128}
                height={128}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <DefaultAvatar 
                name={userData.name || "User"} 
                size={128} 
                className="w-full h-full rounded-full"
              />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-1">{userData?.name || "Guest User"}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{userData?.email || "N/A"}</p>
          {userData && (
            <div className="mt-4 text-left w-full">
             
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Joined At:</span> {new Date(userData.createdAt).toLocaleDateString()}
              </p>
              {
                userData.areaOfInterest && userData.areaOfInterest.length > 0 && (
                    userData.areaOfInterest.map((interest, index) => (
                      <p key={index} className="text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Area of Interest {index + 1}:</span> {interest}
                        </p>
                    ))
                )
              }
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Academic Details</h2>
          {
            userData &&(
              <>
                <p className="font-medium">Degree : {userData.degree||"not-provided"}</p>
                <p className="font-medium">Year : {userData.year||"not-provided"}</p>
                <p className="font-medium">Department : {userData.department||"not-provided"}</p>
                <p className="font-medium">University : {userData.university||"not-provided"}</p>
              </>
            ) 
          }
         
          {/* You can add a button here to edit/add academic details */}
          <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out">
            Add/Edit Academic Info
          </button>
        </div>

        {/* Third Div: Graph Placeholder */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
          <h2 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">Activity Graph</h2>
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400 text-center">
            <p>Placeholder for your graph component (e.g., Recharts, D3)</p>
          </div>
          {/* You might add a refresh button or filter options for the graph here */}
        </div>
      </div>

      {/* Lower Section: Full Width Table Placeholder */}
      <div className="w-full  bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-4">
        <h2 className="text-xl font-semibold mb-4 text-teal-600 dark:text-teal-400">Recent Activities / Data Table</h2>
        <div className="w-full min-h-64 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400 text-center p-4">
          <p>Placeholder for your data table component (e.g., recent courses, achievements, or other user-specific data)</p>
        </div>
        {/* You can add pagination, search, or filter controls for the table here */}
        <button className="mt-4 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out">
          View All Data
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
