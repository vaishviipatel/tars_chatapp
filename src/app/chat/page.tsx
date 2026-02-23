"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
  const { user } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);
  const setOnlineStatus = useMutation(api.users.setOnlineStatus);
  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(null);

  useEffect(() => {
    if (!user) return;
    upsertUser({
      clerkId: user.id,
      name: user.fullName || user.username || "Anonymous",
      email: user.emailAddresses[0]?.emailAddress || "",
      imageUrl: user.imageUrl || "",
    });

    setOnlineStatus({ clerkId: user.id, isOnline: true });

    const handleOffline = () =>
      setOnlineStatus({ clerkId: user.id, isOnline: false });

    window.addEventListener("beforeunload", handleOffline);
    return () => {
      handleOffline();
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar
        currentUser={user}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
      />
      <div className="flex-1">
        {activeConversationId ? (
          <ChatWindow
            conversationId={activeConversationId}
            currentUserId={user.id}
            onBack={() => setActiveConversationId(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-2xl mb-2">💬</p>
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}