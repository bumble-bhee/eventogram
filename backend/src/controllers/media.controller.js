const { PrismaClient } = require('@prisma/client');
const { deleteFromS3 } = require('../services/s3.service');
const { getImageTags } = require('../services/ai.service');
const prisma = new PrismaClient();
const sharp = require('sharp');
const crypto = require('crypto');

// UPLOAD MEDIA (single or bulk)
const uploadMedia = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { isPublic, title } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Check event exists
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) }
    });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const mediaRecords = [];

    // Process files ONE BY ONE (not parallel) so we can debug properly
    for (const file of req.files) {
      const isPhoto = file.mimetype.startsWith('image/');
      // Generate hash for duplicate detection
      const fileHash = crypto.createHash('md5').update(file.key).digest('hex');

      // Check for duplicate
      const duplicate = await prisma.media.findFirst({
        where: { eventId: parseInt(eventId), title: file.originalname }
      });

      if (duplicate) {
        console.log('Duplicate detected, skipping:', file.originalname);
        continue;
      }

      console.log('--- Processing file ---');
      console.log('File name:', file.originalname);
      console.log('File size:', file.size);
      console.log('File URL:', file.location);
      console.log('Is photo:', isPhoto);

      // Get AI tags
      let aiTags = [];
      if (isPhoto) {
        console.log('Calling AI tagging...');
        aiTags = await getImageTags(file.location);
        console.log('Tags received:', aiTags);
      }

      const record = await prisma.media.create({
        data: {
          title: title || file.originalname,
          url: file.location,
          key: file.key,
          type: isPhoto ? 'PHOTO' : 'VIDEO',
          isPublic: isPublic !== undefined ? isPublic === 'true' : true,
          size: file.size,
          downloadCount: 0,
          eventId: parseInt(eventId),
          uploaderId: req.user.id,
          tags: aiTags
        }
      });

      mediaRecords.push(record);
    }

    res.status(201).json({
      message: `${mediaRecords.length} file(s) uploaded successfully`,
      media: mediaRecords
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }

  // Notify all users about new photo upload
  const allUsers = await prisma.user.findMany({
    where: { id: { not: req.user.id } },
    select: { id: true }
  });

  const io = req.app.get('io');
  for (const u of allUsers) {
    await prisma.notification.create({
      data: {
        type: 'NEW_PHOTO',
        message: `${req.user.name} uploaded ${mediaRecords.length} new photo(s) to ${event.title}`,
        receiverId: u.id,
        triggererId: req.user.id,
        mediaId: mediaRecords[0]?.id
      }
    });
    io.to(`user_${u.id}`).emit('notification', {
      type: 'NEW_PHOTO',
      message: `New photos uploaded to ${event.title}`
    });
  }
};

// GET ALL MEDIA FOR AN EVENT
const getEventMedia = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user role from token if logged in
    let userRole = null;
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (user) { userRole = user.role; userId = user.id; }
      } catch (e) { }
    }

    // Build visibility rules
    let where = { eventId: parseInt(eventId) };

    if (!userRole) {
      // Not logged in — only public media
      where.isPublic = true;
    } else if (userRole === 'ADMIN') {
      // Admin sees everything
    } else if (userRole === 'PHOTOGRAPHER') {
      // Photographer sees: public + photographer-private + their own
      where.OR = [
        { isPublic: true },
        { isPublic: false, uploadedBy: { role: 'PHOTOGRAPHER' } },
        { isPublic: false, uploaderId: userId }
      ];
    } else if (userRole === 'CLUB_MEMBER') {
      // Club member sees: public + club_member-private + their own
      where.OR = [
        { isPublic: true },
        { isPublic: false, uploadedBy: { role: 'CLUB_MEMBER' } },
        { isPublic: false, uploaderId: userId }
      ];
    } else {
      // VIEWER — only public
      where.isPublic = true;
    }

    if (type) where.type = type.toUpperCase();

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true, role: true } },
          _count: { select: { likes: true, comments: true } }
        }
      }),
      prisma.media.count({ where })
    ]);

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      media
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ message: 'Server error while fetching media' });
  }
};

// GET SINGLE MEDIA
const getMediaById = async (req, res) => {
  try {
    const media = await prisma.media.findUnique({
      where: { id: parseInt(req.params.mediaId) },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { likes: true, comments: true, favourites: true } }
      }
    });

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    res.json(media);
  } catch (error) {
    console.error('Get media by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE MEDIA
const deleteMedia = async (req, res) => {
  try {
    const mediaId = parseInt(req.params.mediaId);

    const media = await prisma.media.findUnique({
      where: { id: mediaId }
    });

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Only uploader or admin can delete
    if (media.uploaderId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this media' });
    }

    // Delete from S3 first
    await deleteFromS3(media.key);

    // Then delete from database
    await prisma.media.delete({ where: { id: mediaId } });

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ message: 'Server error while deleting media' });
  }
};

module.exports = { uploadMedia, getEventMedia, getMediaById, deleteMedia };