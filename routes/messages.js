const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware.js');
const User = require('../models/users');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');


function createConversationId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
}

router.get('/', isLoggedIn, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
        .populate('participants', 'fullName username')
        .populate('village', 'name')
        .sort({ lastMessageAt: -1 });

        // Get unread count for each conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    conversationId: conv.conversationId,
                    receiver: req.user._id,
                    isRead: false
                });
                return {
                    ...conv.toObject(),
                    unreadCount
                };
            })
        );

        res.render('messages/inbox.ejs', {
            conversations: conversationsWithUnread,
            currentUser: req.user
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        req.flash('error', 'Error loading messages');
        res.redirect('/');
    }
});

// Get chat with specific user
router.get('/chat/:userId', isLoggedIn, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if other user exists and is in same village
        const otherUser = await User.findById(userId);
        if (!otherUser) {
            req.flash('error', 'User not found');
            return res.redirect('/messages');
        }

        // Verify both users are in the same village
        if (req.user.village.toString() !== otherUser.village.toString()) {
            req.flash('error', 'You can only message users from your village');
            return res.redirect('/messages');
        }

        const conversationId = createConversationId(req.user._id, userId);

        // Get or create conversation
        let conversation = await Conversation.findOne({ conversationId });
        if (!conversation) {
            conversation = await Conversation.create({
                conversationId,
                participants: [req.user._id, userId],
                village: req.user.village
            });
        }

        // Get all messages in conversation
        const messages = await Message.find({ conversationId })
            .populate('sender', 'fullName username')
            .sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            {
                conversationId,
                receiver: req.user._id,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.render('messages/chat.ejs', {
            messages,
            otherUser,
            currentUser: req.user,
            conversationId
        });
    } catch (error) {
        console.error('Error loading chat:', error);
        req.flash('error', 'Error loading chat');
        res.redirect('/messages');
    }
});

// Send Message
router.post('/send/:userId', isLoggedIn, async (req, res) => {
    try {
        const { userId } = req.params;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        // Verify other user exists and is in same village
        const otherUser = await User.findById(userId);
        if (!otherUser || req.user.village.toString() !== otherUser.village.toString()) {
            return res.status(403).json({ error: 'Cannot send message to this user' });
        }

        const conversationId = createConversationId(req.user._id, userId);

        // Create message
        const message = await Message.create({
            conversationId,
            sender: req.user._id,
            receiver: userId,
            village: req.user.village,
            content: content.trim()
        });

        // Update conversation
        await Conversation.findOneAndUpdate(
            { conversationId },
            {
                lastMessage: content.trim(),
                lastMessageAt: new Date()
            },
            { upsert: true }
        );

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'fullName username');

        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error sending message' });
    }
});

// Get new messages (for polling)
router.get('/new/:conversationId/:lastMessageId', isLoggedIn, async (req, res) => {
    try {
        const { conversationId, lastMessageId } = req.params;
        const query = { conversationId };

        if (lastMessageId !== 'null') {
            const lastMessage = await Message.findById(lastMessageId);
            if (lastMessage) {
                query.createdAt = { $gt: lastMessage.createdAt };
            }
        }

        const newMessages = await Message.find(query)
            .populate('sender', 'fullName username')
            .sort({ createdAt: 1 });

        await Message.updateMany(
            {
                conversationId,
                receiver: req.user._id,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({ messages: newMessages });
    } catch (error) {
        console.error('Error fetching new messages:', error);
        res.status(500).json({ error: 'Error fetching messages' });
    }
});
// Delete Message
router.delete('/:messageId', isLoggedIn, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await message.deleteOne();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Error deleting message' });
    }
});

module.exports = router;