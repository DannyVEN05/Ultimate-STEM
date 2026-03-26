"use client";

import UsAuthMenu from "./UsAuthMenu";
import UsNavigationButtons from "./UsNavigationButtons";

const UsHeader = () => {

  return (
    <div className="h-20 bg-gray-200 p-4 flex items-center">
      <div className="flex-1"><UsNavigationButtons /></div>
      <h1 className="text-2xl font-bold flex-1 text-center">Ultimate STEM</h1>
      <div className="flex-1 text-right"><UsAuthMenu /></div>
    </div>
  );
};

export default UsHeader;