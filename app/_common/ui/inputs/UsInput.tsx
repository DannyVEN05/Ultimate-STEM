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
    padding: `${sizeOptions.paddingY ? sizeOptions.paddingY : 8}px ${sizeOptions.paddingX ? sizeOptions.paddingX : 12}px`,
  }

  /************************************************************
  * Render
  ************************************************************/
  return (
    <input
      {...props}
      className={`block rounded-xl ${textSize} font-medium focus:outline-none transition-all duration-200 ${presetStyles.UsInput} ${className}`}
      style={{ ...sizeStyling }}
    />
  );
};

export default UsInput;