import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateConversation = mutation({
  args: {
    currentClerkId: v.string(),
    otherClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversations")
      .collect();

    const found = existing.find(
      (c) =>
        c.participantIds.includes(args.currentClerkId) &&
        c.participantIds.includes(args.otherClerkId)
    );

    if (found) return found._id;

    return await ctx.db.insert("conversations", {
      participantIds: [args.currentClerkId, args.otherClerkId],
      lastMessageTime: Date.now(),
      lastMessagePreview: "",
    });
  },
});

export const getUserConversations = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("conversations").collect();
    return all
      .filter((c) => c.participantIds.includes(args.clerkId))
      .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  },
});