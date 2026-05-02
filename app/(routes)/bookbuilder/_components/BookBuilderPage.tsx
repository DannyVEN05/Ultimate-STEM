"use client";

import UsAutofillBox from "@/app/_common/ui/inputs/UsAutofillBox";
import UsInput from "@/app/_common/ui/inputs/UsInput";
import AuthContext from "@/app/_context/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useContext, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Profanity } from '@2toad/profanity';
import { Stage, Layer, Text as KonvaText, Rect, Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image'

const BookBuilderPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCover, setSelectedCover] = useState("/covers/STEM.png");
  const [selectedSpine, setSelectedSpine] = useState("/covers/spine.png");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [spineColor, setSpineColor] = useState("#000000");
  const [titTextColor, setTitColor] = useState("#FFFFFF");
  const [coverColor, setCoverColor] = useState(("#000000"));
  const stageRef = useRef<any>(null);

  const [image] = useImage(selectedCover, 'anonymous');

  const fontOptions = ["sans-serif", "serif", "monospace", "cursive", "fantasy"];

  const { user } = useContext(AuthContext);

  const profanity = new Profanity();

  const handleSubmit = async () => {
    if (isProcessing) return; // Prevents multiple submissions
    if (profanity.exists(title) || profanity.exists(description)) {
      alert("Please remove profanity.");
      return; //stop the submission
    }

    if (!title.trim() || !description.trim()) {
      alert("Please fill in title, description and author");
      return;
    }

    setIsProcessing(true);
    try {
      const stage = stageRef.current;

      if (!stage || typeof stage.toDataURL !== 'function') {
        alert("Book preview is not ready yet. Please wait a moment and try again.");
        setIsProcessing(false);
      }

      // Captures the current state of the Konva stage as a data URL (base64-encoded image)
      const dataUrl = stage.toDataURL({ pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "temp_cover.png", { type: "image/png" });

      // Upload png to supabase storage book-covers bucket
      const fileName = `${user?.user_id}/${Date.now()}.png`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from("book-covers")
        .upload(fileName, file);

      if (storageError) throw storageError;

      const load = {
        concept_title: title,
        // created_at: new Date().toISOString(),
        // updated_at: new Date().toISOString(),
        concept_description: description,
        user_id: user?.user_id,
        concept_styling: {
          spine_color: spineColor,
          book_cover: storageData?.path,
          title: title
        },
        concept_genre: genre,
        // cover: selectedCover,
      };
      const { data, error } = await supabase.from("concept").insert(load).select().single(); //upload this to supbabase
      console.log("data: ", data);

      if (error) {
        console.log("Error uploading concepts - ", error.message, "Code", error.code);
      }
      else if (!data) {
        console.log("Error uploading concepts - no concept returned from insert");
      }
      else {
        const { error: submissionError } = await supabase.from("tournament_submission").insert({ concept_id: data.concept_id, tournament_id: 4 }); //upload to tournamant submission

        if (submissionError) {
          console.log("Error uploading concepts - ", submissionError.message, "Code", submissionError.code);
        } else {
          router.push("/");
        }

      }
    } catch (err) {
      console.error("Error submitting concept: ", err);
    } finally {
      setIsProcessing(false);
    }
    // console.log("debug: sumbitting", load)
  };

  const router = useRouter();
  return (
    <div className="text-4xl">
      <Button variant="outline" onClick={() => router.back()}>
        Back
      </Button>

      <div className="flex w-full flex-col items-center mt-10 font-bold space-y-10">
        {/* <h1 className="mb-25 text-4xl">{'Book Submissions'}

        </h1> */}
        {/* Book Submissions */}
        <div className="flex w-full justify-center gap-25 text-center font-bold text-2xl">

          <div className="w-full max-w-md border-2 border-gray-300 rounded-lg shadow-sm p-10 space-y-6 ">
            {/* Spine */}
            <div className="flex items-center justify-center">

              <div
                className="h-96 w-12 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: spineColor }}>
                <span className="rotate-90 ">
                  {/* {title || "Book Title"} */}
                </span>
                {/* conditionally render the image so it only appears when a source actually exists */}
                {selectedSpine && (
                  <img
                    src={selectedSpine}
                    className="w-full h-full object-cover" style={{
                      transform: 'translate(1px, -2px)'
                    }} />
                )}

              </div>

              {/* Cover */}
              <div className="relative w-64 h-96 border-black" style={{ backgroundColor: coverColor }}>
                {/* konva stage */}
                {/* background */}
                <Stage ref={stageRef} width={256} height={384} className="absolute top-0 left-0">
                  <Layer listening={false}>
                    {image && <KonvaImage image={image} width={256} height={384} opacity={0.1} />}
                  </Layer>

                  <Layer>
                    <Rect width={(title || "Book Title").length * 15} height={40} cornerRadius={4} />
                    {/* was confusing konva text with our text so I change to KonvaText */}
                    <KonvaText text={(title || "Book Title").toUpperCase()}
                      fontSize={60}
                      fontFamily="sans-serif"
                      fontStyle="bold"
                      width={240}
                      wrap="word"
                      fill={titTextColor}
                      padding={5} />

                  </Layer>
                </Stage>

              </div>
            </div>
            {/* Spine Cover */}
            <div className="block mb-2 text-sm mb-6 ">
              Select Spine Cover
              <UsAutofillBox
                options={[
                  { value: "/covers/spine.png", label: "Spine 1" },
                  { value: "/covers/spine2.png", label: "Spine 2" },
                  { value: "/covers/spine3.png", label: "Spine 3" },
                  { value: "/covers/spine4.png", label: "Spine 4" },
                ]} sizeOptions={{ width: 300 }} value={selectedSpine} onChange={(e: any) => setSelectedSpine(e.target.value)} />

            </div>

            {/*colour wheel */}
            {/* needed to have flex items - center and gap together to make it have a gap for some reasons */}
            <div className="text-sm gap-5 flex items-center">
              Spine Colour
              <input type="color" value={spineColor} onChange={(e) => setSpineColor(e.target.value)}
                className="w-16 h-10 cursor-pointer" />
              Cover Colour
              <input type="color" value={coverColor} onChange={(e) => setCoverColor(e.target.value)}
                className="w-16 h-10 cursor-pointer" />
            </div>
          </div>


          {/* <form>  cant have form has it refresh the page and cancels handlesubmit*/}
          <div className="w-full max-w-2xl border-2 border-gray-300 rounded-lg shadow-sm p-10 space-y-6 ">
            <div className="mb-25 text-base text-left text-black">

              Title

              <div className="flex items-center justify-start gap-20 mb-2">
                <UsInput placeholder="Enter title..." sizeOptions={{ width: 300 }} maxLength={30} value={title} onChange={(e: any) => setTitle(e.target.value)} />

                {/* title colour */}
                <div className="flex items-center gap-3">
                  <label htmlFor="colour-picker" className="text-sm font-bold">Colour</label>
                  <input id="colour-picker" type="color" value={titTextColor} onChange={(e) => setTitColor(e.target.value)}
                    className="w-16 h-10 cursor-pointer rounded-full" />
                </div>

              </div>

              Genres
              <div className="flex items-center justify-start gap-20 mb-2">
                <UsAutofillBox
                  options={[
                    { value: "Science", label: "Science" },
                    { value: "Technology", label: "Technology" },
                    { value: "Engineering", label: "Engineering" },
                    { value: "Mathematics", label: "Mathematics" },
                  ]} sizeOptions={{ width: 600 }} value={genre} onChange={(e: any) => setGenre(e.target.value)} />
              </div>

              Description


              <UsInput multiline={true} placeholder="Enter description..." sizeOptions={{ height: 200, width: 600 }} maxLength={535} value={description} onChange={(e: any) => setDescription(e.target.value)} />

              <div className="flex items-center justify-center gap-20 mb-2 mt-8">
                <Button type="button" onClick={handleSubmit} className="px-10 py-4 text-lg font-bold min-w-[200px]">Submit</Button>
              </div>
            </div>


          </div>
          {/* </form>  */}
        </div>

      </div>
    </div >

  );
};


export default BookBuilderPage;


