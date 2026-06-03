"use client";

import { UsSizeOptions } from "@/app/_utilities/GlobalTypes";
import UsDivider from "./UsDivider";

type Props = {
  children: React.ReactNode;
  title?: string;
  sizeOptions?: UsSizeOptions;
};

const UsWidget: React.FC<Props> = ({
  children,
  title,
  sizeOptions = {},
}) => {
  return (
    <div
      className="border border-gray-300 rounded-xl"
      style={{
        height: sizeOptions.height ? `${sizeOptions.height}px` : "",
        width: sizeOptions.width ? `${sizeOptions.width}px` : "",
        padding: `${sizeOptions.paddingY ? sizeOptions.paddingY : 0}px ${sizeOptions.paddingX ? sizeOptions.paddingX : 0}px`,
      }}
    >
      <h1 className="text-xl font-bold text-center mt-3">{title}</h1>
      <UsDivider widthPercentage={80} />
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default UsWidget;