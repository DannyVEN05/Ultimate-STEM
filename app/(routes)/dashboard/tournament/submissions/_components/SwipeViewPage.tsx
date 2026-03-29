"use client";

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react";

const SwipeviewPage = () => {
  const [concepts, setConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function getConcepts() {
      const { data, error } = await supabase
        .from("concept")
        .select("*");

      if (error) {
        const message = error.message || JSON.stringify(error);
        console.error("Error fetching concept:", message);
        setLoading(false);
        return;
      }

      if (!data) {
        console.error("Error fetching concept: no data");
        setConcepts([]);
        setLoading(false);
        return;
      }

      setConcepts(data);
      setLoading(false);
    };

    getConcepts();
  }, []);

  if (loading) {
    return (
      <div className="flex w-full flex-col items-center mt-10">
        <p className="text-lg">Loading concepts...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center mt-10 font-bold space-y-4">
      {concepts.length === 0 ? (
        <p className="text-lg">No concepts found.</p>
      ) : (
        <div className="grid w-full max-w-4xl gap-4">
          {concepts.map((concept) => (
            <div key={concept.id || concept.concept_id || Math.random()} className="rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mt-0">{concept.concept_title || concept.title || "Untitled Concept"}</h2>
              <p className="text-gray-700 mt-2">{concept.concept_description || concept.description || "No description available."}</p>
              <p className="text-sm text-gray-500 mt-3"><span className="font-semibold">Genre:</span> {concept.concept_genre || concept.category || "Unknown"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SwipeviewPage