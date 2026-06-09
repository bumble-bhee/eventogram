const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const euclideanDistance = (desc1, desc2) => {
  if (desc1.length !== desc2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
};

const isMatch = (desc1, desc2, threshold = 0.6) => {
  return euclideanDistance(desc1, desc2) < threshold;
};

// Save face descriptor for current user
const saveFaceDescriptor = async (req, res) => {
  try {
    const { descriptor, selfieUrl } = req.body;

    if (!descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({ message: 'Face descriptor array is required' });
    }

    if (descriptor.length !== 128) {
      return res.status(400).json({ message: 'Invalid descriptor: must have 128 values' });
    }

    const faceData = await prisma.faceDescriptor.upsert({
      where: { userId: req.user.id },
      update: { descriptor, selfieUrl: selfieUrl || '' },
      create: { userId: req.user.id, descriptor, selfieUrl: selfieUrl || '' }
    });

    res.json({ message: 'Face descriptor saved successfully', faceData });
  } catch (error) {
    console.error('Save descriptor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Called when a photo is uploaded — scans faces in photo and tags matched users
const tagFacesInPhoto = async (req, res) => {
  try {
    const { mediaId, faceDescriptors } = req.body;

    if (!faceDescriptors || !Array.isArray(faceDescriptors)) {
      return res.status(400).json({ message: 'faceDescriptors array is required' });
    }

    // Get all registered face descriptors
    const allFaces = await prisma.faceDescriptor.findMany({
      include: { user: { select: { id: true, name: true } } }
    });

    const taggedUsers = [];

    // For each face found in the photo
    for (const photoFaceDescriptor of faceDescriptors) {
      // Compare against all registered users
      for (const registeredFace of allFaces) {
        if (isMatch(photoFaceDescriptor, registeredFace.descriptor)) {
          // Check if already tagged
          const existing = await prisma.mediaTag.findUnique({
            where: {
              mediaId_userId: {
                mediaId: parseInt(mediaId),
                userId: registeredFace.userId
              }
            }
          });

          if (!existing) {
            await prisma.mediaTag.create({
              data: {
                mediaId: parseInt(mediaId),
                userId: registeredFace.userId
              }
            });

            // Send notification to tagged user
            const media = await prisma.media.findUnique({
              where: { id: parseInt(mediaId) },
              select: { uploaderId: true }
            });

            if (media && media.uploaderId !== registeredFace.userId) {
              await prisma.notification.create({
                data: {
                  type: 'TAG',
                  message: `You were automatically detected in a photo`,
                  receiverId: registeredFace.userId,
                  triggererId: media.uploaderId,
                  mediaId: parseInt(mediaId)
                }
              });
            }

            taggedUsers.push(registeredFace.user.name);
          }
        }
      }
    }

    res.json({
      message: `Tagged ${taggedUsers.length} user(s) in photo`,
      taggedUsers
    });
  } catch (error) {
    console.error('Tag faces error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Find all photos where current user is tagged
const findMyPhotos = async (req, res) => {
  try {
    const myFaceData = await prisma.faceDescriptor.findUnique({
      where: { userId: req.user.id }
    });

    if (!myFaceData) {
      return res.status(404).json({
        message: 'No face descriptor found. Please register your face first.'
      });
    }

    // Find photos where this user is tagged via face recognition
    const myPhotos = await prisma.media.findMany({
      where: {
        isPublic: true,
        tags_users: {
          some: { userId: req.user.id }
        }
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ count: myPhotos.length, photos: myPhotos });
  } catch (error) {
    console.error('Find my photos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const checkDescriptor = async (req, res) => {
  try {
    const faceData = await prisma.faceDescriptor.findUnique({
      where: { userId: req.user.id }
    });
    res.json({ exists: !!faceData });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
// Scan all existing photos for a newly registered user's face
const scanAllPhotos = async (req, res) => {
  try {
    const myFaceData = await prisma.faceDescriptor.findUnique({
      where: { userId: req.user.id }
    });

    if (!myFaceData) {
      return res.status(404).json({ message: 'Please register your face first' });
    }

    // Get all media that has face descriptors stored
    const allMediaWithFaces = await prisma.mediaFaceData.findMany({
      select: { mediaId: true, descriptor: true }
    });

    let taggedCount = 0;

    for (const mediaFace of allMediaWithFaces) {
      if (isMatch(myFaceData.descriptor, mediaFace.descriptor)) {
        const existing = await prisma.mediaTag.findUnique({
          where: {
            mediaId_userId: {
              mediaId: mediaFace.mediaId,
              userId: req.user.id
            }
          }
        });

        if (!existing) {
          await prisma.mediaTag.create({
            data: { mediaId: mediaFace.mediaId, userId: req.user.id }
          });
          taggedCount++;
        }
      }
    }

    res.json({ message: `Scanned and found ${taggedCount} photo(s)`, taggedCount });
  } catch (error) {
    console.error('Scan all photos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { saveFaceDescriptor, findMyPhotos, checkDescriptor, tagFacesInPhoto, scanAllPhotos };