"use client";

import { Concept } from "@/app/_types/model/Concept";
import { supabase } from "@/lib/supabase";

type Props = {
  className?: string;
  concept: Concept;
}

const ProfileBookCard: React.FC<Props> = ({
  className = "",
  concept
}) => {

  const fallbackCoverUrl = '/covers/engineering.png';
  const bookCover = concept.concept_styling.book_cover;
  let coverUrl = fallbackCoverUrl;
  if (bookCover) {
    const isLocalPath = bookCover.startsWith('/');
    const isAbsoluteUrl = /^(https?:)?\/\//.test(bookCover);
    if (isLocalPath || isAbsoluteUrl) {
      coverUrl = bookCover;
    } else {
      const { data } = supabase.storage.from('book-covers').getPublicUrl(bookCover);
      coverUrl = data?.publicUrl ?? fallbackCoverUrl;
    }
  };

  return (
    <div className={`flex h-full w-[100%] shadow-md border border-gray-200 rounded-lg p-4 gap-4 hover:shadow-xl transition-all hover:bg-secondary/30 ${className}`}>
      <div className="flex-[2] bg-white shadow-md border border-gray-200 rounded-lg hover:shadow-xl transform transition hover:-translate-y-1">
        <img src={coverUrl} alt={`${concept.concept_title} Book Cover`} className="h-full w-full object-cover rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
      <div className="flex-[3] flex flex-col gap-2">
        <h3 className="text-xl font-bold">{concept.concept_title}</h3>
        <p className="text-md text-muted-foreground"><strong>Genre:</strong> {concept.concept_genre}</p>
        <p className="text-md text-muted-foreground -mb-2"><strong>Description:</strong></p>
        <div className="overflow-y-auto">
          <p className="text-md text-muted-foreground">{concept.concept_description}</p>
        </div>
      </div>
    </div>
  )
};

export default ProfileBookCard;