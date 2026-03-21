"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { useRouter } from "next/navigation";

const DashboardPage = () => {
  const router = useRouter();
  return (
    <div className="flex w-full flex-col items-center py-10 font-bold text-3xl text-center">     
      <h1 className="mb-8 text-4xl">{'{Active Tournaments}'}</h1>
      <div className="flex flex-col border-2 border-black p-12">
        <h2 className="mb-6">{'{tournament name}'}</h2>
        <UsButton variant="blue" onClick={() => { router.push("/dashboard/tournament") }}>
          Go to tournament
        </UsButton>
      </div>
    </div>
  );
};

export default DashboardPage;