"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface SidebarProps {
  currentUser: any;
  activeConversationId: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
}

export default function Sidebar({
  currentUser,
  activeConversationId,
  onSelectConversation,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const allUsers = useQuery(api.users.getAllUsers, {
    currentClerkId: currentUser.id,
  });
  const conversations = useQuery(api.conversations.getUserConversations, {
    clerkId: currentUser.id,
  });
  const getOrCreate = useMutation(api.conversations.getOrCreateConversation);

  const handleUserClick = async (otherClerkId: string) => {
    const convId = await getOrCreate({
      currentClerkId: currentUser.id,
      otherClerkId,
    });
    onSelectConversation(convId);
  };

  const filteredUsers = allUsers?.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 border-r border-gray-800 flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Tars Chat</h1>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>

      {/* Search */}
      <div className="p-3">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto">
        {search && (
          <div className="px-3 pb-2">
            <p className="text-xs text-gray-500 uppercase mb-2">Users</p>
            {filteredUsers?.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No users found
              </p>
            )}
            {filteredUsers?.map((u) => (
              <button
                key={u._id}
                onClick={() => handleUserClick(u.clerkId)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="relative">
                  <img
                    src={u.imageUrl || "/avatar.png"}
                    alt={u.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {u.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                  )}
                </div>
                <span className="text-white text-sm">{u.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Conversations */}
        {!search && (
          <div className="px-3">
            <p className="text-xs text-gray-500 uppercase mb-2 pt-2">
              Conversations
            </p>
            {conversations?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Search for a user to start chatting</p>
              </div>
            )}
            {conversations?.map((conv) => {
              const otherUserId = conv.participantIds.find(
                (id) => id !== currentUser.id
              );
              const otherUser = allUsers?.find(
                (u) => u.clerkId === otherUserId
              );
              return (
                <button
                  key={conv._id}
                  onClick={() => onSelectConversation(conv._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 ${
                    activeConversationId === conv._id
                      ? "bg-blue-600"
                      : "hover:bg-gray-800"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={otherUser?.imageUrl || "/avatar.png"}
                      alt={otherUser?.name || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {otherUser?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-white text-sm font-medium truncate">
                      {otherUser?.name || "Unknown"}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {conv.lastMessagePreview || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}