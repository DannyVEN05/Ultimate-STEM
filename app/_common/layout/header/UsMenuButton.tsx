"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AuthContext from "@/app/_context/auth/AuthContext";
import { useContext } from "react";
import { useRouter } from "next/navigation";

const UsMenuButton: React.FC = ({ }) => {
  const { user, logOut } = useContext(AuthContext);

  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative h-12 w-12 rounded-full p-0 border-0 bg-gray-100 group cursor-pointer shadow-md hover:shadow-xl transition-shadow focus:outline-none"
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src="" alt="@username" />
            <AvatarFallback style={{ backgroundColor: "transparent" }}>{user?.user_firstname?.charAt(0)}{user?.user_lastname?.charAt(0)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.user_firstname} {user?.user_lastname}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.user_email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="cursor-pointer">
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={logOut}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
};

export default UsMenuButton;
