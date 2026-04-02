"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GridViewPage from "./GridViewPage";
import SwipeViewPage from "./SwipeViewPage";

const SubmissionsPage = () => {
  // const { setIsGridMode, isGridMode } = useContext(BookContext);
  const [isGridMode, setIsGridMode] = useState<boolean>(true)
  const router = useRouter();
  return (
    <div className="flex w-full flex-col items-center font-bold">
      <h1 className="mb-5 text-4xl">{'{tournament name}'}</h1>
      <div className="flex w-full justify-center">
        <UsButton variant="blue" onClick={() => {router.push("/dashboard/tournament/submissions/bookbuilder")}}>
          Submit a Book
        </UsButton>
        <UsButton className="ml-auto" variant="blue" onClick={() => {setIsGridMode(!isGridMode)}}>
          {isGridMode ? "Swipe Mode" : "Grid Mode"}
        </UsButton>
      </div>
      {isGridMode ? (
        <GridViewPage/>
      ): (
        <SwipeViewPage/>
      )}
    </div>
  )
};

export default SubmissionsPage;