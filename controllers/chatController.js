const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');

// Start or Get existing chat
const getOrCreateChat = async (req, res) => {
    try {
        const { vendorId, vehicleId } = req.body;
        const customerId = req.user.userId;

        // Check if chat exists
        let chat = await Chat.findOne({
            customer: customerId,
            vendor: vendorId,
            vehicle: vehicleId
        })
            .populate('customer', 'name avatar')
            .populate('vendor', 'name avatar')
            .populate('vehicle', 'brand model images');

        if (!chat) {
            chat = await Chat.create({
                customer: customerId,
                vendor: vendorId,
                vehicle: vehicleId
            });
            chat = await chat.populate(['customer', 'vendor', 'vehicle']);
        }

        res.status(StatusCodes.OK).json({ chat });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const getMyChats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const query = {
            $or: [{ customer: userId }, { vendor: userId }]
        };

        const chats = await Chat.find(query)
            .populate('customer', 'name avatar')
            .populate('vendor', 'name avatar')
            .populate('vehicle', 'brand model images')
            .sort({ updatedAt: -1 });

        res.status(StatusCodes.OK).json({ chats });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await Message.find({ chat: chatId })
            .populate('sender', 'name avatar')
            .sort({ createdAt: 1 });

        res.status(StatusCodes.OK).json({ messages });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;
        const senderId = req.user.userId;

        const message = await Message.create({
            chat: chatId,
            sender: senderId,
            content
        });

        // Update last message in chat
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: {
                content,
                sender: senderId,
                timestamp: new Date()
            }
        });

        const fullMessage = await message.populate('sender', 'name avatar');

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(chatId).emit('new_message', fullMessage);
        }

        res.status(StatusCodes.CREATED).json({ message: fullMessage });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

module.exports = {
    getOrCreateChat,
    getMyChats,
    getMessages,
    sendMessage
};
