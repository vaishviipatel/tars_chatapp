import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const userTyping = existing.find((t) => t.userId === args.userId);

    if (userTyping) {
      await ctx.db.patch(userTyping._id, { timestamp: Date.now() });
    } else {
      await ctx.db.insert("typingIndicators", {
        ...args,
        timestamp: Date.now(),
      });
    }
  },
});

export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
    currentUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const twoSecondsAgo = Date.now() - 2000;
    return indicators.filter(
      (t) =>
        t.userId !== args.currentUserId && t.timestamp > twoSecondsAgo
    );
  },
});