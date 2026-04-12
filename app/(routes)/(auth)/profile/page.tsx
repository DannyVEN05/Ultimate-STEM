import { Metadata, NextPage } from "next";
import ProfilePage from "./_components/ProfilePage";

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your profile information on the Ultimate STEM platform",
};

const Profile: NextPage = () => {
  return <ProfilePage />;
};

export default Profile;