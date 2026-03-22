"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { Button } from "@/components/ui/button";
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
      
      <p className="mx-auto mt-3 max-w-4xl text-base font-bold text-gray-700 sm:text-2xl text-center">Vote for the best book in this round!</p>

    <div className="grid grid-cols-1 md: grid-cols-[1fr_auto_1fr] gap-8 mt-8 items-center text-center justify-items-center">
      
      {/* book 1 item */}
      <div className="border rounded-lg p-6 mt-8 bg-gray-100 shadow-md h-[600px] w-[500px] flex flex-col">
        <h2 className="text-4xl font-semibold">Book title</h2>
  
        
        <p className="text-xl text-gray-600 mt-6">Book description will go here.</p> 
        
        <div className="mt-auto flex justify-center">
        <Button className="bg-green-300 hover:bg-green-400 text-gray-700 px-10 py-7 text-lg " style={{ cursor: "pointer" }} onClick={() => {router.push("/")}}>
        Vote
      </Button>
      </div>
      </div>


      <div className="flex items-center justify-center">
            <div className="rounded-full bg-slate-900 px-7 py-3 text-lg font-bold uppercase tracking-[0.2em] text-white shadow-lg">
              VS
            </div>
        </div>

      {/* book 2 item */}
      <div className="border rounded-lg p-6 mt-8 bg-gray-100 shadow-md h-[600px] w-[500px] flex flex-col">
        <h2 className="text-4xl font-semibold">Book title</h2>
        <p className="text-xl text-gray-600 mt-6">Book description will go here.</p> 

        <div className="mt-auto flex justify-center">
        <Button className="bg-green-300 hover:bg-green-400 text-gray-700 px-10 py-7 text-lg " style={{ cursor: "pointer" }} onClick={() => {router.push("/")}}>
        Vote
      </Button>
      </div>    
     </div>
    
   
    </div>
  </div>
  );
};

export default OneVsOnePage;