import {create} from "zustand"

import toast from "react-hot-toast"
import { axiosInstance } from "../lib/axios"

export const useChatStore = create((set)=>({
    messages: [],
    users: [],
    selectesUser: null,
    isuserLoading: false,
    isMessagesLoading: false,


    getUsers: async () => {
        set({isuserLoading: true})
        try {
            const res = await axiosInstance.get("/messages/users");
            set({users: res.data});

        } catch (error) {
            toast.error(error.reponse.data.message);
        } finally{
            set({isMessagesLoading: false})
        }
    },

    getMessages: async (userId) => {
        set({isMessagesLoading: true})
        try {
            const res = await axiosInstance.get(`/messages/${userId}`)
            set({messages: res.data});

        } catch (error) {
            toast.error(error.reponse.data.message)
        } finally{
            set({isMessagesLoading: false})
        }
    },

    setSelectedUser: (selectesUser) => ({
        selectesUser
    })
}))