"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { useRouter } from "next/navigation";
import SwipeMode from "../swipemode/page";

const SubmissionsPage = () => {
  const router = useRouter();
  return (
    <div className="flex w-full flex-col items-center font-bold">
      <h1 className="mb-5 text-4xl">{'{tournament name}'}</h1>
      <div className="flex w-full justify-center">
        <UsButton variant="blue" onClick={() => {router.push("/dashboard/tournament/submissions/bookbuilder")}}>
          Submit a Book
        </UsButton>
        <UsButton className="ml-auto" variant="blue" onClick={() => {""}}>
          Swipe Mode
        </UsButton>
      </div>
    </div>
  );
};

export default SubmissionsPage;