"use client";

import UsAutofillBox from "@/app/_common/ui/inputs/UsAutofillBox";
import UsInput from "@/app/_common/ui/inputs/UsInput";
import AuthContext from "@/app/_context/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useContext, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Profanity } from '@2toad/profanity';
import { Stage, Layer, Text as KonvaText, Rect, Group, Image as KonvaImage} from 'react-konva';
import useImage from 'use-image'

const BookBuilderPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCover, setSelectedCover] = useState("/covers/space.jpg");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [spineColor, setSpineColor] = useState("#000000");
  const [titTextColor, setTitColor] = useState("#000000");
  const [titBackColor, setTitBackColor] = useState("#FFFFFF");
  const [titlePos, setTitlePos] = useState({ x: 20, y: 40 });
  const [autTextColor, setAutTextColor ] = useState("#000000");
  const [autBackColor, setAutBackColor] = useState("#FFFFFF");
  const [authorPos, setAuthorPos] = useState({ x: 20, y: 100 });
  const [titleFont, setTitleFont] = useState("sans-serif");
  const [autFont, setAutFont] = useState("serif");
  const stageRef = useRef<any>(null);

  const [image] = useImage(selectedCover, 'anonymous');

  const fontOptions = ["sans-serif", "serif", "monospace", "cursive", "fantasy"];

  const { user } = useContext(AuthContext);

  const profanity = new Profanity();

  const handleSubmit = async () => {
    if (isProcessing) return; // Prevents multiple submissions
    if (profanity.exists(title)|| profanity.exists(description) || profanity.exists(author)) {
      alert("Please remove profanity.");
      return; //stop the submission
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
          title: title,
          author: author,
          title_color: titTextColor,
          title_bg_color: titBackColor,
          author_color: autTextColor,
          author_bg_color: autBackColor,
          title_font: titleFont,
          author_font: autFont, 

          title_x: titlePos.x,
          title_y: titlePos.y,
          author_x: authorPos.x,
          author_y: authorPos.y,
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
          <h1 className="mb-25 text-4xl">{'Book Submissions'}
             
          </h1>
          <div className="flex w-full justify-center gap-25 text-center font-bold text-2xl">

          <div className="w-full max-w-md border-2 border-gray-300 rounded-lg shadow-sm p-10 space-y-6 ">
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
                  {/* for later */}
                  {/*To use images in Konva, use - useImage hook, layer the Stage over the img tag for now */}
                {/* image */}
                {/* <img
                src={selectedCover}
                className="absolute top-0 left-0 w-full h-full object-cover -z-10"
                /> */}
                {/* konva stage */}
                  {/* background */}
                <Stage ref={stageRef} width={256} height={384} className="absolute top-0 left-0">
                  <Layer listening={false}>
                    {image && <KonvaImage image={image} width={256} height={384} />}
                  </Layer>
                  
                  <Layer>
                    <Group x={titlePos.x} y={titlePos.y} draggable onDragEnd={(e) => setTitlePos({ x: e.target.x(), y: e.target.y() })}
                      dragBoundFunc={(pos) => {
                        const stageWidth = 256;
                        const stageHeight = 384;
                        
                        const boxWidth = (title || "Book Title").length * 15 + 20; 
                        // max width is based on the title length ig
                        const boxHeight = 40;

                        return {
                          x: Math.max(0, Math.min(pos.x, stageWidth - boxWidth)),
                          y: Math.max(0, Math.min(pos.y, stageHeight - boxHeight )),
                        };
                      }}
                      >
                      {/* title */}
                      <Rect width={(title || "Book Title").length * 15 + 20} height={40} cornerRadius={4} />

                      {/* was confusing konva text with our text so I change to KonvaText */}
                      <KonvaText text={title || "Book Title"} fontSize={30} fontFamily={titleFont} fill={titTextColor} padding={5}/>
                    </Group>
                    
                    {/* Author  */}
                    <Group x={authorPos.x} y={authorPos.y} draggable onDragEnd={(e) => setAuthorPos({ x: e.target.x(), y: e.target.y() })}
                      dragBoundFunc={(pos) => {
                        const stageWidth = 256;
                        const stageHeight = 384;
                        
                        const boxWidth = (author || "Author").length * 12; 
                        // max width is based on the title length ig
                        const boxHeight = 40;

                        return {
                          x: Math.max(0, Math.min(pos.x, stageWidth - boxWidth)),
                          y: Math.max(0, Math.min(pos.y, stageHeight - boxHeight )),
                        };
                      }}
                      >
                    <Rect width={(author || "Author").length * 12} height={40} cornerRadius={4} />

                    <KonvaText text={author || "Author"} fontSize={20} fontFamily={autFont} fill={autTextColor} padding={5}/>
                    </Group>
                  </Layer>
                  </Stage>
                
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
          <div className="w-full max-w-2xl border-2 border-gray-300 rounded-lg shadow-sm p-10 space-y-6 ">
            <div className="mb-25 text-base text-left text-black">
            <div className="flex items-center justify-start gap-20 mb-2">
            Title
            {/* title colour */}
            <div className="flex items-center gap-3">
              <label htmlFor="colour-picker" className"text-sm font-bold">Colour</label>
              <input id="colour-picker" type="color" value={titTextColor} onChange={(e) => setTitColor(e.target.value)}
              className="w-16 h-10 cursor-pointer" />
            </div>
            

              <div className="flex items-center gap-3">
                {/* add a form option for font styles */}
                <label htmlFor="font-select" className="text-sm font-bold">Font</label>
                <select id="font-select" value={titleFont} onChange={(e) => setTitleFont(e.target.value)} className="text-sm border border-gray-300 rounded h-8"> 
                  {fontOptions.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
              </div>
              
              </div>
              <UsInput placeholder="Enter title..." sizeOptions={{ width: 600 }} value={title} onChange={(e: any) => setTitle(e.target.value)}/>
              
              Description 

              <UsInput multiline={true} placeholder="Enter description..." sizeOptions={{ height: 200, width: 600 }} maxLength={535} value={description} onChange={(e: any) => setDescription(e.target.value)} />
              
              <div className="flex items-center justify-start gap-20 mb-2">
              Author

              {/* font colour */}
              <div className="flex items-center gap-3">
              <label htmlFor="colour-picker" className="text-sm font-bold">Colour</label>
                <input id="colour-picker" type="color" value={autTextColor} onChange={(e) => setAutTextColor(e.target.value)}
                className="w-16 h-10 cursor-pointer" />
              </div>

              <div className="flex items-center gap-3">
              <label htmlFor="font-select" className="text-sm font-bold">Font</label>
              <select id="font-select" value={autFont} onChange={(e) => setAutFont(e.target.value)} className="text-sm border border-gray-300 rounded h-8">
                  {fontOptions.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
              </div>
              
              </div>
              <UsInput placeholder="Enter author..." sizeOptions={{ width: 600 }} value={author} onChange={(e: any) => setAuthor(e.target.value)}/>
            </div>
            <div className="flex w-full flex-col items-center font-medium text-base space-y-4">
              Genres

              <UsAutofillBox
                options={[
                  { value: "Science", label: "Science" },
                  { value: "Technology", label: "Technology" },
                  { value: "Engineering", label: "Engineering" },
                  { value: "Mathematics", label: "Mathematics" },
                ]} value ={genre} onChange={(e: any) => setGenre(e.target.value)}/>

              <Button type="button" onClick={handleSubmit}>Submit</Button>
              
            </div>
          </div>
          {/* </form>  */}
        </div>

      </div>
    </div>

  );
};


export default BookBuilderPage;


