"use client";

import UsNavigationButtons from "./UsNavigationButtons";

const UsHeader = () => {

  return (
    <div className="h-20 bg-gray-200 p-4 flex items-center">
      <div className="flex-1"><UsNavigationButtons /></div>
      <h1 className="text-2xl font-bold flex-1 text-center">Ultimate STEM</h1>
      <div className="flex-1 text-6xl text-right">O</div> {/* Placeholder for future user profile or settings */}
    </div>
  );
};

export default UsHeader;