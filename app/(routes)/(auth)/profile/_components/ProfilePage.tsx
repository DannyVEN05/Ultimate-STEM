"use client";

import AuthContext from "@/app/_context/auth/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useContext } from "react";

const ProfilePage: React.FC = () => {
  const { user } = useContext(AuthContext);

  const BookCard = () => {
    return (
      <div className="relative flex h-full w-full bg-secondary/30 shadow-md border border-gray-200 rounded-lg p-4 gap-4 hover:shadow-xl transition-all hover:bg-secondary/50">
        <div className="absolute top-2 right-2">
          <Button variant="outline" className="h-8 w-8 p-0 rounded-full">
            Edit
          </Button>
        </div>
        <div className="flex-1 bg-white shadow-md border border-gray-200 rounded-lg hover:shadow-xl transform transition hover:-translate-y-1"></div>
        <div className="flex-1 flex flex-col gap-2">
          <h3 className="text-xl font-bold">{`{Book Title}`}</h3>
          <p className="text-md text-muted-foreground"><strong>Genre:</strong> Fiction</p>
          <p className="text-md text-muted-foreground -mb-2"><strong>Description:</strong></p>
          <div className="overflow-y-auto">
            <p className="text-md text-muted-foreground">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 h-full flex flex-col min-h-0">

      <div className="flex gap-4 justify-center items-center mb-2">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-center">My Profile</h1>
        </div>
        <div className="relative flex-[3]">
          <h1 className="text-3xl font-bold text-center">My Submissions</h1>
          <div className="flex absolute top-1/2 -translate-y-1/2 right-0 justify-center items-center">
            <Button variant="secondary" className="">Submit a new idea</Button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 h-full min-h-0">
        <div className="flex flex-col flex-1">
          <div className="flex-[5] m-2 border border-gray-200 shadow-xs rounded-xl justify-center items-center flex flex-col p-4 bg-gradient-to-b from-secondary/50 to-white hover:from-secondary/70 hover:to-secondary/10 transition-colors hover:shadow-md">
            <Avatar className="h-32 w-32 shadow-md hover:shadow-lg transition-shadow">
              <AvatarImage alt="@username" />
              <AvatarFallback style={{ backgroundColor: "white", fontSize: 24 }}>{user?.user_firstname?.charAt(0)}{user?.user_lastname?.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold mt-2">{user?.user_firstname} {user?.user_lastname}</h2>
            <p className="text-sm text-muted-foreground">{user?.user_email}</p>
            <p className="text-sm text-muted-foreground mt-2">User Since {user?.user_created_at?.toLocaleDateString()}</p>
            <Button variant="secondary" size="lg" className="w-[70%] mt-1">
              Edit Profile
            </Button>
          </div>
          <div className="flex flex-1 m-2 gap-4">
            <div className="flex-1 bg-tertiary/20 p-6 shadow-md rounded-xl border-b-4 border-tertiary/50 hover:bg-tertiary/30 transition-colors hover:shadow-xl">
              <span className="text-xs font-bold uppercase tracking-widest">Global Rank</span>
              <div className="text-3xl font-headline font-bold mt-1">#1</div>
            </div>
            <div className="flex-1 bg-primary/20 p-6 shadow-md rounded-xl border-b-4 border-primary/50 hover:bg-primary/30 transition-colors hover:shadow-xl">
              <span className="text-xs font-bold uppercase tracking-widest">Total Wins</span>
              <div className="text-3xl font-headline font-bold mt-1">1</div>
            </div>
          </div>
        </div>
        <div className="flex-[3] flex flex-col items-center gap-2 min-h-0">
          <div className={`h-full w-full rounded-xl border border-gray-100 shadow-[inset_0_3px_10px_0_rgba(0,0,0,0.5)] grid grid-cols-6 auto-rows-[60%] gap-4 m-2 p-8 overflow-y-auto`}>
            <div className={`col-span-3`}><BookCard /></div>
            <div className={`col-span-3`}><BookCard /></div>
            <div className={`col-span-3`}><BookCard /></div>
            <div className={`col-span-3`}><BookCard /></div>
            <div className={`col-span-3`}><BookCard /></div>
            <div className={`col-span-3`}><BookCard /></div>
            <div className={`col-span-3`}><BookCard /></div>
            <div className={`col-span-3`}><BookCard /></div>
            <div className={`col-span-3`}><BookCard /></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;