"use client";

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react";

const GridViewPage = () => {
  const [concepts, setConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSubmissions() {
      const {data, error} = await supabase
        .from("concepts")
        .select("*");

      if (error){
        console.warn("Error Fetching Submissions: ", error);
      } else {
        setConcepts(data || []);
        console.log("Successfully fetched Submissions")
      }
      setLoading(false);
    }
    
    getSubmissions();
  }, []);

  if (loading) return <div className="pt-10 text-center">Loading Submissions...</div>

  return (
    <div className="mt-3 grid w-full gap-4 sm:grid-cols-4 md:grid-cols-8">
      {concepts.map((concept) => (
      <div key={concept.id} className="flex flex-col items-center">
        {/* Add the code for including theme */}
        <p className="mt-2 font-bold">{concept.title}</p>
      </div>
      ))}; 
    </div>
  );
};

export default GridViewPage;