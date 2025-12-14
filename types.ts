
import React from 'react';

export enum ProjectStatus {
  IDEA = 'Concept Phase',
  IN_PROGRESS = 'In Development',
  COMPLETED = 'Deployed',
  ARCHIVED = 'Deprecated'
}

export enum UserRole {
  ADMIN = 'Admin',
  DEVELOPER = 'Developer',
  EDITOR = 'Editor',
  VIEWER = 'Viewer'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type ItemType = 'app' | 'file';

export interface AppSettings {
  accentColor: string;
  reduceMotion: boolean;
  enableNotifications: boolean;
}

export interface ChangeLogEntry {
  id: string;
  date: number;
  author: string;
  reason: string;
}

export interface Commit {
  id: string;
  message: string;
  author: string;
  date: string; // ISO String
  hash: string;
}

export interface GitState {
  remoteUrl: string;
  branch: string;
  commits: Commit[];
  lastSync: number;
  status: 'clean' | 'ahead' | 'behind' | 'diverged';
  pendingChanges?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  websiteUrl?: string;
  repoUrl?: string;
  imageUrl?: string;
  techStack: string[];
  files: string; // Storing as a text block representing structure or code snippet
  createdAt: number;
  itemType: ItemType; // New field to distinguish apps from office files
  changeHistory?: ChangeLogEntry[];
  gitState?: GitState;
}

export interface ProjectFormData {
  name: string;
  description: string;
  status: ProjectStatus;
  websiteUrl: string;
  repoUrl: string;
  imageUrl: string;
  techStack: string; // Comma separated for input
  files: string;
  itemType: ItemType;
  createdAt?: number; // Added to support custom dates
  changeReason?: string; // Mandatory when editing
  gitUrl?: string; // For cloning
}

export type Category = 'Home' | 'FETS Apps' | 'Resources' | 'My List' | 'SOP';

export interface SOPSection {
  id: string;
  title: string;
  purpose: string;
  scope: string;
  responsibilities: string[];
  steps: {
    heading: string;
    content: string[];
  }[];
  diagram: React.ReactNode;
}
