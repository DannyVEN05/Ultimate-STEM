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
  const [icon, setIcon] = useState("/covers/Icon1.png");
  const stageRef = useRef<any>(null);

  const [image] = useImage(selectedCover, 'anonymous');
  const [iconImage] = useImage(icon);
  const [spineImage] = useImage(selectedSpine);

  const fontOptions = ["sans-serif", "serif", "monospace", "cursive", "fantasy"];

  //make it so when theres a long title, it makes it smaller
  const calculateFontSize = (text: string) => {
    const baseSize = 60;
    const maxWidth = 240;
    //make it so it is shrinking after each space
    const words = text.split(/\s+/);
    //finding long words
    const longestWordLength = Math.max(...words.map(word => word.length));
    //estimated width of long word
    const estimatedWidth = longestWordLength * 20;

    if (estimatedWidth > longestWordLength) {
      const scaleSize = Math.floor((maxWidth / estimatedWidth) * 20);

      return Math.max(25, scaleSize);
    }
    return baseSize;

  };

  const dynamicSize = calculateFontSize(title);

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
    <div className="flex items-left">
      <Button variant="outline" onClick={() => router.back()}>
        Back
      </Button>
      <div className="flex w-full flex-col items-center font-bold overflow-hidden">
        {/* Book Submissions */}
        <div className="flex w-full h-full justify-center gap-25 text-center font-bold text-2xl overflow-hidden">

          <div className="flex flex-col w-full max-w-md border-2 border-gray-300 rounded-lg shadow-sm p-6 space-y-2 overflow-y-auto">
            {/* Make it center */}
            <div className="flex items-center justify-center">

              {/* Cover */}
              <div className="relative w-69 h-96 border-black " >
                {/* konva stage */}
                {/* background */}
                <Stage ref={stageRef} width={306} height={384} className="absolute top-0 left-0">
                  <Layer>

                    <Rect x={0} y={0} width={52} height={384} fill={spineColor} />
                    {spineImage && (<KonvaImage image={spineImage} x={0} y={0} width={52} height={384} />)}

                  </Layer>

                  <Layer listening={false}>
                    <Rect x={50} y={0} width={256} height={384} fill={coverColor} />
                    {image && <KonvaImage image={image} x={50} width={256} height={384} opacity={0.2} />}
                  </Layer>

                  <Layer>
                    <Rect width={(title || "Book Title").length * 15} height={40} cornerRadius={4} />
                    {/* was confusing konva text with our text so I change to KonvaText */}
                    <KonvaText text={(title || "Book Title").toUpperCase()}
                      x={55} y={60}
                      fontSize={dynamicSize}
                      fontFamily="sans-serif"
                      fontStyle="bold"
                      width={240}
                      wrap="word"
                      fill={titTextColor}
                      padding={5} />

                  </Layer>

                  <Layer>
                    {iconImage && (<KonvaImage image={iconImage} x={180} y={250} width={100} height={100} />)}
                  </Layer>


                </Stage>

              </div>
            </div>

            {/* Spine Cover */}
            <div className="block mb-2 text-sm ">
              Select Spine Cover
              <UsAutofillBox
                options={[
                  { value: "/covers/spine.png", label: "Spine 1" },
                  { value: "/covers/spine2.png", label: "Spine 2" },
                  { value: "/covers/spine3.png", label: "Spine 3" },
                  { value: "/covers/spine4.png", label: "Spine 4" },
                ]} sizeOptions={{ width: 300 }} value={selectedSpine} onChange={(e: any) => setSelectedSpine(e.target.value)} />

            </div>

            <div className="mb-2 text-sm">
              Select Cover Icon
              <UsAutofillBox
                options={[
                  { value: "/covers/Icon1.png", label: "STEM" },
                  { value: "/covers/Icon2.png", label: "Technology" },
                  { value: "/covers/Icon3.png", label: "Maths" },
                  { value: "/covers/Icon4.png", label: "Engineering" },
                  { value: "/covers/Icon5.png", label: "Physics" },
                  { value: "/covers/Icon6.png", label: "Biology" },
                  { value: "/covers/Icon7.png", label: "Robot" },
                  { value: "/covers/Icon8.png", label: "Books" },

                ]} sizeOptions={{ width: 300 }} value={icon} onChange={(e: any) => setIcon(e.target.value)} />

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
          <div className="flex w-full max-w-2xl border-2 space-between border-gray-300 rounded-lg shadow-sm p-6 space-y-4 overflow-hidden">
            <div className="flex flex-col text-base text-left space-y-10 text-black">
              <div className="flex flex-col space-y-2">
                Title

                <div className="flex items-center justify-start gap-20 mb-2">
                  <UsInput placeholder="Enter title..." sizeOptions={{ width: 300 }} maxLength={35} value={title} onChange={(e: any) => setTitle(e.target.value)} />

                  {/* title colour */}
                  <div className="flex items-center gap-3">
                    <label htmlFor="colour-picker" className="text-sm font-bold">Colour</label>
                    <input id="colour-picker" type="color" value={titTextColor} onChange={(e) => setTitColor(e.target.value)}
                      className="w-16 h-10 cursor-pointer rounded-full" />
                  </div>
                </div>

              </div>
              <div className="flex flex-col space-y-2">

                Genres
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
        </div>

      </div>
    </div >

  );
};


export default BookBuilderPage;


