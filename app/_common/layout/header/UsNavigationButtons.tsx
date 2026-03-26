"use client";

import { useRouter } from "next/navigation";

const UsNavigationButtons = () => {
  const router = useRouter();

  return (
    <div className="flex items-center space-x-4 text-sm font-semibold">
      <button onClick={() => router.push("/dashboard")} className="hover:cursor-pointer hover:text-blue-500 hover:underline">
        Home
      </button>
      <button onClick={() => router.push("")} className="hover:cursor-pointer hover:text-blue-500 hover:underline ">
        Leaderboard
      </button>
      <button onClick={() => router.push("")} className="hover:cursor-pointer hover:text-blue-500 hover:underline">
        Past Tournaments
      </button>
      <button onClick={() => router.push("/admin")} className="hover:cursor-pointer hover:text-blue-500 hover:underline">
        Admin (temporary)
      </button>
    </div>
  );
};

export default UsNavigationButtons;