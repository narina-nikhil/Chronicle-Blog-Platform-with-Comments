import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'blog_db.json');

// Types used internally in the database
interface UserDb {
  id: string;
  email: string;
  passwordHash: string;
  username: string;
  createdAt: string;
}

interface PostDb {
  id: string;
  title: string;
  content: string;
  summary: string;
  authorId: string;
  tags: string[];
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface CommentDb {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: UserDb[];
  posts: PostDb[];
  comments: CommentDb[];
}

class BlogDatabase {
  private data: DatabaseSchema = { users: [], posts: [], comments: [] };

  constructor() {
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seed();
      }
    } catch (e) {
      console.error('Database initialization error, using in-memory database:', e);
      this.seedInMemoryOnly();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Database write error:', e);
    }
  }

  private seedInMemoryOnly() {
    this.data = { users: [], posts: [], comments: [] };
    this.seed();
  }

  private seed() {
    // Generate hashed password for seed users
    const salt = bcrypt.genSaltSync(10);
    const passHash = bcrypt.hashSync('Password123!', salt);

    const users: UserDb[] = [
      {
        id: 'u-1',
        email: 'alice@example.com',
        username: 'Alice Dev',
        passwordHash: passHash,
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'u-2',
        email: 'bob@example.com',
        username: 'Bob Designer',
        passwordHash: passHash,
        createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
      }
    ];

    const posts: PostDb[] = [
      {
        id: 'p-1',
        title: 'Building Minimalist UIs: The Power of Negative Space',
        summary: 'How focusing on white space, precise typography, and subtle transitions can transform a cluttered screen into a professional product.',
        content: `In modern web development, there's a strong temptation to fill every corner of the viewport with data, panels, charts, and indicators. We call this "Tech-Larping" — adding decorative complexity to make an interface feel more "advanced."

But the truest sign of design craftsmanship is restraint. True luxury in UI design comes from generous negative space (also known as whitespace).

### Why Negative Space Matters
Whitespace is not just "empty" space; it is an active layout element. It dictates reading pace, establishes clean visual hierarchy, and gives elements "room to breathe."
1. **Reduces Cognitive Load**: It allows readers to process information piece-by-piece rather than all at once.
2. **Improves Legibility**: Paragraphs with open line-heights and side margins are significantly easier to read.
3. **Creates a Premium Feel**: Think of Apple, Notion, or Stripe — their products feel premium because they aren't afraid of empty space.

### Tips for Minimalist Execution
* **Pair Type Intentionally**: Combine a striking, high-contrast display font for headings (like Space Grotesk) with a highly readable, geometric sans-serif for body text (like Inter).
* **Consolidate Controls**: Don't show twenty buttons at once. Use context-dependent menus or hover reveals to keep the workspace clean.
* **Master Micro-interactions**: Use fine transitions (like a subtle 150ms opacity fade) instead of snappy, sudden updates.

Restraint is hard. It is much easier to add features and visual clutter than it is to refine a single view down to its absolute essentials. But if you want to build professional software, negative space is your greatest ally.`,
        authorId: 'u-2',
        tags: ['Design', 'UI/UX', 'Minimalism'],
        coverUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60',
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'p-2',
        title: 'An Introduction to Full-Stack Architectures with React & Express',
        summary: 'A deep-dive guide into establishing secure API routes, managing state updates, and structuring robust Node servers for single-page applications.',
        content: `Developing full-stack web applications has become more streamlined than ever, yet organizing communication between the client (React) and server (Express) remains a core skill that requires careful layout.

### The Client-Server Contract
In a modern SPA, the frontend and backend are decoupled. The server serves as a stateless engine providing structured JSON payloads over REST, while the client operates as an interactive container.

When implementing APIs, clarity is essential:
* **Endpoints must be RESTful**: Use clean resources like \`/api/posts\` rather than action-oriented verbs like \`/api/get-all-posts\`.
* **State synchronization**: React maintains its own local UI state. After mutations (like writing a comment), the frontend must fetch or optimistically update its cache.

### Designing Secure Auth Routes
User registration and login must always reside on the server:
1. **Hash on input**: Never store raw passwords. Use salt-factor hashing (like bcrypt) immediately on registration.
2. **Issue short-lived JWTs**: Sign cookies or headers using a cryptographically random secret.

\`\`\`typescript
// backend token generation
const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
\`\`\`

By structuring your app modularly — isolating types, route definitions, and database queries — you build code that remains maintainable as your team and feature set expand.`,
        authorId: 'u-1',
        tags: ['WebDev', 'Express', 'React', 'FullStack'],
        coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=60',
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      }
    ];

    const comments: CommentDb[] = [
      {
        id: 'c-1',
        postId: 'p-1',
        authorId: 'u-1',
        content: 'This is a fantastic write-up! I especially agree with the "Tech-Larping" concept. Too many UIs feel like sci-fi control centers rather than functional tools.',
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'c-2',
        postId: 'p-1',
        authorId: 'u-2',
        content: 'Thanks, Alice! Appreciate the feedback. It took some restraint not to add custom visual widgets here too!',
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'c-3',
        postId: 'p-2',
        authorId: 'u-2',
        content: 'Super clean explanation of JWT and password hashing. Perfect for developers looking to upgrade their frontend prototypes to secure production servers.',
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      }
    ];

    this.data = { users, posts, comments };
    this.save();
  }

  // --- Users Methods ---

  public getUsers(): UserDb[] {
    return this.data.users;
  }

  public getUserById(id: string): UserDb | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): UserDb | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByUsername(username: string): UserDb | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public createUser(email: string, username: string, passwordHash: string): UserDb {
    const newUser: UserDb = {
      id: `u-${Math.random().toString(36).substring(2, 9)}`,
      email,
      username,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  // --- Posts Methods ---

  public getPosts(): PostDb[] {
    return this.data.posts;
  }

  public getPostById(id: string): PostDb | undefined {
    return this.data.posts.find(p => p.id === id);
  }

  public createPost(title: string, summary: string, content: string, authorId: string, tags: string[], coverUrl?: string): PostDb {
    const newPost: PostDb = {
      id: `p-${Math.random().toString(36).substring(2, 9)}`,
      title,
      summary,
      content,
      authorId,
      tags: tags.map(t => t.trim()).filter(t => t.length > 0),
      coverUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.posts.unshift(newPost); // New posts first
    this.save();
    return newPost;
  }

  public updatePost(id: string, title: string, summary: string, content: string, tags: string[], coverUrl?: string): PostDb | undefined {
    const postIdx = this.data.posts.findIndex(p => p.id === id);
    if (postIdx === -1) return undefined;

    const updated = {
      ...this.data.posts[postIdx],
      title,
      summary,
      content,
      tags: tags.map(t => t.trim()).filter(t => t.length > 0),
      coverUrl,
      updatedAt: new Date().toISOString()
    };
    this.data.posts[postIdx] = updated;
    this.save();
    return updated;
  }

  public deletePost(id: string): boolean {
    const initialLen = this.data.posts.length;
    this.data.posts = this.data.posts.filter(p => p.id !== id);
    // Also delete any comments on this post
    this.data.comments = this.data.comments.filter(c => c.postId !== id);
    this.save();
    return this.data.posts.length < initialLen;
  }

  // --- Comments Methods ---

  public getCommentsByPostId(postId: string): CommentDb[] {
    return this.data.comments.filter(c => c.postId === postId);
  }

  public createComment(postId: string, authorId: string, content: string): CommentDb {
    const newComment: CommentDb = {
      id: `c-${Math.random().toString(36).substring(2, 9)}`,
      postId,
      authorId,
      content,
      createdAt: new Date().toISOString()
    };
    this.data.comments.push(newComment);
    this.save();
    return newComment;
  }

  public deleteComment(id: string): boolean {
    const initialLen = this.data.comments.length;
    this.data.comments = this.data.comments.filter(c => c.id !== id);
    this.save();
    return this.data.comments.length < initialLen;
  }
}

export const db = new BlogDatabase();
