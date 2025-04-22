import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async (options = {}) => {
    const silent = options.silent;
    if (!silent) set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      if (!silent) set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
      // Update users list for real-time sidebar sorting (silent, no flicker)
      await get().getUsers({ silent: true });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", async (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (isMessageSentFromSelectedUser) {
        set({ messages: [...get().messages, newMessage] });
        // Mark as read immediately and refresh users list (silent)
        try {
          await axiosInstance.post(`/messages/mark-read/${selectedUser._id}`);
          await get().getUsers({ silent: true });
        } catch {}
        return;
      }
      // If message is from another user, refresh users list for unread badge (silent)
      get().getUsers({ silent: true });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: async (selectedUser) => {
    set({ selectedUser });
    if (selectedUser) {
      try {
        await axiosInstance.post(`/messages/mark-read/${selectedUser._id}`);
        // Refresh users list to update unread counts (silent)
        await get().getUsers({ silent: true });
      } catch (error) {
        // Optionally handle error
      }
    }
  },
}));
