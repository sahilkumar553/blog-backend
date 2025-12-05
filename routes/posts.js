const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');

// @route   POST /posts/create
// @desc    Create a new post
// @access  Private
router.post('/create', auth, async (req, res) => {
    try {
        const { title, content, image } = req.body;

        const newPost = new Post({
            title,
            content,
            image,
            author: req.user.id
        });

        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /posts/all
// @desc    Get all posts
// @access  Public
router.get('/all', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate('author', ['username']);
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /posts/:id
// @desc    Get post by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', ['username']);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        console.log('Delete request received for ID:', req.params.id);
        console.log('User requesting delete:', req.user.id);

        const post = await Post.findById(req.params.id);

        if (!post) {
            console.log('Post not found');
            return res.status(404).json({ message: 'Post not found' });
        }

        console.log('Post author:', post.author.toString());

        // Check user
        if (post.author.toString() !== req.user.id) {
            console.log('User not authorized');
            return res.status(401).json({ message: 'User not authorized' });
        }

        await post.deleteOne();
        console.log('Post deleted successfully');

        res.json({ message: 'Post removed' });
    } catch (err) {
        console.error('Delete error:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, content, image } = req.body;
        let post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check user
        if (post.author.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        post.title = title || post.title;
        post.content = content || post.content;
        post.image = image || post.image;

        await post.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /posts/like/:id
// @desc    Like/Unlike a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the post has already been liked
        if (post.likes.filter(like => like.toString() === req.user.id).length > 0) {
            // Get remove index
            const removeIndex = post.likes.map(like => like.toString()).indexOf(req.user.id);
            post.likes.splice(removeIndex, 1);
        } else {
            post.likes.unshift(req.user.id);
        }

        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
