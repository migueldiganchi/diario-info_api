const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const playlistController = require("../controllers/playlist.controller");

// Retrieve all Playlists (Admin/Editor management)
router.get("/playlists", checkAuth, playlistController.getPlaylists);

// Create a new Playlist
router.post("/playlists", checkAuth, playlistController.createPlaylist);

// Retrieve a single Playlist (Public - for frontend Blocks)
// Supports query param ?limit=4 to get only the last 4 items
router.get("/playlist/:id", [], playlistController.getPlaylist);

// Update a Playlist metadata
router.put("/playlist/:id", checkAuth, playlistController.updatePlaylist);

// Add a single video/item to a Playlist (Quick Add)
router.post("/playlist/:id/item", checkAuth, playlistController.addItemToPlaylist);

// Delete a Playlist
router.delete("/playlist/:id", checkAuth, playlistController.deletePlaylist);

module.exports = router;