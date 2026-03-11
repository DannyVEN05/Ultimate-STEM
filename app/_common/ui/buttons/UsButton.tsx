"use client";

import { presetStyles } from "@/app/_utilities/PresetStyles";
import { UsButtonColours, UsSizeOptions, UsTextSizes } from "@/app/_utilities/GlobalTypes";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface UsButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: ReactNode;
  className?: string;
  variant?: UsButtonColours;
  textSize?: UsTextSizes;
  sizeOptions?: UsSizeOptions;
};

const UsButton: React.FC<UsButtonProps> = ({
  children,
  className = "",
  variant = "white",
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
    padding: `${sizeOptions.paddingY ? sizeOptions.paddingY : 6}px ${sizeOptions.paddingX ? sizeOptions.paddingX : 10}px`,
  }

  /************************************************************
  * Render
  ************************************************************/
  return (
    <button
      {...props}
      className={`${textSize} font-medium rounded-xl border transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${presetStyles.UsButton[variant]} ${className}`}
      style={{ ...sizeStyling }}
    >
      {children}
    </button>
  );
};

export default UsButton;