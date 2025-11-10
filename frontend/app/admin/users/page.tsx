"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteUser, getUsers } from "@/lib/apis";
import type { RootState } from "@/utils/state/store";
import { setCredentials, setUserAuthState, signOut } from "@/utils/slices/auth";
import { readAuthSession } from "@/utils/auth-storage";
import { useAppDispatch, useAppSelector } from "@/utils/state/hooks";
import { useRouter } from "next/navigation";
import Authorising from "@/components/application/authorising";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { AuthUser } from "@/lib/common.types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DeleteIcon, PlusIcon, Trash2Icon } from "lucide-react";


const UserList = () => {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state: RootState) => state.auth.session);
  const authState = useAppSelector((state: RootState) => state.auth.authState);
  const router = useRouter();

  const [ users, setUsers ] = useState<AuthUser[]>([]);

  useEffect(() => {
    if (!session) {
      const stored = readAuthSession();
      if (stored) {
        dispatch(setCredentials(stored));
      }
    }
  }, [session, dispatch]);

  useEffect(() => {
    if (session) {
      dispatch(setUserAuthState("authorized"));
      return;
    }

    const stored = readAuthSession();
    if (stored) {
      dispatch(setCredentials(stored));
      dispatch(setUserAuthState("authorized"));
      return;
    }

    dispatch(setUserAuthState("unauthorized"));
    router.replace("/login");
  }, [session, dispatch, router]);

  useEffect(() => {
    if(authState === 'authorized') {
      fetchUsersList();
    }
  }, [authState])

  const fetchUsersList = async () => {
    const users = await getUsers();
    if(users.success) {
      setUsers(users.data);

    }
  }

  if (authState !== "authorized") {
    return (
      <Authorising />
    )
  }

  const remove = async (id: number) => {
    await deleteUser(id);
    await fetchUsersList();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 px-4 md:px-16 py-16 dark:bg-black">
      <div className="mx-auto w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Admin console
            </p>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Users
            </h1>
          </div>          
        </div>

        <div className="mt-2.5 flex flex-col gap-2.5">
          {users && users.length ? (
            users.map((user) => {
              return (
                <Item key={user.id} variant={'outline'} className="dark:bg-black">
                  <ItemContent>
                    <ItemTitle>{user.username}</ItemTitle>
                    <ItemDescription>{user.email}</ItemDescription>
                    <ItemDescription className="text-xs">Created On: {formatDate(user?.created_at)}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button variant={'outline'} onClick={() => remove(user.id)}>Delete <Trash2Icon /></Button>
                  </ItemActions>
                </Item>
              )
            })
          ): null}
          <div className="mt-2.5">
            <Button variant={'outline'} onClick={() => router.push('/admin/users/add')}><PlusIcon /> Add User</Button>
          </div>
        </div>

        <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
          <p>
            Looking for the knowledge base instead?{" "}
            <Link
              href="/"
              className="font-semibold text-zinc-900 underline hover:text-zinc-700 dark:text-zinc-100"
            >
              Go back to the assistant.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserList;
