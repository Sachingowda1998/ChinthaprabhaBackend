const express = require("express");
const { createQuote, getAllQuotes, deleteQuote, updateQuote } = require("../controllers/musicQuotesController");
const router = express.Router();

router.post("/", createQuote);
router.get("/", getAllQuotes);
router.delete("/:id", deleteQuote); 
router.put("/:id", updateQuote); 

module.exports = router;