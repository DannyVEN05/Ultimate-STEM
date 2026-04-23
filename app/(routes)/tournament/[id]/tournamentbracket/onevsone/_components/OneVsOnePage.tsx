"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";


const OneVsOnePage = () => {
  const router = useRouter();
  
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [book1flipped,setbook1Flipped] = useState(false);
  const [book2flipped,setbook2Flipped] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(45900); // 12 hours 45 minutes in seconds

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
 

  // Format timeLeft into hours and minutes
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);



  return (

  <div className="mx-auto max-w-7xl ">
    <div className="pointer-events-none absolute top-16 left-0 h-[400px] w-[500px] bg-[radial-gradient(circle_at_top_left,_rgba(0,255,0,0.2),_transparent_50%)]" />
    

    
    <div className="min-h-screen bg-white-50 px-4 py-5 pt-1">
      <Button className="bg-white-50 hover:bg-slate-100 mb-3 text-sm font-medium text-slate-700" onClick={() => {router.push("./")}}>
        ← Back to Bracket
      </Button>

      <div className= "flex justify-between items-start">
      <h1 className=" md:text-5xl font-headline font-bold text-on-surface tracking-tighter mb-2">
        Torunament Title</h1>      
      
      <div className="rounded-full bg-green-100 px-5 py-3 text-sm font-semibold text-blue-800 shadow-lg mb-3 ">
      Voting Ends in {formatTime(timeLeft)}
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
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button")) return;
        setbook1Flipped(!book1flipped)
      }}
      className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-4 bg-purple-100 cursor-pointer hover:bg-purple-200 shadow-md flex flex-col [backface-visibility:hidden]"
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
            setIsVoting(true);
            setHasVoted(book1.title);
            setSelectedBook(book1.title);
            router.push("");
          }}
        >
          Vote
        </Button>
      </div>
    </div>

{/* /* Back */}
    <div
      onClick={() => setbook1Flipped(!book1flipped)}
      className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-6 bg-purple-100 cursor-pointer hover:bg-purple-200 shadow-md flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden]"
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

{/* end of book1 item */}


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
      className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-4 bg-purple-100 cursor-pointer hover:bg-purple-200 shadow-md flex flex-col [backface-visibility:hidden]"
    >
      <img
        src={book2.cover}
        alt={book2.title}
        className="w-90 h-100 object-cover overflow-hidden rounded-[1.75rem] mx-auto shadow-md"
      />

      <h2 className="text-xl text-gray-600 font-semibold text-left mt-3 mx-auto">
        By: {book2.author}
      </h2>

      <div className="mt-auto flex justify-center">
      
      <Button
          className="bg-green-300 hover:bg-green-400 text-gray-700 px-10 py-5.5 text-lg rounded-[1.75rem] shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            setIsVoting(true);
            setHasVoted(book2.title);
            setSelectedBook(book2.title);
            router.push("");
          }}
        >
          Vote
      </Button>

      </div>
    </div>

    {/* Back */}
    <div
      onClick={() => setbook2Flipped(!book2flipped)}
      className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-6 bg-purple-100 cursor-pointer hover:bg-purple-200 shadow-md flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden]"
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

{/* dialog for voting */}
    <Dialog open={isVoting} onOpenChange={setIsVoting}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#1d2436]">Confirm Your Vote</DialogTitle>
          <DialogDescription className="text-[#8088a0]">
            Are you sure you want to vote for {selectedBook}?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            onClick={() => {
              setIsVoting(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setIsVoting(false);
              setHasVoted(selectedBook);
              router.push("");
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    </div>
  </div>
  </div>

  );
};

export default OneVsOnePage;