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

  const book1 = {
    title: "Book One",
    author: "Author 1",
    description: "Book one description goes here.",
    cover: "https://m.media-amazon.com/images/I/71Z9DuY6lCL._AC_UF1000,1000_QL80_.jpg",
  };

  const book2 = {
    title: "Book Two",
    author: "Author 2",
    description: "Book two description goes here.",
    cover: "https://m.media-amazon.com/images/I/71Z9DuY6lCL._AC_UF1000,1000_QL80_.jpg",
  };
 




  return (
    <div className="text-4xl">
      
      <h1 className="mb-1 text-3xl font-bold text-center">{'{tournamentName}'}</h1>
     
      <Button className="absolute top-25 left-4" onClick={() => {router.push("./")}}>
        Back
      </Button>
      
      {/* <p className="mx-auto mt-4 max-w-4xl text-base font-bold text-gray-700 sm:text-2xl text-center">Vote for the best book in this round!</p> */}
      

    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-1 mt-1 items-center text-center justify-items-center">
      
      {/* book 1 item */}
      <div className="border rounded-lg p-6 mt-8 bg-gray-100 shadow-md h-[700px] w-[500px] flex flex-col">
        <img
            src={book1.cover}
            alt={book1.title}
            className="w-95 h-100 object-cover rounded-md mx-auto shadow-md"
        />
      
        {/* <h2 className="text-3xl font-semibold ">{book1.title}</h2> */}
        <h2 className="text-xl text-gray-600 font-semibold text-left mt-3 mx-auto">By: {book1.author}</h2>
        <p className="text-xl text-gray-600 mt-6">{book1.description}</p> 
        
        <div className="mt-auto flex justify-center">
    
    <Button className="bg-green-300 hover:bg-green-400 text-gray-700 px-10 py-5.5 text-lg" onClick={() => {
      const confirmed = window.confirm(`Confirm your vote for ${book1.title}. This cannot be changed.`);
      if (confirmed) {
        setSelectedBook(book1.title)
        router.push("./");}}}
        > Vote 
      </Button>
      
      </div>
    </div>


      <div className="flex items-center justify-center">
            <div className="rounded-full bg-slate-900 px-7 py-3 text-lg font-bold uppercase tracking-[0.2em] text-white shadow-lg">
              VS
            </div>
        </div>

      {/* book 2 item */}
      <div className="border rounded-lg p-6 mt-8 bg-gray-100 shadow-md h-[700px] w-[500px] flex flex-col">
        <img
            src={book2.cover}
            alt={book2.title}
            className="w-95 h-100 object-cover rounded-md mx-auto shadow-md"
          />

        {/* <h2 className="text-4xl font-semibold">{book2.title}</h2> */}
        <h2 className="text-xl text-gray-600 font-semibold text-left mt-3 mx-auto">By: {book2.author}</h2>
        <p className="text-xl text-gray-600 mt-6">{book2.description}</p> 

        <div className="mt-auto flex justify-center">
        
      <Button className="bg-green-300 hover:bg-green-400 text-gray-700 px-10 py-5.5 text-lg" onClick={() => {
        const confirmed = window.confirm(`Are you sure you want to vote for ${book2.title}? This cannot be changed.`);
        if (confirmed) {
          setSelectedBook(book2.title)
          router.push("./");}}}
        > Vote 
      </Button>

      </div>    
     </div>
    
   
    </div>
  </div>
  );
};

export default OneVsOnePage;