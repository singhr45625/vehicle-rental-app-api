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

const setNegotiatedPrice = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { price } = req.body;
        const vendorId = req.user.userId;

        // Verify that the user is indeed the vendor of this chat
        const chat = await Chat.findOne({ _id: chatId, vendor: vendorId });
        if (!chat) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Not authorized to negotiate for this chat" });
        }

        chat.negotiation = {
            price: Number(price),
            status: 'active',
            lastUpdated: new Date()
        };
        await chat.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(chatId).emit('negotiation_update', chat.negotiation);
        }

        // Also send a system message
        const message = await Message.create({
            chat: chatId,
            sender: vendorId,
            content: `OFFER: I have offered a special price of ₹${price}/day for this vehicle.`,
            isSystem: true // You might want to handle this flag in Message schema or just treat as normal text
        });

        // Update last message in chat
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: {
                content: message.content,
                sender: vendorId,
                timestamp: new Date()
            }
        });

        res.status(StatusCodes.OK).json({ chat, message });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

module.exports = {
    getOrCreateChat,
    getMyChats,
    getMessages,
    sendMessage,
    setNegotiatedPrice
};
