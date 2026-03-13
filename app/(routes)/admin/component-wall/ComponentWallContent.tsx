"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import UsInput from "@/app/_common/ui/inputs/UsInput";
import { useRouter } from "next/navigation";
import UsBasicSelectBox from "@/app/_common/ui/inputs/UsBasicSelectBox";
import { useState } from "react";
import UsAutofillBox from "@/app/_common/ui/inputs/UsAutofillBox";
import { oneToOneHundredSelectOptions } from "@/app/_utilities/GlobalVariables";

type formType = {
  firstName: string;
  lastName: string;
  gender: string;
  usage: string;
  age: string;
};

const ComponentWallContent = () => {
  const router = useRouter();

  const [formData, setFormData] = useState<formType>({
    firstName: "",
    lastName: "",
    gender: "",
    usage: "submitting",
    age: "",
  });

  const {
    firstName,
    lastName,
    gender,
    usage,
    age } = formData;

  const [userData, setUserData] = useState<formType | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitClick = () => {
    setUserData(formData);
  };

  return (
    <>

      {/* Component Showcase Grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* Back to Admin Page Button */}
        <div className="col-span-3 flex items-center justify-center gap-1 mt-2">
          <p>Back to Admin Page:</p>
          <UsButton onClick={() => router.push("/admin")}>{`< Back`}</UsButton>
        </div>

        {/* White UsButton */}
        <div className="col-span-3 flex items-center justify-center gap-1 mt-2">
          <p>White UsButton:</p>
          <UsButton variant="white">White Button</UsButton>
        </div>

        {/* Blue UsButton */}
        <div className="col-span-3 flex items-center justify-center gap-1 mt-2">
          <p>Blue UsButton:</p>
          <UsButton variant="blue">Blue Button</UsButton>
        </div>

        {/* Green UsButton */}
        <div className="col-span-3 flex items-center justify-center gap-1 mt-2">
          <p>Green UsButton:</p>
          <UsButton variant="green">Green Button</UsButton>
        </div>

        {/* Yellow UsButton */}
        <div className="col-span-3 flex items-center justify-center gap-1 mt-2">
          <p>Yellow UsButton:</p>
          <UsButton variant="yellow">Yellow Button</UsButton>
        </div>

        {/* Red UsButton */}
        <div className="col-span-3 flex items-center justify-center gap-1 mt-2">
          <p>Red UsButton:</p>
          <UsButton variant="red">Red Button</UsButton>
        </div>

        {/* UsInput with placeholder */}
        <div className="col-span-3 flex items-center justify-center gap-1 mt-2">
          <p>UsInput (with placeholder):</p>
          <UsInput placeholder="Enter text..." />
        </div>

        {/* UsInput without placeholder */}
        <div className="col-span-3 flex items-center justify-center gap-1 mt-2">
          <p>UsInput (without placeholder):</p>
          <UsInput />
        </div>

        {/* UsBasicSelectBox */}
        <div className="col-span-3 flex items-center justify-center gap-1 mt-2">
          <p>UsBasicSelectBox:</p>
          <UsBasicSelectBox>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </UsBasicSelectBox>
        </div>

        {/* UsAutofillBox (read-only) */}
        <div className="col-span-3 flex items-center justify-center gap-1 mt-2">
          <p>UsAutofillBox (read-only):</p>
          <UsAutofillBox readOnly options={[
            { value: "option1", label: "Option 1" },
            { value: "option2", label: "Option 2" },
            { value: "option3", label: "Option 3" }
          ]} />
        </div>

        {/* UsAutofillBox (interactive) */}
        <div className="col-span-3 flex items-center justify-center gap-1 mt-2">
          <p>UsAutofillBox:</p>
          <UsAutofillBox options={[
            { value: "option1", label: "Option 1" },
            { value: "option2", label: "Option 2" },
            { value: "option3", label: "Option 3" }
          ]} />
        </div>
      </div>

      {/* Component Functionality Testing Form */}
      <div className="flex items-center justify-center gap-1 mt-4">

        {/* Form Grid */}
        <div className="grid grid-cols-12 w-[50%] h-full flex items-center border justify-center gap-1 mt-10 p-4">

          {/* Form Title */}
          <label className="col-span-12 flex items-center justify-center text-xl underline gap-1">Component Functionality Testing Form</label>

          {/* First Name Input */}
          <div className="col-span-6 mt-2 ml-2">
            <label className="block text-sm font-medium text-gray-700">First Name:</label>
            <UsInput
              className="w-full"
              placeholder="Enter first name..."
              name="firstName"
              value={firstName}
              onChange={handleInputChange}
            />
          </div>

          {/* Last Name Input */}
          <div className="col-span-6 mt-2 ml-2">
            <label className="block text-sm font-medium text-gray-700">Last Name:</label>
            <UsInput
              className="w-full"
              name="lastName"
              value={lastName}
              onChange={handleInputChange}
            />
          </div>

          {/* Gender Select */}
          <div className="col-span-6 mt-2 ml-2">
            <label className="block text-sm font-medium text-gray-700">Gender:</label>
            <UsAutofillBox
              className="w-full"
              name="gender"
              value={gender}
              onChange={handleInputChange}
              readOnly
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" }
              ]} />
          </div>

          {/* Usage Select */}
          <div className="col-span-6 mt-2 ml-2">
            <label className="block text-sm font-medium text-gray-700">What will you be mainly using the platform for?</label>
            <UsBasicSelectBox className="w-full" onChange={handleSelectChange} name="usage" value={usage}>
              <option value="submitting">Submitting</option>
              <option value="voting">Voting</option>
            </UsBasicSelectBox>
          </div>

          {/* Age Select */}
          <div className="col-span-6 mt-2 ml-2">
            <label className="block text-sm font-medium text-gray-700">What is your age?</label>
            <UsAutofillBox
              className="w-full"
              name="age"
              value={age}
              onChange={handleInputChange}
              options={oneToOneHundredSelectOptions} />
          </div>

          {/* Submit Button */}
          <div className="col-span-12 mt-2 ml-2">
            <UsButton
              variant="blue"
              className="w-full"
              onClick={handleSubmitClick}
            >
              Submit
            </UsButton>
          </div>

        </div>
      </div>

      {/* Display Submitted Data */}
      <div className="flex flex-col items-center text-lg font-medium text-gray-700 ">
        <div>
          <label className="block text-xl font-semibold mt-10">User Data:</label>
          <label className="block">First Name: {userData?.firstName}</label>
          <label className="block">Last Name: {userData?.lastName}</label>
          <label className="block">Gender: {userData?.gender}</label>
          <label className="block">Usage: {userData?.usage}</label>
          <label className="block">Age: {userData?.age}</label>
          <UsButton variant="red" className="mt-4" onClick={() => setUserData(null)}>Reset</UsButton>
        </div>
      </div>
    </>
  );
};

export default ComponentWallContent;