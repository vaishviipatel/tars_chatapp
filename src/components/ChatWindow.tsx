"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatWindowProps {
  conversationId: Id<"conversations">;
  currentUserId: string;
  onBack: () => void;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (isThisYear) {
    return (
      date.toLocaleDateString([], { month: "short", day: "numeric" }) +
      ", " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } else {
    return (
      date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  onBack,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.messages.getMessages, { conversationId });
  const sendMessage = useMutation(api.messages.sendMessage);
  const setTyping = useMutation(api.typing.setTyping);
  const typingUsers = useQuery(api.typing.getTypingUsers, {
    conversationId,
    currentUserId,
  });
  const deleteMessage = useMutation(api.messages.deleteMessage);

  const allUsers = useQuery(api.users.getAllUsers, {
    currentClerkId: currentUserId,
  });

  const getUserName = (clerkId: string) => {
    if (clerkId === currentUserId) return "You";
    return allUsers?.find((u) => u.clerkId === clerkId)?.name || "Unknown";
  };

  // Auto scroll
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowNewMsg(false);
    } else {
      setShowNewMsg(true);
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setIsAtBottom(atBottom);
    if (atBottom) setShowNewMsg(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
    setShowNewMsg(false);
  };

const typingTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setTyping({ conversationId, userId: currentUserId });
    clearTimeout(typingTimeout.current);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage({
      conversationId,
      senderId: currentUserId,
      content: input.trim(),
    });
    setInput("");
    setIsAtBottom(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden text-gray-400 hover:text-white mr-2"
        >
          ← Back
        </button>
        <h2 className="text-white font-semibold">Conversation</h2>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages?.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-3xl mb-2">👋</p>
              <p>No messages yet. Say hello!</p>
            </div>
          </div>
        )}

        {messages?.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div
              key={msg._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className="group relative max-w-xs lg:max-w-md">
                {msg.isDeleted ? (
                  <p className="italic text-gray-500 text-sm px-4 py-2 bg-gray-800 rounded-2xl">
                    This message was deleted
                  </p>
                ) : (
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm ${
                      isMe
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-white"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isMe ? "text-blue-200" : "text-gray-400"
                      }`}
                    >
                      {formatTimestamp(msg.createdAt)}
                    </p>
                  </div>
                )}
                {isMe && !msg.isDeleted && (
                  <button
                    onClick={() => deleteMessage({ messageId: msg._id })}
                    className="absolute -top-2 -left-2 hidden group-hover:block text-xs bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers && typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-800 px-4 py-2 rounded-2xl">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* New messages button */}
      {showNewMsg && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm shadow-lg"
        >
          ↓ New messages
        </button>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-800 flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 flex-1"
        />
        <Button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Send
        </Button>
      </div>
    </div>
  );
}