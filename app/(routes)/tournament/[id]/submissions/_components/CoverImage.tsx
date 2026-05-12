import { BookCover } from "@/app/_types/model/Concept";
import { supabase } from "@/lib/supabase";
import { useMemo } from "react";

interface CoverImageProps {
  title: string,
  styling: BookCover
}

const CoverImage: React.FC<CoverImageProps> = ({
  title,
  styling,
}) => {

  let coverUrl = useMemo(() => {
    return supabase.storage.from('book-covers').getPublicUrl(styling.book_cover).data.publicUrl || '/covers/engineering.png';
  }, [styling.book_cover]);

  return (
    <img src={coverUrl} alt={`${title} cover`} className={`h-full object-fill w-full bg-white shadow-md rounded-lg hover:shadow-xl transform transition`}></img>
  );
}

export default CoverImage;