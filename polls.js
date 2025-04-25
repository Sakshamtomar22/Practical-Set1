const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { title, options } = req.body;
    if (options.length < 2 || options.length > 5) {
      return res.status(400).json({ message: 'Options must be between 2 and 5' });
    }
    const poll = new Poll({
      title,
      options: options.map(text => ({ text, votes: 0 })),
      createdBy: req.user.id
    });
    await poll.save();
    res.status(201).json(poll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const polls = await Poll.find().select('title createdAt');
    res.json(polls);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    res.json(poll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.voters.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already voted' });
    }
    poll.options[optionIndex].votes += 1;
    poll.voters.push(req.user.id);
    await poll.save();
    res.json(poll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;