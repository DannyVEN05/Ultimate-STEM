"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
const OneVsOnePage = () => {
  const router = useRouter();
  
// changes to implement 
// 1. Make everything fit on one page without scrolling
// 2. Don't need console message, allow user to switch vote between the two books. 



const [selectedBook, setSelectedBook] = useState<string | null>(null);
const [book1flipped,setbook1Flipped] = useState(false);
const [book2flipped,setbook2Flipped] = useState(false);

  const book1 = {
    title: "Book One",
    author: "Author 1",
    description: "Book one description goes here.Book one description goes here.Book one description goes here.Book one description goes here.Book one description goes here.Book one description goes here.",
    cover: "https://m.media-amazon.com/images/I/71Z9DuY6lCL._AC_UF1000,1000_QL80_.jpg",
  };

  const book2 = {
    title: "Book Two",
    author: "Author 2",
    description: "Book two description goes here.Book two description goes here.Book two description goes here.Book two description goes here.Book two description goes here.Book two description goes here.Book two description goes here.",
    cover: "https://m.media-amazon.com/images/I/71Z9DuY6lCL._AC_UF1000,1000_QL80_.jpg",
  };
 




  return (

  <div className="mx-auto max-w-7xl ">

    
    <div className="min-h-screen bg-white-50 px-4 py-5 pt-1">
      <Button className="bg-white-50 hover:bg-slate-100 mb-3 text-sm font-medium text-slate-700" onClick={() => {router.push("./")}}>
        ← Back to Bracket
      </Button>

      <div className= "flex justify-between items-start">
      <h1 className=" md:text-5xl font-headline font-bold text-on-surface tracking-tighter mb-2">
        Torunament Title</h1>      
      
      <div className="rounded-full bg-green-100 px-5 py-3 text-sm font-semibold text-blue-800 shadow-lg mb-3 ">
      Voting Ends in 12h 45m
     </div> 
  </div>
    <p className="mb-2 max-w-4xl text-base font-bold text-gray-500 sm:text-xl">Round: 02 One vs One</p>

  {/* Book section */}
  
  
  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-1 mt-1 items-center text-center justify-items-center">
          

  {/* book 1 item */}

  <div className="perspective-[1000px] mt-4">
    <div
      className={`relative h-[550px] w-[400px] transition-transform duration-500 [transform-style:preserve-3d] ${
      book1flipped ? "[transform:rotateY(180deg)]" : "hover:[transform:rotateY(15deg)_scale(1.02)]" }`}
    >

    {/* Front */}
    <div
      onClick={() => setbook1Flipped(!book1flipped)}
      className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-4 bg-blue-100 cursor-pointer hover:bg-blue-200 shadow-md flex flex-col [backface-visibility:hidden]"
    >
      <img
        src={book1.cover}
        alt={book1.title}
        className="w-90 h-100 object-cover overflow-hidden rounded-[1.75rem] mx-auto shadow-md"
      />

      <h2 className="text-xl text-gray-600 font-semibold text-left mt-3 mx-auto">
        By: {book1.author}
      </h2>
      
      <div className="mt-auto flex justify-center">
        <Button
          className="bg-green-300 hover:bg-green-400 text-gray-700 px-10 py-5.5 text-lg rounded-[1.75rem] shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            const confirmed = window.confirm(
              `Confirm your vote for ${book1.title}. This cannot be changed.`
            );
            if (confirmed) {
              setSelectedBook(book1.title);
              router.push("./");
            }
          }}
        >
          Vote
        </Button>
      </div>
    </div>

/* Back */
    <div
      onClick={() => setbook1Flipped(!book1flipped)}
      className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-6 bg-blue-100 cursor-pointer hover:bg-blue-200 shadow-md flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden]"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-3">
        {book1.title}
      </h2>

      <h3 className="text-lg text-gray-600 font-semibold mb-4">
        By: {book1.author}
      </h3>

      <p className="text-base text-gray-700 leading-relaxed overflow-y-auto">
        {book1.description}
      </p>

    </div>
  </div>
</div>



      <div className="flex items-center justify-center">
            <div className="rounded-full bg-white border border-purple-300 border-4 px-5 py-4 text-lg font-bold text-gray-800 shadow-lg">
              VS
            </div>
        </div>


    <div className="perspective-[1000px] mt-4">
      <div
      className={`relative h-[550px] w-[400px] transition-transform duration-500 [transform-style:preserve-3d] ${
      book2flipped ? "[transform:rotateY(180deg)]" : "hover:[transform:rotateY(15deg)_scale(1.02)]"}`}
      >
    
    {/* Front */}

    <div
      onClick={() => setbook2Flipped(!book2flipped)}
      className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-4 bg-blue-100 cursor-pointer hover:bg-blue-200 shadow-md flex flex-col [backface-visibility:hidden]"
    >
      <img
        src={book2.cover}
        alt={book2.title}
        className="w-90 h-100 object-cover overflow-hidden rounded-[1.75rem] mx-auto shadow-md"
      />

      <h2 className="text-xl text-gray-600 font-semibold text-left mt-3 mx-auto">
        By: {book1.author}
      </h2>

      <div className="mt-auto flex justify-center">
      
      <Button
          className="bg-green-300 hover:bg-green-400 text-gray-700 px-10 py-5.5 text-lg rounded-[1.75rem] shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            const confirmed = window.confirm(
              `Confirm your vote for ${book2.title}. This cannot be changed.`
            );
            if (confirmed) {
              setSelectedBook(book2.title);
              router.push("./");
            }
          }}
        >
          Vote
      </Button>

      </div>
    </div>

    {/* Back */}
    <div
      onClick={() => setbook2Flipped(!book2flipped)}
      className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-6 bg-blue-100 cursor-pointer hover:bg-blue-200 shadow-md flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden]"
    >
    
    <h2 className="text-2xl font-bold text-gray-800 mb-3">
        {book2.title}
      </h2>

    <h3 className="text-lg text-gray-600 font-semibold mb-4">
        By: {book2.author}
    </h3>

    <p className="text-base text-gray-700 leading-relaxed overflow-y-auto">
      {book2.description}
    </p>
   
    </div>
  </div>
</div>
     
   


    </div>
  </div>
  </div>

  );
};

export default OneVsOnePage;