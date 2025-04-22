import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useMemo } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { users } = useChatStore();

  // Find the selectedUser in the users list to get lastSeen
  const sidebarUser = useMemo(() => users.find(u => u._id === selectedUser._id), [users, selectedUser]);

  // Format last seen (e.g., 'last seen today at 14:30')
  function formatLastSeen(date) {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `last seen today at ${time}`;
    return `last seen on ${d.toLocaleDateString()} at ${time}`;
  }

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id)
                ? "Online"
                : formatLastSeen(sidebarUser?.lastSeen) || "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
