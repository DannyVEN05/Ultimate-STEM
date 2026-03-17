"use client";

import React from "react";

type Props = {
  mt?: number;
  mb?: number;
  widthPercentage?: number;
};

const UsDivider: React.FC<Props> = ({ mt = 3, mb = 3, widthPercentage = 80 }) => {
  return (
    <div className="flex justify-center">
      <div
        className={`h-px bg-gray-300`}
        style={{ width: `${widthPercentage}%`, marginTop: `${mt * 0.25}rem`, marginBottom: `${mb * 0.25}rem` }} />
    </div>
  );
};

export default UsDivider;