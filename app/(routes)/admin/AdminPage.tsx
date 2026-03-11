"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { useRouter } from "next/navigation";

const AdminPage = () => {
  const router = useRouter();
  return (
    <div className="h-screen w-screen flex items-center justify-center flex-col gap-4">
      <p>This is the admin page</p>
      <UsButton onClick={() => { router.push("/admin/component-wall") }}>Go to component wall</UsButton>
    </div>
  );
};

export default AdminPage;