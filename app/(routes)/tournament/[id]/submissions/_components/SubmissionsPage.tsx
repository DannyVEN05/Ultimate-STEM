"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import GridViewPage from "./GridViewPage";
import SwipeViewPage from "./SwipeViewPage";
import BookContext from "@/app/_context/book/BookContext";
import { supabase } from "@/lib/supabase";

const SubmissionsPage = () => {
  const { isGridMode, setIsGridMode } = useContext(BookContext);
  const router = useRouter();
  const [ title, setTitle ] = useState("");
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    const fetchTournamentTitle = async () => {
      const { data, error } = await supabase
        .from("tournament")
        .select("tournament_title")
        .eq("tournament_id", id)
        .single();

      if (error) {
        console.warn("Error fetching tournament title: ", error);
        setTitle("Tournament Submissions");
      }

      if (data) setTitle(data.tournament_title);
    }
    if (id) fetchTournamentTitle();
  },[id]);

  return (
    <div className="flex w-full flex-col items-center font-bold">
      <h1 className="mb-5 text-4xl">{title}</h1>
      <div className="flex w-full justify-center">
        <UsButton variant="blue" onClick={() => {router.push("/bookbuilder")}}>
          Submit a Book
        </UsButton>
        <UsButton className="ml-auto" variant="blue" onClick={() => {setIsGridMode(!isGridMode)}}>
          {isGridMode ? "Swipe Mode" : "Grid Mode"}
        </UsButton>
      </div>
      {isGridMode ? (
        <GridViewPage/>
      ): (
        <SwipeViewPage/>
      )}
    </div>
  )
};

export default SubmissionsPage;