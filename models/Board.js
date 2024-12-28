const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    columns: [
      {
        title: {
          type: String,
          required: true, 
        },
        tasks: [
          {
            title: {
              type: String,
              required: true, 
            },
            description: {
              type: String,
              required: false,
            },
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                default: mongoose.Types.ObjectId,
              },
            status: {
              type: String,
              enum: ["To Do", "In Progress", "Done"],
              default: "To Do",
            },
            createdAt: {
              type: Date,
              default: Date.now, 
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }  
);

const Board = mongoose.model("Board", boardSchema);

module.exports = Board;
