"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { useRouter } from "next/navigation";

const OneVsOnePage = () => {
  const router = useRouter();

 

  return (
    <div className="text-4xl">
      <h1 className="mb-8 text-4xl font-bold text-center">{'{tournamentName}'}</h1>
      <div className="my-4 h-1 w-full bg-black" />
      <UsButton variant="red" onClick={() => {router.push("./")}}>
        Back
      </UsButton>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-8 justify-items-center">
      {/* book 1 item */}
      <div className="border rounded-lg p-4 mt-8 bg-gray-100 shadow-md h-[600px] w-[500px]">
        <h2 className="text-4xl font-semibold">Book title</h2>
        <p className="text-xl text-gray-600 mt-2">Book description will go here.</p> 
      
        <UsButton sizeOptions={{height: 50, width: 100}} variant="green" textSize="text-lg" onClick={() => {router.push("/")}}>
        Vote
      </UsButton>
      
      </div>
      {/* book 2 item */}
      <div className="border rounded-lg p-4 mt-8 bg-gray-100 shadow-md h-[600px] w-[500px]">
        <h2 className="text-4xl font-semibold">Book title</h2>
        <p className="text-xl text-gray-600 mt-2">Book description will go here.</p> 

        <div className="flex items-center justify-center flex-1">
        <UsButton sizeOptions={{height: 50, width: 100}} variant="green" textSize="text-lg" onClick={() => {router.push("/")}}>
        Vote
      </UsButton>
      </div>    
     </div>
    
    </div>
  </div>
  );
};

export default OneVsOnePage;