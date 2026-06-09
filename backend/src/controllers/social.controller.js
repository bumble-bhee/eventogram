const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// TOGGLE LIKE (like if not liked, unlike if already liked)
const toggleLike = async (req, res) => {
  try {
    const mediaId = parseInt(req.params.mediaId);
    const userId = req.user.id;

    const existingLike = await prisma.like.findUnique({
      where: { userId_mediaId: { userId, mediaId } }
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { userId_mediaId: { userId, mediaId } }
      });
      return res.json({ message: 'Unliked successfully', liked: false });
    }

    // Like
    await prisma.like.create({ data: { userId, mediaId } });

    // Send notification to media owner
    // Only notify if this is a new like (not an unlike)
    // Also add a small delay check — if liked within 5 seconds, don't notify
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { uploaderId: true, title: true }
    });

    if (media && media.uploaderId !== userId) {
      // Check if notification already exists recently (within 1 hour)
      const recentNotif = await prisma.notification.findFirst({
        where: {
          type: 'LIKE',
          receiverId: media.uploaderId,
          triggererId: userId,
          mediaId,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
        }
      });

      if (!recentNotif) {
        await prisma.notification.create({
          data: {
            type: 'LIKE',
            message: `${req.user.name} liked your photo`,
            receiverId: media.uploaderId,
            triggererId: userId,
            mediaId
          }
        });

        const io = req.app.get('io');
        io.to(`user_${media.uploaderId}`).emit('notification', {
          type: 'LIKE',
          message: `${req.user.name} liked your photo`,
          mediaId
        });
      }
    }

    res.json({ message: 'Liked successfully', liked: true });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADD COMMENT
const addComment = async (req, res) => {
  try {
    const mediaId = parseInt(req.params.mediaId);
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        userId: req.user.id,
        mediaId
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    const io = req.app.get('io');

    // Notify media owner
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { uploaderId: true }
    });

    if (media && media.uploaderId !== req.user.id) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT',
          message: `${req.user.name} commented on your photo`,
          receiverId: media.uploaderId,
          triggererId: req.user.id,
          mediaId
        }
      });
      io.to(`user_${media.uploaderId}`).emit('notification', {
        type: 'COMMENT',
        message: `${req.user.name} commented on your photo`
      });
    }

    // Handle @mentions — find all @Name patterns in comment
    // Match @username (no spaces, underscore allowed)
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = [...text.matchAll(mentionRegex)].map(m => m[1]);

    console.log('Found mentions:', mentions);

    for (const mentionedUsername of mentions) {
      const mentionedUser = await prisma.user.findFirst({
        where: { username: { equals: mentionedUsername, mode: 'insensitive' } }
      });

      console.log('Looking for username:', mentionedUsername, '→ found:', mentionedUser?.name);

      if (mentionedUser && mentionedUser.id !== req.user.id) {
        await prisma.notification.create({
          data: {
            type: 'TAG',
            message: `${req.user.name} mentioned you in a comment: "${text.substring(0, 50)}..."`,
            receiverId: mentionedUser.id,
            triggererId: req.user.id,
            mediaId
          }
        });
        io.to(`user_${mentionedUser.id}`).emit('notification', {
          type: 'TAG',
          message: `${req.user.name} mentioned you in a comment`
        });
      }
    }

    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE COMMENT
