"use client";

import useIsMobile from "@/utils/hooks/device.hook";
import { useAppDispatch, useAppSelector } from "@/utils/state/hooks";
import { RootState } from "@/utils/state/store";
import { useEffect } from "react";
import { clearAuthSession, readAuthSession } from "@/utils/auth-storage";
import { setCredentials, signOut } from "@/utils/slices/auth";
import { useRouter } from "next/navigation";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from "../ui/menubar";

const Navigation = () => {

  const isMobile = useIsMobile();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const session = useAppSelector((state: RootState) => state.auth.session);  

  useEffect(() => {
    if (!session) {
      const stored = readAuthSession();
      if (stored) {
        dispatch(setCredentials(stored));
      }
    } else {
      router.prefetch("/");
    }
  }, [session, dispatch, router]);

  const handleNavigation = (path: string) => {
    router.push(path);
  }

  const handleSignOut = () => {
    clearAuthSession();
    dispatch(signOut());
  };

  return (
    <div className="w-full fixed py-2.5 bg-zinc-50 dark:bg-black">
      <div className="container m-auto flex justify-center">
        <Menubar className="">
          <MenubarMenu>
            <MenubarTrigger  onClick={() => handleNavigation('/')}>Home</MenubarTrigger>
          </MenubarMenu>          
          <MenubarMenu>
            <MenubarTrigger>Admin</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => handleNavigation('/admin/files')}>Files</MenubarItem>
              <MenubarSub>
                <MenubarSubTrigger>Manager Users</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={() => handleNavigation('/admin/users')}>List Users</MenubarItem>
                  <MenubarSeparator /> 
                  <MenubarItem onClick={() => handleNavigation('/admin/users/add')}>Add Users</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
          {session?.user?.username ? (
            <MenubarMenu>
              <MenubarTrigger className="text-sm italic">Hi, {session?.user?.username}</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => handleSignOut()}>Sign Out</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          ): null}
        </Menubar>
      </div>
    </div>
  )
}

export default Navigation; 
