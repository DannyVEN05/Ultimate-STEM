"use client";

import { presetStyles } from "@/app/_utilities/PresetStyles";
import { UsSizeOptions, UsTextSizes } from "@/app/_utilities/GlobalTypes";

interface UsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  textSize?: UsTextSizes;
  sizeOptions?: UsSizeOptions;
}

const UsInput: React.FC<UsInputProps> = ({
  className = "",
  textSize = "text-sm",
  sizeOptions = {},
  ...props
}) => {

  /************************************************************
  * Styling
  ************************************************************/
  const sizeStyling = {
    height: sizeOptions.height ? `${sizeOptions.height}px` : "",
    width: sizeOptions.width ? `${sizeOptions.width}px` : "",
    padding: `${sizeOptions.paddingY ? sizeOptions.paddingY : 4}px ${sizeOptions.paddingX ? sizeOptions.paddingX : 12}px`,
    minHeight: sizeOptions.height ? undefined : "32px",
  }

  /************************************************************
  * Render
  ************************************************************/
  return (
    <input
      {...props}
      className={`block rounded-sm ${textSize} font-medium focus:outline-none transition-all duration-200 ${presetStyles.UsInput} ${className}`}
      style={{ ...sizeStyling }}
    />
  );
};

export default UsInput;