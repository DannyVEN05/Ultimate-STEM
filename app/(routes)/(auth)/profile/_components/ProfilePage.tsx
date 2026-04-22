"use client";

import AuthContext from "@/app/_context/auth/AuthContext";
import { User } from "@/app/_types/model/User";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContext, useEffect, useState } from "react";

type ProfileFormState = {
  user_firstname: string;
  user_lastname: string;
  user_email: string;
  user_phone_number: string;
  user_dob: string;
};

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useContext(AuthContext);

  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<ProfileFormState>({
    user_firstname: "",
    user_lastname: "",
    user_email: "",
    user_phone_number: "",
    user_dob: "",
  });

  const toFormState = (currentUser: User | null): ProfileFormState => {
    return {
      user_firstname: currentUser?.user_firstname ?? "",
      user_lastname: currentUser?.user_lastname ?? "",
      user_email: currentUser?.user_email ?? "",
      user_phone_number: currentUser?.user_phone_number ?? "",
      user_dob: currentUser?.user_dob ? new Date(currentUser.user_dob).toISOString().slice(0, 10) : "",
    };
  };

  useEffect(() => {
    if (!editMode) {
      setFormState(toFormState(user));
    }
  }, [user, editMode]);

  const updateFormField = (field: keyof ProfileFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartEdit = () => {
    setFormState(toFormState(user));
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setFormState(toFormState(user));
    setEditMode(false);
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    setIsSaving(true);
    const error = await updateUser(
      new User(
        user.user_id,
        formState.user_firstname.trim(),
        formState.user_lastname.trim(),
        formState.user_email.trim(),
        formState.user_phone_number.trim(),
        formState.user_dob ? new Date(formState.user_dob) : null,
        user.user_created_at,
        user.user_role
      )
    );
    setIsSaving(false);

    if (!error) {
      setEditMode(false);
      return;
    }

    console.error("Failed to update profile:", error);
  };

  const BookCard = () => {
    return (
      <div className="relative flex h-full w-[100%] shadow-md border border-gray-200 rounded-lg p-4 gap-4 hover:shadow-xl transition-all hover:bg-secondary/30">
        <div className="absolute top-2 right-2">
          <Button variant="outline">
            Edit
          </Button>
        </div>
        <div className="flex-[4] bg-white shadow-md border border-gray-200 rounded-lg hover:shadow-xl transform transition hover:-translate-y-1">
          <img src="/covers/engineering.png" alt="Book Cover" className="h-full w-full object-cover rounded-lg" style={{ width: "100%", height: "100%" }} />
        </div>
        <div className="flex-[6] flex flex-col gap-2">
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
    <div className="mx-36 h-full flex flex-col min-h-0">

      <div className="flex gap-38 justify-center items-center mb-2">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-center pl-4 pr-1">My Profile</h1>
        </div>
        <div className="relative flex-[3]">
          <h1 className="text-3xl font-bold text-center px-5">My Submissions</h1>
          <div className="flex absolute top-1/2 -translate-y-1/2 right-4 justify-center items-center">
            <Button variant="secondary" className="">Submit a new idea</Button>
          </div>
        </div>
      </div>

      <div className="flex gap-38 h-full min-h-0">
        <div className="flex flex-col flex-1 pl-2">

          <div className="flex-[5] my-2 mr-2 ml-2 border border-gray-200 shadow-xs rounded-xl justify-between items-center flex flex-col p-4 bg-gradient-to-b from-secondary/50 to-white hover:from-secondary/70 hover:to-secondary/10 transition-colors hover:shadow-md">
            <p className="text-sm text-muted-foreground mt-2">User Since {user?.user_created_at?.toLocaleDateString()}</p>
            <Avatar className="h-32 w-32 shadow-md hover:shadow-lg transition-shadow">
              <AvatarImage alt="@username" />
              <AvatarFallback style={{ backgroundColor: "white", fontSize: 24 }}>{user?.user_firstname?.charAt(0)}{user?.user_lastname?.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="col-span-2 flex flex-col">
                <label htmlFor="user_firstname" className="ml-1 text-sm font-semibold">
                  First Name:
                </label>
                <Input
                  id="user_firstname"
                  className="bg-white text-sm"
                  value={formState.user_firstname}
                  onChange={(event) => updateFormField("user_firstname", event.target.value)}
                  disabled={!editMode || isSaving}
                />
              </div>
              <div className="col-span-2 flex flex-col">
                <label htmlFor="user_lastname" className="ml-1 text-sm font-semibold">
                  Last Name:
                </label>
                <Input
                  id="user_lastname"
                  className="bg-white text-sm"
                  value={formState.user_lastname}
                  onChange={(event) => updateFormField("user_lastname", event.target.value)}
                  disabled={!editMode || isSaving}
                />
              </div>
              <div className="col-span-2 flex flex-col">
                <label htmlFor="user_email" className="ml-1 text-sm font-semibold">
                  Email:
                </label>
                <Input
                  id="user_email"
                  className="bg-white text-sm"
                  value={formState.user_email}
                  onChange={(event) => updateFormField("user_email", event.target.value)}
                  // disabled={!editMode || isSaving}
                  disabled
                />
              </div>
              <div className="col-span-2 flex flex-col">
                <label htmlFor="user_phone_number" className="ml-1 text-sm font-semibold">
                  Phone Number:
                </label>
                <Input
                  id="user_phone_number"
                  className="bg-white text-sm"
                  value={formState.user_phone_number}
                  onChange={(event) => updateFormField("user_phone_number", event.target.value)}
                  // disabled={!editMode || isSaving}
                  disabled
                />
              </div>
              <div className="col-span-2 flex flex-col">
                <label htmlFor="user_dob" className="ml-1 text-sm font-semibold">
                  Date of Birth:
                </label>
                <Input
                  id="user_dob"
                  className="bg-white text-sm"
                  type="date"
                  value={formState.user_dob}
                  onChange={(event) => updateFormField("user_dob", event.target.value)}
                  disabled={!editMode || isSaving}
                />
              </div>
            </div>

            {!editMode ? (
              <Button
                variant="secondary"
                size="lg"
                className="w-[70%]"
                onClick={handleStartEdit}
                disabled={!user}
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            )}
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
          <div className={`h-full w-full rounded-lg px-4 grid grid-cols-6 auto-rows-[30%] gap-12 py-2 overflow-y-auto`}>
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