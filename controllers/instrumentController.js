const Instrument = require("../models/Instrument");
const fs = require("fs");
const path = require("path");

// CREATE
exports.createInstrument = async (req, res) => {
  try {
    const { name, description, expert, offer, group } = req.body;
    const image = req.file ? req.file.path : null;

    const newInstrument = new Instrument({ name, description, expert, offer, group, image });
    await newInstrument.save();

    res.status(201).json(newInstrument);
  } catch (err) {
    res.status(500).json({ error: "Failed to add instrument" });
  }
};

// READ ALL
exports.getInstruments = async (req, res) => {
  try {
    const instruments = await Instrument.find();
    res.json(instruments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch instruments" });
  }
};

// READ BY ID
exports.getInstrumentById = async (req, res) => {
  try {
    const instrument = await Instrument.findById(req.params.id);
    if (!instrument) return res.status(404).json({ error: "Instrument not found" });

    res.json(instrument);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch instrument" });
  }
};

// UPDATE
exports.updateInstrument = async (req, res) => {
  try {
    const { name, description, expert, offer, group } = req.body;
    const instrument = await Instrument.findById(req.params.id);
    if (!instrument) return res.status(404).json({ error: "Instrument not found" });

    // If image is being updated
    if (req.file) {
      // Delete old image if it exists
      if (instrument.image) {
        fs.unlink(path.join(__dirname, "..", instrument.image), (err) => {
          if (err) console.error("Failed to delete old image:", err);
        });
      }
      instrument.image = req.file.path;
    }

    instrument.name = name;
    instrument.description = description;
    instrument.expert = expert;
    instrument.offer = offer;
    instrument.group = group;

    await instrument.save();
    res.json(instrument);
  } catch (err) {
    res.status(500).json({ error: "Failed to update instrument" });
  }
};

// DELETE
exports.deleteInstrument = async (req, res) => {
  try {
    const instrument = await Instrument.findById(req.params.id);
    if (!instrument) return res.status(404).json({ error: "Instrument not found" });

    // Delete image file
    if (instrument.image) {
      fs.unlink(path.join(__dirname, "..", instrument.image), (err) => {
        if (err) console.error("Failed to delete image:", err);
      });
    }

    await Instrument.findByIdAndDelete(req.params.id);
    res.json({ message: "Instrument deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete instrument" });
  }
};
