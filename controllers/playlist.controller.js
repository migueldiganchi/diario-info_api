const Playlist = require("../models/playlist.model");
const Log = require("../models/log.model");

// Slug helper
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

// Create a new Playlist
exports.createPlaylist = async (req, res) => {
  try {
    const { name, description, items, isVisible } = req.body;

    if (!name) {
      return res.status(400).json({ message: "El nombre es requerido" });
    }

    const slug = generateSlug(name);

    const newPlaylist = new Playlist({
      name,
      description,
      slug,
      items: items || [],
      isVisible: isVisible !== undefined ? isVisible : true,
      createdBy: req.userId,
    });

    const savedPlaylist = await newPlaylist.save();

    // Log
    if (req.userId) {
      await Log.create({
        user: req.userId,
        action: "PLAYLIST_CREATED",
        details: `Playlist created: ${savedPlaylist.name}`,
      });
    }

    res.status(201).json({ success: true, playlist: savedPlaylist });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Error al crear la playlist",
    });
  }
};

// Get all playlists (for management)
exports.getPlaylists = async (req, res) => {
  const { search } = req.query;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const query = {};

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  try {
    const total = await Playlist.countDocuments(query);
    const playlists = await Playlist.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const totalPages = Math.ceil(total / pageSize);
    const nextPage = page + 1 <= totalPages ? page + 1 : null;

    res.status(200).json({ success: true, playlists, total, totalPages, nextPage });
  } catch (err) {
    res.status(500).json({ message: "Error obteniendo playlists" });
  }
};

// Get a playlist by ID or Slug (Public)
// Items are returned sorted by 'addedAt' descending (newest first)
// This fulfills the requirement to show "the last 3 or 4 as they are entered"
exports.getPlaylist = async (req, res) => {
  const { id } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit) : null;

  try {
    let playlist;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      playlist = await Playlist.findById(id);
    } else {
      playlist = await Playlist.findOne({ slug: id });
    }

    if (!playlist) {
      return res.status(404).json({ message: "Playlist no encontrada" });
    }

    // Sort items from newest to oldest
    playlist.items.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    // If a limit is requested (e.g., 4 for the block), slice the array
    if (limit && limit > 0) {
      playlist.items = playlist.items.slice(0, limit);
    }

    res.status(200).json({ success: true, playlist });
  } catch (err) {
    res.status(500).json({ message: "Error obteniendo la playlist" });
  }
};

// Update Playlist (General)
exports.updatePlaylist = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedPlaylist = await Playlist.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json({ success: true, playlist: updatedPlaylist });
  } catch (err) {
    res.status(500).json({ message: "Error actualizando playlist" });
  }
};

// Add a specific video to a playlist
// This endpoint is ideal for the quick-add module: "load the link and a description"
exports.addItemToPlaylist = async (req, res) => {
  const { id } = req.params;
  const { url, description } = req.body;

  if (!url) {
    return res.status(400).json({ message: "La URL es requerida" });
  }

  try {
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist no encontrada" });
    }

    playlist.items.push({
      url,
      description,
      addedAt: new Date(),
    });

    const savedPlaylist = await playlist.save();

    // Log
    if (req.userId) {
      await Log.create({
        user: req.userId,
        action: "PLAYLIST_ITEM_ADDED",
        details: `Video added to playlist ${playlist.name}`,
      });
    }

    res.status(200).json({ success: true, playlist: savedPlaylist });
  } catch (err) {
    res.status(500).json({ message: "Error agregando video a la playlist" });
  }
};

// Delete Playlist
exports.deletePlaylist = async (req, res) => {
  const { id } = req.params;
  try {
    await Playlist.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Playlist eliminada" });
  } catch (err) {
    res.status(500).json({ message: "Error eliminando playlist" });
  }
};
