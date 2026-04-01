"use client";

import AuthContext from "@/app/_context/auth/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useContext } from "react";

const ProfilePage: React.FC = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="-mx-4 relative min-h-full">
      <div className="absolute -top-4 left-0 right-0 -bottom-4 bg-gradient-to-b from-gray-100/80 to-transparent -z-10" />
      <div className="px-4 min-h-full">

        <div className="flex gap-4">
          <div className="flex flex-col flex-1">
            <div className="relative flex-2 m-2 border border-gray-200 shadow-xs rounded-xl justify-center items-center flex flex-col p-4 bg-gradient-to-b from-secondary/50 to-white hover:from-secondary/70 hover:to-secondary/10 transition-colors hover:shadow-md">
              {user?.user_dob && (
                <div className="absolute top-2 left-2 rounded-full h-16 w-16 flex justify-center items-center bg-tertiary/40 border-b-3 border-tertiary/20 text-tertiary-foreground shadow-xl hover:bg-tertiary/60 transition-colors">
                  <p className="text-sm">{Math.floor((new Date().getTime() - new Date(user.user_dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} y/o</p>
                </div>
              )}
              <Avatar className="h-32 w-32 shadow-md hover:shadow-lg transition-shadow">
                <AvatarImage src="" alt="@username" />
                <AvatarFallback style={{ backgroundColor: "white", fontSize: 24 }}>{user?.user_firstname?.charAt(0)}{user?.user_lastname?.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold mt-2">{user?.user_firstname} {user?.user_lastname}</h2>
              <p className="text-sm text-muted-foreground">{user?.user_email}</p>
              <p className="text-sm text-muted-foreground mt-2">User Since {user?.user_created_at.toLocaleDateString()}</p>
              <Button variant="secondary" size="lg" className="w-[70%] mt-1">
                Edit Profile
              </Button>
            </div>
            <div className="flex flex-1 m-2 p-4 gap-4">
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
          <div className="flex-3 flex flex-col items-center p-4 gap-2">
            <h1 className="text-3xl font-bold">My Submissions</h1>
            <p className="text-muted-foreground">
              You currently have no submissions.
            </p>
            <p className="text-muted-foreground text-[12px] mt-20">
              (The books will be listed here - possibly in a grid)
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;