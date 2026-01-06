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
        console.log('=== INBOX ROUTE ===');
        console.log('User ID:', req.user._id);
        console.log('User Object:', req.user);
        
        const conversations = await Conversation.find({
            participants: req.user._id
        })
        .populate('participants', 'fullName username')
        .populate('village', 'name')
        .sort({ lastMessageAt: -1 });

        console.log('Conversations Found:', conversations.length);

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
            currentUser: req.user, // ⭐ Explicitly passing
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        req.flash('error', 'Error loading messages');
        res.redirect('/villages/all');
    }
});

// Get chat with specific user
router.get('/chat/:userId', isLoggedIn, async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log('=== CHAT ROUTE ===');
        console.log('Target User ID:', userId);
        console.log('Current User ID:', req.user._id);
        
        // Validate userId format
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            req.flash('error', 'Invalid user ID');
            return res.redirect('/messages');
        }
        
        // Check if other user exists
        const otherUser = await User.findById(userId);
        if (!otherUser) {
            req.flash('error', 'User not found');
            return res.redirect('/messages');
        }

        console.log('Other User:', otherUser.fullName);

        // ⭐ FIX: Get village IDs properly - handle both object and ObjectId
        const currentUserVillageId = req.user.village._id 
            ? req.user.village._id.toString()  // If populated (object)
            : req.user.village.toString();      // If not populated (ObjectId)
            
        const otherUserVillageId = otherUser.village._id 
            ? otherUser.village._id.toString()  // If populated (object)
            : otherUser.village.toString();      // If not populated (ObjectId)
        
        console.log('Current User Village ID:', currentUserVillageId);
        console.log('Other User Village ID:', otherUserVillageId);

        // Verify both users are in the same village
        if (currentUserVillageId !== otherUserVillageId) {
            console.log('Village mismatch - users in different villages');
            req.flash('error', 'You can only message users from your village');
            return res.redirect('/messages');
        }

        const conversationId = createConversationId(req.user._id, userId);

        // Get or create conversation - use the extracted village ID
        let conversation = await Conversation.findOne({ conversationId });
        if (!conversation) {
            conversation = await Conversation.create({
                conversationId,
                participants: [req.user._id, userId],
                village: currentUserVillageId  // ⭐ Use extracted ID
            });
        }

        // Get all messages
        const messages = await Message.find({ conversationId })
            .populate('sender', 'fullName username')
            .sort({ createdAt: 1 });

        // Mark received messages as read
        await Message.updateMany(
            {
                conversationId,
                receiver: req.user._id,
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        console.log('Chat loaded successfully!');
        console.log('Messages count:', messages.length);

        res.render('messages/chat.ejs', {
            messages,
            otherUser,
            currentUser: req.user,
            conversationId,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error loading chat:', error);
        console.error('Stack:', error.stack);
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
            return res.status(400).json({ 
                success: false, 
                error: 'Message cannot be empty' 
            });
        }

        // Verify other user exists and is in same village
        const otherUser = await User.findById(userId);
        if (!otherUser) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // ⭐ FIX: Same village ID extraction logic
        const currentUserVillageId = req.user.village._id 
            ? req.user.village._id.toString()
            : req.user.village.toString();
            
        const otherUserVillageId = otherUser.village._id 
            ? otherUser.village._id.toString()
            : otherUser.village.toString();

        if (currentUserVillageId !== otherUserVillageId) {
            return res.status(403).json({ 
                success: false, 
                error: 'Cannot send message to this user' 
            });
        }

        const conversationId = createConversationId(req.user._id, userId);

        // Create message
        const message = await Message.create({
            conversationId,
            sender: req.user._id,
            receiver: userId,
            village: currentUserVillageId,  // ⭐ Use extracted ID
            content: content.trim(),
            isRead: false
        });

        // Update or create conversation
        await Conversation.findOneAndUpdate(
            { conversationId },
            {
                $set: {
                    conversationId,
                    participants: [req.user._id, userId],
                    village: currentUserVillageId,  // ⭐ Use extracted ID
                    lastMessage: content.trim(),
                    lastMessageAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'fullName username');

        // ⭐ EMIT SOCKET EVENT - Real-time delivery
        const io = req.app.get('io');
        io.to(conversationId).emit('new-message', {
            message: populatedMessage,
            conversationId
        });

        res.json({ 
            success: true, 
            message: populatedMessage 
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error sending message' 
        });
    }
});

// Get new messages (for polling) - FIXED
router.get('/new/:conversationId/:lastMessageId', isLoggedIn, async (req, res) => {
    try {
        const { conversationId, lastMessageId } = req.params;
        
        let query = { 
            conversationId,
            receiver: req.user._id  // Only get messages sent TO current user
        };

        // If we have a lastMessageId, only get newer messages
        if (lastMessageId && lastMessageId !== 'null') {
            const lastMessage = await Message.findById(lastMessageId);
            if (lastMessage) {
                query.createdAt = { $gt: lastMessage.createdAt };
            }
        }

        const newMessages = await Message.find(query)
            .populate('sender', 'fullName username')
            .sort({ createdAt: 1 });

        // Mark new messages as read
        if (newMessages.length > 0) {
            const messageIds = newMessages.map(msg => msg._id);
            await Message.updateMany(
                {
                    _id: { $in: messageIds },
                    isRead: false
                },
                {
                    $set: {
                        isRead: true,
                        readAt: new Date()
                    }
                }
            );
        }

        res.json({ 
            success: true,
            messages: newMessages 
        });
    } catch (error) {
        console.error('Error fetching new messages:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error fetching messages' 
        });
    }
});

// Check message status updates (for read receipts)
router.get('/status/:conversationId/:messageIds', isLoggedIn, async (req, res) => {
    try {
        const { conversationId, messageIds } = req.params;
        const ids = messageIds.split(',');

        const messages = await Message.find({
            _id: { $in: ids },
            conversationId,
            sender: req.user._id
        }).select('_id isRead readAt');

        res.json({ 
            success: true,
            messages 
        });
    } catch (error) {
        console.error('Error checking message status:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error checking status' 
        });
    }
});

// Delete Message
router.delete('/:messageId', isLoggedIn, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        
        if (!message) {
            return res.status(404).json({ 
                success: false,
                error: 'Message not found' 
            });
        }

        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                error: 'Unauthorized' 
            });
        }

        await message.deleteOne();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error deleting message' 
        });
    }
});
router.post('/messages/:messageId/read', async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.messageId,
            { isRead: true },
            { new: true }
        ).populate('sender');
        
        // Emit socket event for real-time update
        io.to(message.conversation).emit('message-read', {
            messageId: message._id,
            conversationId: message.conversation
        });
        
        res.json({ success: true, message });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;