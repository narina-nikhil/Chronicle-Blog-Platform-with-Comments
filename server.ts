import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'blog-platform-secret-12345-fallback-token-key-abc';

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json());

  // Log requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required.' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
      }
      req.user = decoded;
      next();
    });
  };

  // --- REST API Endpoints ---

  // User Registration
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, username, password } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({ message: 'Email, username, and password are required.' });
      }

      if (username.length < 3 || username.length > 25) {
        return res.status(400).json({ message: 'Username must be between 3 and 25 characters.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      }

      // Check if email or username is already taken
      const existingEmail = db.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email is already registered.' });
      }

      const existingUsername = db.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username is already taken.' });
      }

      // Hash password
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      // Create User
      const user = db.createUser(email, username, passwordHash);

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      const userProfile = { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt };
      res.status(201).json({ token, user: userProfile });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: 'Server error during registration.' });
    }
  });

  // User Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      // Find user
      const user = db.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }

      // Check password
      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      const userProfile = { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt };
      res.json({ token, user: userProfile });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: 'Server error during login.' });
    }
  });

  // Get current user details
  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    try {
      const user = db.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      res.json({ id: user.id, email: user.email, username: user.username, createdAt: user.createdAt });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: 'Server error retrieving current profile.' });
    }
  });

  // --- Posts APIs ---

  // Get all posts with joined author details and comments count
  app.get('/api/posts', (req, res) => {
    try {
      const { tag } = req.query;
      let posts = db.getPosts();

      if (tag && typeof tag === 'string') {
        posts = posts.filter(p => p.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
      }

      const joinedPosts = posts.map(post => {
        const author = db.getUserById(post.authorId);
        const comments = db.getCommentsByPostId(post.id);
        return {
          id: post.id,
          title: post.title,
          summary: post.summary,
          content: post.content,
          authorId: post.authorId,
          authorName: author ? author.username : 'Anonymous',
          tags: post.tags,
          coverUrl: post.coverUrl,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          commentsCount: comments.length
        };
      });

      res.json(joinedPosts);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: 'Server error fetching posts.' });
    }
  });

  // Get single post by id with author name and comments count
  app.get('/api/posts/:id', (req, res) => {
    try {
      const post = db.getPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found.' });
      }

      const author = db.getUserById(post.authorId);
      const comments = db.getCommentsByPostId(post.id);

      res.json({
        id: post.id,
        title: post.title,
        summary: post.summary,
        content: post.content,
        authorId: post.authorId,
        authorName: author ? author.username : 'Anonymous',
        tags: post.tags,
        coverUrl: post.coverUrl,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        commentsCount: comments.length
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: 'Server error fetching post.' });
    }
  });

  // Create post
  app.post('/api/posts', authenticateToken, (req: any, res) => {
    try {
      const { title, summary, content, tags, coverUrl } = req.body;
      const authorId = req.user.id;

      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required.' });
      }

      const truncatedSummary = summary || (content.length > 150 ? content.substring(0, 150) + '...' : content);

      const post = db.createPost(title, truncatedSummary, content, authorId, tags || [], coverUrl);
      const author = db.getUserById(authorId);

      res.status(201).json({
        ...post,
        authorName: author ? author.username : 'Anonymous',
        commentsCount: 0
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: 'Server error creating post.' });
    }
  });

  // Edit/Update post (Owner only)
  app.put('/api/posts/:id', authenticateToken, (req: any, res) => {
    try {
      const { title, summary, content, tags, coverUrl } = req.body;
      const post = db.getPostById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
      }

      // Check ownership
      if (post.authorId !== req.user.id) {
        return res.status(403).json({ message: 'You are not authorized to edit this post.' });
      }

      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required.' });
      }

      const truncatedSummary = summary || (content.length > 150 ? content.substring(0, 150) + '...' : content);

      const updated = db.updatePost(req.params.id, title, truncatedSummary, content, tags || [], coverUrl);
      if (!updated) {
        return res.status(500).json({ message: 'Failed to update post.' });
      }

      const author = db.getUserById(post.authorId);
      const comments = db.getCommentsByPostId(post.id);

      res.json({
        ...updated,
        authorName: author ? author.username : 'Anonymous',
        commentsCount: comments.length
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: 'Server error updating post.' });
    }
  });

  // Delete post (Owner only)
  app.delete('/api/posts/:id', authenticateToken, (req: any, res) => {
    try {
      const post = db.getPostById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
      }

      // Check ownership
      if (post.authorId !== req.user.id) {
        return res.status(403).json({ message: 'You are not authorized to delete this post.' });
      }

      const deleted = db.deletePost(req.params.id);
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete post.' });
      }

      res.json({ message: 'Post deleted successfully.' });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: 'Server error deleting post.' });
    }
  });

  // --- Comments APIs ---

  // Get comments for a specific post
  app.get('/api/posts/:postId/comments', (req, res) => {
    try {
      const comments = db.getCommentsByPostId(req.params.postId);
      const joinedComments = comments.map(c => {
        const author = db.getUserById(c.authorId);
        return {
          id: c.id,
          postId: c.postId,
          authorId: c.authorId,
          authorName: author ? author.username : 'Anonymous',
          content: c.content,
          createdAt: c.createdAt
        };
      });

      // Sort oldest to newest
      joinedComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      res.json(joinedComments);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: 'Server error fetching comments.' });
    }
  });

  // Create a comment (Auth required)
  app.post('/api/posts/:postId/comments', authenticateToken, (req: any, res) => {
    try {
      const { content } = req.body;
      const { postId } = req.params;
      const authorId = req.user.id;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Comment content cannot be empty.' });
      }

      const post = db.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
      }

      const comment = db.createComment(postId, authorId, content);
      const author = db.getUserById(authorId);

      res.status(201).json({
        id: comment.id,
        postId: comment.postId,
        authorId: comment.authorId,
        authorName: author ? author.username : 'Anonymous',
        content: comment.content,
        createdAt: comment.createdAt
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: 'Server error creating comment.' });
    }
  });

  // Delete a comment (Comment creator OR Post author can delete)
  app.delete('/api/comments/:id', authenticateToken, (req: any, res) => {
    try {
      const comments = db.getCommentsByPostId(req.params.id); // Wait, we need to find the specific comment by ID
      // Let's scan all comments to find it since getCommentsByPostId takes a postId.
      // Alternatively, let's write or use a quick helper to scan.
      const allComments = (db as any).data.comments as any[];
      const comment = allComments.find(c => c.id === req.params.id);

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found.' });
      }

      const post = db.getPostById(comment.postId);

      // Auth: must be either comment author or post author
      const isCommentAuthor = comment.authorId === req.user.id;
      const isPostAuthor = post && post.authorId === req.user.id;

      if (!isCommentAuthor && !isPostAuthor) {
        return res.status(403).json({ message: 'You are not authorized to delete this comment.' });
      }

      const deleted = db.deleteComment(req.params.id);
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete comment.' });
      }

      res.json({ message: 'Comment deleted successfully.' });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: 'Server error deleting comment.' });
    }
  });


  // --- Vite & Frontend Static Delivery ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Listen
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
