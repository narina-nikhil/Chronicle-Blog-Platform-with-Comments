/**
 * Shared Type Definitions for the Blog Platform
 */

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  summary: string;
  authorId: string;
  authorName: string;
  tags: string[];
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
  commentsCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
}
