"use client";

import { activeProfile, useAppData } from "@/lib/store";
import { ProfilePicker } from "./ProfilePicker";
import { TableMap } from "./TableMap";
import { Splash } from "./ui";

export function HomeScreen() {
  const data = useAppData();
  if (!data) return <Splash />;

  const profile = activeProfile(data);
  return profile ? (
    <TableMap profile={profile} />
  ) : (
    <ProfilePicker profiles={data.profiles} />
  );
}
