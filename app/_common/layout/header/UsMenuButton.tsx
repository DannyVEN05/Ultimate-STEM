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
import { useContext, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const UsMenuButton: React.FC = ({ }) => {
  const { user, logOut, disableUser } = useContext(AuthContext);

  const router = useRouter();
  const pathname = usePathname();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative h-12 w-12 rounded-full p-0 border-0 bg-gray-100 group cursor-pointer shadow-md hover:shadow-xl transition-shadow focus:outline-none"
        >
          <Avatar className="h-12 w-12">
            <AvatarImage alt="@username" />
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
          <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push("/profile")}>
            Profile
          </DropdownMenuItem>
          {pathname === "/profile" && (
            <>
              <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500 focus:font-bold" onSelect={(e: Event) => { e.preventDefault(); setConfirmOpen(true); }}>
                Delete Account
              </DropdownMenuItem>

              <Dialog open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) { setConfirmChecked(false); setDisableError(null); } }}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Delete account?</DialogTitle>
                    <DialogDescription>
                      This will disable your account. You will no longer be able to log in using your email <strong>{user?.user_email}</strong>. If you register again with this email, you may have the option to restore your previous account.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="px-6 py-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={confirmChecked}
                        onChange={(e) => setConfirmChecked(e.target.checked)}
                      />
                      <span className="text-sm">I understand the consequences of deleting my account.</span>
                    </label>
                    {disableError && (
                      <p className="mt-2 text-sm text-red-600">{disableError}</p>
                    )}
                  </div>

                  <DialogFooter className="gap-2 sm:gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="rounded-full">Cancel</Button>
                    </DialogClose>
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-full"
                      disabled={!confirmChecked || isDeleting}
                      onClick={async () => {
                        if (!confirmChecked || isDeleting) return;
                        setIsDeleting(true);
                        setDisableError(null);
                        const err = await disableUser();
                        setIsDeleting(false);
                        if (err) {
                          setDisableError(err);
                        } else {
                          setConfirmOpen(false);
                          setConfirmChecked(false);
                        }
                      }}
                    >
                      {isDeleting ? "Deleting…" : "Confirm"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={async (e) => {
            e.preventDefault();
            setLogoutError(null);
            const error = await logOut();
            if (error) {
              setLogoutError(error);
              return;
            }
            window.location.href = "/login";
          }}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
      <Dialog open={!!logoutError} onOpenChange={(open) => { if (!open) setLogoutError(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unable to log out</DialogTitle>
            <DialogDescription>{logoutError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-full">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DropdownMenu >
  )
};

export default UsMenuButton;
