const express = require("express");
const Board = require("../models/Board");
const auth = require("../middleware/auth");
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
  const { columns, newColumn } = req.body;  // Accept both new and existing columns

  try {
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    // Ensure the board belongs to the authenticated user
    if (board.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Handle Column Addition
    if (newColumn) {
      const columnExists = board.columns.some(col => col.title === newColumn.title);
      if (columnExists) {
        return res.status(400).json({ message: "Column already exists" });
      }
      board.columns.push({ title: newColumn.title, tasks: [] });
    }

    // Update Existing Columns
    if (columns) {
      board.columns = columns;
    }

    await board.save();
    res.status(200).json(board);
  } catch (error) {
    res.status(500).json({ message: "Error updating board", error });
  }
});


// GET a single board by ID
router.get("/:boardId", auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }
    
    // Ensure the board belongs to the authenticated user
    if (board.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json(board);
  } catch (error) {
    res.status(500).json({ message: "Error fetching board", error });
  }
});

module.exports = router;
