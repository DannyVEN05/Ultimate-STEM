"use client";

import { useRouter } from "next/navigation";

const SwipeModePage = () => {
  const router = useRouter();
  return (
    <div className="flex w-full flex-col items-center mt-5 font-bold">
      <h1 className="mb-5 text-4xl">{'{tournament name}'}</h1>
    </div>
  );
};

export default SwipeModePage;