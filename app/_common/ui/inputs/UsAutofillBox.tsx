"use client";

import { presetStyles } from "@/app/_utilities/PresetStyles";
import { useEffect, useMemo, useRef, useState } from "react";
import DownCaret from "../icons/DownCaret";
import { UsSelectOption, UsSizeOptions, UsTextSizes } from "@/app/_utilities/GlobalTypes";

interface UsAutofillBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  textSize?: UsTextSizes;
  sizeOptions?: UsSizeOptions;
  options?: UsSelectOption[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxDropdownHeight?: number;
  readOnly?: boolean;
  hideCaret?: boolean;
}

const UsAutofillBox: React.FC<UsAutofillBoxProps> = ({
  className = "",
  textSize = "text-sm",
  sizeOptions = {},
  options = [],
  onChange,
  maxDropdownHeight,
  readOnly = false,
  hideCaret = false,
  ...props
}) => {

  /************************************************************
  * States
  ************************************************************/
  const [inputValue, setInputValue] = useState(() => {
    const initialOption = options.find(opt => opt.value === (props.value ?? "") || opt.label === (props.value ?? ""));
    return initialOption ? (initialOption.label || initialOption.value) : "";
  });
  const [selectedValue, setSelectedValue] = useState<UsSelectOption | undefined>(undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  /************************************************************
  * Memoized Values
  ************************************************************/
  const filteredOptions = useMemo(() => {
    if (readOnly) return options;
    const v = inputValue.trim().toLowerCase();
    if (v === "") return options;
    return options.filter(opt => (opt.label || opt.value).toLowerCase().includes(v));
  }, [inputValue, options]);

  /************************************************************
  * Refs
  ************************************************************/
  const caretRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownOpenRef = useRef(dropdownOpen);

  /************************************************************
  * Handlers
  ************************************************************/
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    if (selectedValue && v !== selectedValue.label) {
      setSelectedValue(undefined);
    }
    const matchedOption = filteredOptions.find(opt => opt.label === v || opt.value === v);
    if (matchedOption) {
      setSelectedValue(matchedOption);
      onChange?.({
        target: {
          name: props.name,
          value: matchedOption.value
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }
    setDropdownOpen(true);
  };

  const handleOptionClick = (option: UsSelectOption) => {
    setInputValue(option.label || option.value);
    setSelectedValue(option);
    onChange?.({
      target: {
        name: props.name,
        value: option.value
      }
    } as React.ChangeEvent<HTMLInputElement>);
    setDropdownOpen(false);
  };

  const handleClear = () => {
    setInputValue("");
    setSelectedValue(undefined);
    onChange?.({
      target: {
        name: props.name,
        value: ""
      }
    } as React.ChangeEvent<HTMLInputElement>);
  }

  /************************************************************
  * Effects
  ************************************************************/
  useEffect(() => { dropdownOpenRef.current = dropdownOpen; }, [dropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownOpenRef.current) return;
      const target = event.target as Node;
      const clickedInsideCaret = caretRef.current?.contains(target);
      const clickedInsideInput = inputRef.current?.contains(target);
      const clickedInsideDropdown = dropdownRef.current?.contains(target);

      if (clickedInsideCaret || clickedInsideInput || clickedInsideDropdown) return;

      const currentValue = (inputRef.current?.value ?? "").trim();
      if (currentValue === "") {
        setInputValue("");
        setSelectedValue(undefined);
        onChange?.({
          target: {
            name: props.name,
            value: ""
          }
        } as React.ChangeEvent<HTMLInputElement>);
        setDropdownOpen(false);
        return;
      }

      const matchedOption = filteredOptions.find(opt => opt.label === currentValue || opt.value === currentValue);
      if (matchedOption) {
        setInputValue(matchedOption.label || matchedOption.value);
        setSelectedValue(matchedOption);
        onChange?.({
          target: {
            name: props.name,
            value: matchedOption.value
          }
        } as React.ChangeEvent<HTMLInputElement>);
      } else {
        setInputValue("");
        setSelectedValue(undefined);
        onChange?.({
          target: {
            name: props.name,
            value: ""
          }
        } as React.ChangeEvent<HTMLInputElement>);
      }

      setDropdownOpen(false);
    };

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  /************************************************************
  * Styling
  ************************************************************/
  const sizeStyling = {
    height: sizeOptions.height ? `${sizeOptions.height}px` : "",
    width: sizeOptions.width ? `${sizeOptions.width}px` : "",
    paddingTop: sizeOptions.paddingY ? `${sizeOptions.paddingY}px` : "8px",
    paddingBottom: sizeOptions.paddingY ? `${sizeOptions.paddingY}px` : "8px",
    paddingLeft: sizeOptions.paddingX ? `${sizeOptions.paddingX}px` : "22px",
    paddingRight: sizeOptions.paddingX ? `${sizeOptions.paddingX}px` : "24px",
    minHeight: sizeOptions.height ? undefined : "32px",
  }

  /************************************************************
  * Render
  ************************************************************/
  return (
    <div className={`relative inline-block ${className}`}>

      {/* Dropdown Arrow */}
      {!hideCaret && (
        <div
          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggleDropdown();
          }}
          ref={caretRef}
        >
          <DownCaret />
        </div>
      )}

      {/* Input Field */}
      <input
        {...props}
        className={`block rounded-sm ${textSize} font-medium cursor-pointer focus:outline-none transition-all duration-200 truncate ${presetStyles.UsInput} ${className}`}
        style={{ ...sizeStyling }}
        value={inputValue}
        onClick={toggleDropdown}
        onChange={handleInputChange}
        ref={inputRef}
        readOnly={readOnly}
      />

      {/* Dropdown */}
      {dropdownOpen && (
        <div
          className={`absolute left-0 mt-1 w-full overflow-y-auto ${textSize} bg-white border border-gray-300 rounded-md shadow-lg z-10`}
          style={{ maxHeight: maxDropdownHeight ? `${maxDropdownHeight}px` : "200px" }}
          ref={dropdownRef}
        >
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              className="px-4 py-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleOptionClick(option)}
            >
              {option.label || option.value}
            </div>
          ))}
        </div>
      )}

      {/* Clear Button */}
      {inputValue && (
        <div
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-600 cursor-pointer"
          onClick={handleClear}
        >
          &#10005;
        </div>
      )}

    </div>
  );
};

export default UsAutofillBox;