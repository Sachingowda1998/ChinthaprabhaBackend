const musicQuoteModel = require("../models/musicQuoteModel");

const createQuote = async (req, res) => {
  try {
    const { text, artist, genre, source } = req.body;

    const newQuote = new musicQuoteModel({ text, artist, genre, source });
    await newQuote.save();

    res.status(201).json({ message: "Quote added", quote: newQuote });
  } catch (error) {
    res.status(500).json({ message: "Failed to add quote", error: error.message });
  }
};

const getAllQuotes = async (req, res) => {
  try {
    const quotes = await musicQuoteModel.find().sort({ createdAt: -1 });
    res.status(200).json(quotes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch quotes", error: error.message });
  }
};

const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await musicQuoteModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.status(200).json({ message: "Quote deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete quote", error: error.message });
  }
};

const updateQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedQuote = await musicQuoteModel.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedQuote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.status(200).json({ message: "Quote updated successfully", updatedQuote });
  } catch (error) {
    res.status(500).json({ message: "Failed to update quote", error: error.message });
  }
};

module.exports = {
  createQuote,
  getAllQuotes,
  deleteQuote,
  updateQuote
};