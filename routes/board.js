const express = require("express");
const Board = require("../models/Board");
const auth = require("../middleware/auth");  // Import the authentication middleware
const router = express.Router();

// Create Board
router.post("/", auth, async (req, res) => {
  const { title, columns } = req.body;
  const userId = req.user.id;

  try {
    const newBoard = new Board({
      title,
      user: userId,
      columns: columns || [],
    });

    await newBoard.save();
    res.status(201).json(newBoard);
  } catch (error) {
    res.status(500).json({ message: "Error creating board", error });
  }
});

// Get All Boards for the Logged-in User
router.get("/", auth, async (req, res) => {
  try {
    const boards = await Board.find({ user: req.user.id });
    res.status(200).json(boards);
  } catch (error) {
    res.status(500).json({ message: "Error fetching boards", error });
  }
});

// Update a Board (e.g., adding/removing columns, tasks)
router.put("/:boardId", auth, async (req, res) => {
  const { boardId } = req.params;
  const { columns } = req.body;

  try {
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    // Ensure the board belongs to the authenticated user
    if (board.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    board.columns = columns || board.columns;
    await board.save();

    res.status(200).json(board);
  } catch (error) {
    res.status(500).json({ message: "Error updating board", error });
  }
});

module.exports = router;