const deleteComment = async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// TOGGLE FAVOURITE
const toggleFavourite = async (req, res) => {
  try {
    const mediaId = parseInt(req.params.mediaId);
    const userId = req.user.id;

    const existing = await prisma.favourite.findUnique({
      where: { userId_mediaId: { userId, mediaId } }
    });

    if (existing) {
      await prisma.favourite.delete({
        where: { userId_mediaId: { userId, mediaId } }
      });
      return res.json({ message: 'Removed from favourites', favourited: false });
    }

    await prisma.favourite.create({ data: { userId, mediaId } });
    res.json({ message: 'Added to favourites', favourited: true });
  } catch (error) {
    console.error('Favourite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// TAG A USER IN PHOTO
const tagUser = async (req, res) => {
  try {
    const mediaId = parseInt(req.params.mediaId);
    const { userId: taggedUserId } = req.body;

    if (!taggedUserId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const existing = await prisma.mediaTag.findUnique({
      where: { mediaId_userId: { mediaId, userId: parseInt(taggedUserId) } }
    });

    if (existing) {
      return res.status(400).json({ message: 'User already tagged in this photo' });
    }

    const tag = await prisma.mediaTag.create({
      data: { mediaId, userId: parseInt(taggedUserId) }
    });

    // Notify tagged user
    await prisma.notification.create({
      data: {
        type: 'TAG',
        message: `${req.user.name} tagged you in a photo`,
        receiverId: parseInt(taggedUserId),
        triggererId: req.user.id,
        mediaId
      }
    });

    const io = req.app.get('io');
    io.to(`user_${taggedUserId}`).emit('notification', {
      type: 'TAG',
      message: `${req.user.name} tagged you in a photo`,
      mediaId
    });

    res.status(201).json({ message: 'User tagged successfully', tag });
  } catch (error) {
    console.error('Tag error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET LIKES FOR A MEDIA
const getMediaLikes = async (req, res) => {
  try {
    const mediaId = parseInt(req.params.mediaId);
    const likes = await prisma.like.findMany({
      where: { mediaId },
      include: { user: { select: { id: true, name: true } } }
    });
    res.json({ count: likes.length, likes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET COMMENTS FOR A MEDIA
const getMediaComments = async (req, res) => {
  try {
    const mediaId = parseInt(req.params.mediaId);
    const comments = await prisma.comment.findMany({
      where: { mediaId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ count: comments.length, comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DOWNLOAD MEDIA
// DOWNLOAD MEDIA WITH WATERMARK
const downloadMedia = async (req, res) => {
  try {
    const mediaId = parseInt(req.params.mediaId);

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        event: { select: { title: true } },
        uploadedBy: { select: { name: true } }
      }
    });

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Only watermark photos, not videos
    if (media.type === 'VIDEO') {
      return res.json({ url: media.url });
    }

    // Build watermark text
    const watermarkText = `${media.event.title} | ${req.user.name} (${req.user.role})`;
    console.log('Adding watermark:', watermarkText);

    const { addWatermark } = require('../services/watermark.service');

    // Increment download count
    await prisma.media.update({
      where: { id: mediaId },
      data: { downloadCount: { increment: 1 } }
    });

    // Add watermark to image
    const watermarkedBuffer = await addWatermark(media.url, watermarkText);

    // Set response headers for file download
    const filename = `${media.event.title}-${media.title || 'photo'}.jpg`
      .replace(/\s+/g, '_');

    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': watermarkedBuffer.length
    });

    // Notify uploader of download
    if (media.uploaderId !== req.user.id) {
      await prisma.notification.create({
        data: {
          type: 'DOWNLOAD',
          message: `${req.user.name} downloaded your photo`,
          receiverId: media.uploaderId,
          triggererId: req.user.id,
          mediaId
        }
      });

      const io = req.app.get('io');
      io.to(`user_${media.uploaderId}`).emit('notification', {
        type: 'DOWNLOAD',
        message: `${req.user.name} downloaded your photo`,
        mediaId
      });
    }

    res.send(watermarkedBuffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error during download' });
  }
};

// GET NOTIFICATIONS
const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { receiverId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        triggerer: { select: { id: true, name: true, avatar: true } },
        media: { select: { id: true, eventId: true } }
      }
    });
    const unreadCount = await prisma.notification.count({
      where: { receiverId: req.user.id, isRead: false }
    });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// MARK ALL NOTIFICATIONS AS READ
const markNotificationsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { receiverId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  toggleLike, addComment, deleteComment, toggleFavourite,
  tagUser, getMediaLikes, getMediaComments, downloadMedia,
  getNotifications, markNotificationsRead
};