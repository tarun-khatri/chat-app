import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [localMessages, setLocalMessages] = useState([]);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    // Delivered tick
    socket.on("messageDelivered", ({ messageId }) => {
      setLocalMessages((msgs) =>
        msgs.map((msg) =>
          msg._id === messageId ? { ...msg, delivered: true } : msg
        )
      );
    });
    // Seen tick
    socket.on("messagesSeen", () => {
      setLocalMessages((msgs) =>
        msgs.map((msg) =>
          msg.senderId === authUser._id ? { ...msg, seen: true } : msg
        )
      );
    });
    return () => {
      socket.off("messageDelivered");
      socket.off("messagesSeen");
    };
  }, [authUser._id]);

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {localMessages.map((message) => {
          const isMine = message.senderId === authUser._id;
          return (
            <div
              key={message._id}
              className={`chat ${isMine ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className=" chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isMine
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1 flex items-center gap-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
                {isMine && (
                  <span className="ml-1">
                    {message.seen ? (
                      <CheckCheck className="w-4 h-4 text-blue-500 inline" />
                    ) : message.delivered ? (
                      <CheckCheck className="w-4 h-4 text-zinc-400 inline" />
                    ) : (
                      <Check className="w-4 h-4 text-zinc-400 inline" />
                    )}
                  </span>
                )}
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
