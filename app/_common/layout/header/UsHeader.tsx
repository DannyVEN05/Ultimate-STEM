"use client";

import UsAuthMenu from "./UsAuthMenu";
import UsNavigationButtons from "./UsNavigationButtons";

const UsHeader = () => {

  return (
    <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center gap-8">
      <a href="/dashboard" className="text-lg font-bold text-primary whitespace-nowrap">STEM Lab Tournament</a>
      <div className="flex-1"><UsNavigationButtons /></div>
      <UsAuthMenu />
    </div>
  );
};

export default UsHeader;