"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { useRouter } from "next/navigation";

const AdminContent = () => {
  const router = useRouter();
  return (
    <div className="h-full w-full flex items-center justify-center flex-col gap-4">
      <p>This is the admin page</p>
      <UsButton onClick={() => { router.push("/admin/component-wall") }}>Go to component wall</UsButton>
    </div>
  );
};

export default AdminContent;