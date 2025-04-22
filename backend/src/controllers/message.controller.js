import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    // For each user, get last message and unread count
    const usersWithMeta = await Promise.all(
      users.map(async (user) => {
        // Find the latest message between loggedInUser and this user
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();

        // Count unread messages from this user to loggedInUser
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          read: false,
        });

        return {
          ...user.toObject(),
          lastMessage,
          unreadCount,
          lastSeen: user.lastSeen,
        };
      })
    );

    res.status(200).json(usersWithMeta);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let delivered = false;
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      delivered = true;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      delivered,
    });

    await newMessage.save();

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    // Emit delivered event to sender
    io.to(getReceiverSocketId(senderId))?.emit("messageDelivered", { messageId: newMessage._id });

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { userId } = req.params; // userId is the sender whose messages should be marked as read
    const myId = req.user._id;
    await Message.updateMany(
      { senderId: userId, receiverId: myId, read: false },
      { $set: { read: true, seen: true } }
    );
    // Notify sender that messages are seen
    const senderSocketId = getReceiverSocketId(userId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", { by: myId });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in markMessagesAsRead: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
