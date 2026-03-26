"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import UsAutofillBox from "@/app/_common/ui/inputs/UsAutofillBox";
import UsInput from "@/app/_common/ui/inputs/UsInput";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";


const BookBuilderPage = () => {
  const [selectedCover, setSelectedCover] = useState("/covers/space.jpg");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [spineColor, setSpineColor] = useState("#000000");
  const [titTextColor, setTitColor] = useState("#000000");
  const [desTextColor, setDesTextColor ] = useState("#000000");

  const handleSubmit = () => {
    const load = {
      title, 
      description, 
      category, 
      cover: selectedCover,
    };
    console.log("debug: sumbitting", load)
  }

  const router = useRouter();
  return (
    <div className="text-4xl">
      <Button variant="outline" onClick={() => {router.push("./")}}>
        Back
      </Button>
      
        <div className="flex w-full flex-col items-center mt-10 font-bold space-y-10">
          <h1 className="mb-25 text-4xl">{'Book Submissions'}
             
          </h1>
          <div className="flex w-full justify-center gap-25 text-center font-bold text-2xl">

          <div className="w-full max-w-md border-2 border-gray-700 p-8">
            {/* Spine */}
            <div className="flex items-center justify-center">
              
              <div
                className="h-96 w-10 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: spineColor }}>
                <span className="rotate-90 ">
                  {title || "Book Title"}
                </span>
              </div>

              {/* Cover */}
              <div className="relative w-64 h-96 border-black">
                <img
                  src={selectedCover}
                  className="absolute w-full h-full object-cover"/>

                <div className="absolute top-0 flex flex-col text-white p-4">
                  {/* title */}
                  <h1 className="text-xl font-bold"
                  // style={{ backgroundColor: titTextColor }}> 
                  style={{ color: titTextColor }}> 
                    {title || "Book Title"}
                  </h1>
                  {/* description */}
                  <p className="text-sm mt-2 w-60"
                  // style={{ backgroundColor: desTextColor }}>
                  style={{ color: desTextColor }}>
                    {description || "Description preview"}
                  </p>
                </div>
              </div>
            </div>
         {/* cover image display */}
         {/* this was annoying to fix */}
        <div className="flex flex-row items-end gap-5 mb-6 " > 
          {[
            "/covers/engineering.png",
            "/covers/mathematics.jpg",
            "/covers/space.jpg",
            "/covers/technology.jpg",
          ].map((cover) => (
            <img
            key={cover}
            src={cover}
            onClick={() => setSelectedCover(cover)}
            className={` block h-20 cursor-pointer border-4 ${
              selectedCover === cover ? "border-blue-500" : "border-transparent"}`}/>
          ))
          }
          
        </div>
        {/*colour wheel */}
        {/* needed to have flex items - center and gap together to make it have a gap for some reasons */}
        <div className="text-base gap-5 flex items-center">
          Spine Colour 
          <input type="color" value={spineColor} onChange={(e) => setSpineColor(e.target.value)}
          className="w-16 h-10 cursor-pointer" />
          </div>
          </div>

          {/*FORM */}
          {/* need to have it in a form for the submit button to work */}
          <form>
          <div className="w-full max-w-3xl border-2 border-gray-700 p-12 space-y-6">
            <h2 className="mb-25 text-base text-left text-black">
              Title
              <input type="color" value={titTextColor} onChange={(e) => setTitColor(e.target.value)}
              className="w-16 h-10 cursor-pointer" />
              <UsInput placeholder="Enter title..." sizeOptions={{ width: 600 }} value={title} onChange={(e: any) => setTitle(e.target.value)}/>
              Description 
              <input type="color" value={desTextColor} onChange={(e) => setDesTextColor(e.target.value)}
              className="w-16 h-10 cursor-pointer" />
              <UsInput multiple placeholder="Enter description..." sizeOptions={{ height: 200, width: 600 }} value={description} onChange={(e: any) => setDescription(e.target.value)} />
            </h2>
            <div className="flex w-full flex-col items-center mt-6 font-medium text-base space-y-4">
              Genres

              <UsAutofillBox
                options={[
                  { value: "Science", label: "Science" },
                  { value: "Technology", label: "Technology" },
                  { value: "Engineering", label: "Engineering" },
                  { value: "Mathematics", label: "Mathematics" },
                ]}/>
{/* 
              <UsButton variant="blue" onClick={handleSubmit}>
                Submit
              </UsButton> */}
              <Button type="submit">Submit</Button>
              
            </div>
          </div>
          </form> 
        </div>

      </div>
    </div>

  );
};


export default BookBuilderPage;


