const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const searchMedia = async (req, res) => {
  try {
    const { query, tag, eventName, uploaderName, date, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let where = { isPublic: true };

    if (tag) where.tags = { has: tag.toLowerCase() };
    if (eventName) where.event = { title: { contains: eventName, mode: 'insensitive' } };
    if (uploaderName) where.uploadedBy = { name: { contains: uploaderName, mode: 'insensitive' } };
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { gte: searchDate, lt: nextDay };
    }
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } },
        { event: { title: { contains: query, mode: 'insensitive' } } },
        { uploadedBy: { name: { contains: query, mode: 'insensitive' } } }
      ];
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true } },
          event: { select: { id: true, title: true } },
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
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
};

module.exports = { searchMedia };