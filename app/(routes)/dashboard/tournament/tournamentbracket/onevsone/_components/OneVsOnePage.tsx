"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { useRouter } from "next/navigation";

const OneVsOnePage = () => {
  const router = useRouter();
  return (
    <div className="text-4xl">
      <UsButton variant="red" onClick={() => {router.push("./")}}>
        Back
      </UsButton>
      This is the one vs one page.
    </div>
  );
};

export default OneVsOnePage;