const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE EVENT
const createEvent = async (req, res) => {
  try {
    const { title, description, category, date, isPublic } = req.body;

    if (!title || !category || !date) {
      return res.status(400).json({ message: 'Title, category and date are required' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        category,
        date: new Date(date),
        isPublic: isPublic !== undefined ? isPublic : true,
        creatorId: req.user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error while creating event' });
  }
};

// GET ALL EVENTS
const getAllEvents = async (req, res) => {
  try {
    const { sortBy, order, category, search } = req.query;

    // Build sort object
    let orderBy = {};
    if (sortBy === 'name') orderBy = { title: order === 'desc' ? 'desc' : 'asc' };
    else if (sortBy === 'category') orderBy = { category: order === 'desc' ? 'desc' : 'asc' };
    else orderBy = { date: order === 'desc' ? 'desc' : 'asc' }; // default sort by date

    // Build filter object
    let where = { isPublic: true };
    if (category) where.category = category;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const events = await prisma.event.findMany({
      where,
      orderBy,
      include: {
        createdBy: {
          select: { id: true, name: true }
        },
        _count: {
          select: { media: true }
        }
      }
    });

    res.json({ events, count: events.length });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
};

// GET SINGLE EVENT
const getEventById = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        media: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { media: true }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error while fetching event' });
  }
};

// UPDATE EVENT
const updateEvent = async (req, res) => {
  try {
    const { title, description, category, date, isPublic } = req.body;
    const eventId = parseInt(req.params.id);

    // Check if event exists and belongs to user
    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) return res.status(404).json({ message: 'Event not found' });

    if (existing.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(date && { date: new Date(date) }),
        ...(isPublic !== undefined && { isPublic })
      }
    });

    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error while updating event' });
  }
};

// DELETE EVENT
const deleteEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) return res.status(404).json({ message: 'Event not found' });

    await prisma.event.delete({ where: { id: eventId } });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
};

module.exports = { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent };