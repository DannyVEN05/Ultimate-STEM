"use client";

import { presetStyles } from "@/app/_utilities/PresetStyles";
import { UsSizeOptions, UsTextSizes } from "@/app/_utilities/GlobalTypes";

interface UsBasicSelectBoxProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  textSize?: UsTextSizes;
  sizeOptions?: UsSizeOptions;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const UsBasicSelectBox: React.FC<UsBasicSelectBoxProps> = ({
  className = "",
  textSize = "text-sm",
  sizeOptions = {},
  onChange,
  ...props
}) => {

  /************************************************************
  * Styling
  ************************************************************/
  const sizeStyling = {
    height: sizeOptions.height ? `${sizeOptions.height}px` : "",
    width: sizeOptions.width ? `${sizeOptions.width}px` : "",
    padding: `${sizeOptions.paddingY ? sizeOptions.paddingY : 8}px ${sizeOptions.paddingX ? sizeOptions.paddingX : 12}px`,
  }

  /************************************************************
  * Render
  ************************************************************/
  return (
    <select
      {...props}
      className={`block rounded-xl ${textSize} font-medium focus:outline-none transition-all duration-200 ${presetStyles.UsInput} ${className}`}
      style={{ ...sizeStyling }}
      onChange={onChange}
    />
  );
};

export default UsBasicSelectBox;