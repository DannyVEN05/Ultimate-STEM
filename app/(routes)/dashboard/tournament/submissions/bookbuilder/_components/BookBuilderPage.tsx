"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import UsAutofillBox from "@/app/_common/ui/inputs/UsAutofillBox";
import UsInput from "@/app/_common/ui/inputs/UsInput";
import AuthContext from "@/app/_context/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Profanity } from '@2toad/profanity';

const BookBuilderPage = () => {
  const [selectedCover, setSelectedCover] = useState("/covers/space.jpg");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [spineColor, setSpineColor] = useState("#000000");
  const [titTextColor, setTitColor] = useState("#000000");
  const [autTextColor, setAutTextColor ] = useState("#000000");
  const [titleFont, setTitleFont] = useState("sans-serif");
  const [autFont, setAutFont] = useState("serif");

  const fontOptions = ["sans-serif", "serif", "monospace", "cursive", "fantasy"];

  const { user } = useContext(AuthContext);

  const profanity = new Profanity();

  const handleSubmit = async () => {
    if (profanity.exists(title)|| profanity.exists(description)) {
      alert("Please remove profanity.");
      return; //stop the submission
    }

    const load = {
      concept_title: title, 
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      concept_description: description, 
      users_id: user?.user_id,
      concept_styling: {
        spine_color: spineColor,
        book_cover: selectedCover,
        title: title,
        title_color: titTextColor,
        author_color: autTextColor,
        title_font: titleFont,
        author_font: autFont
      },
      concept_genre: genre, 
      // cover: selectedCover,
    };
    const { data, error } = await supabase.from("concept").insert(load); //upload this to supbabase

    if (error) {
      console.error("Error uploading concepts", error);
    }
    else {
      router.push("/");
    }
    // console.log("debug: sumbitting", load)
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
                  style={{ color: titTextColor, fontFamily: titleFont }}> 
                    {title || "Book Title"}
                  </h1>
                  {/* Author */}
                  <p className="text-sm mt-2 w-60"
                  // style={{ backgroundColor: desTextColor }}>
                  style={{ color: autTextColor, fontFamily: autFont }}>
                    {description || "Author"}
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

          {/* <form>  cant have form has it refresh the page and cancels handlesubmit*/} 
          <div className="w-full max-w-3xl border-2 border-gray-700 p-12 space-y-6">
            <h2 className="mb-25 text-base text-left text-black">
            <div className="flex items-center justify-between">
              Title
              <div className="flex items-center gap-3">
                {/* add a form option for font styles */}
                <label className="text-sm font-bold">Title Font</label>
                <select value={titleFont} onChange={(e) => setTitleFont(e.target.value)} > 
                  {fontOptions.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
              <input type="color" value={titTextColor} onChange={(e) => setTitColor(e.target.value)}
              className="w-16 h-10 cursor-pointer" />
              </div>
              <UsInput placeholder="Enter title..." sizeOptions={{ width: 600 }} value={title} onChange={(e: any) => setTitle(e.target.value)}/>
              </div>
              Description 
              {/* <input type="color" value={desTextColor} onChange={(e) => setDesTextColor(e.target.value)}
              className="w-16 h-10 cursor-pointer" /> get rid of description  colour*/}
              <UsInput multiple placeholder="Enter description..." sizeOptions={{ height: 200, width: 600 }} value={description} onChange={(e: any) => setDescription(e.target.value)} />
              
              <div className="flex items-center justify-between">
              Author
              <div className="flex items-center gap-3">
               <select value={autFont} onChange={(e) => setAutFont(e.target.value)} >
                  {fontOptions.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
                <input type="color" value={autTextColor} onChange={(e) => setAutTextColor(e.target.value)}
                className="w-16 h-10 cursor-pointer" />
              </div>
              
              <UsInput placeholder="Enter author..." sizeOptions={{ width: 600 }} value={title} onChange={(e: any) => setAuthor(e.target.value)}/>
              </div>
            </h2>
            <div className="flex w-full flex-col items-center mt-6 font-medium text-base space-y-4">
              Genres

              <UsAutofillBox
                options={[
                  { value: "Science", label: "Science" },
                  { value: "Technology", label: "Technology" },
                  { value: "Engineering", label: "Engineering" },
                  { value: "Mathematics", label: "Mathematics" },
                ]} value ={genre} onChange={(e: any) => setGenre(e.target.value)}/>
{/* 
              <UsButton variant="blue" onClick={handleSubmit}>
                Submit
              </UsButton> */}
              <Button type="submit" onClick={handleSubmit} >Submit</Button>
              
            </div>
          </div>
          {/* </form>  */}
        </div>

      </div>
    </div>

  );
};


export default BookBuilderPage;


