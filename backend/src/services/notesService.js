import Note from '../models/Note.js';
import Client from '../models/Client.js';
import { HttpError, NOT_FOUND, FORBIDDEN } from '../utils/HttpError.js';

export const notesService = {
  // Get all notes for a client
  async getNotes(clientId, userId) {
    // Business logic here
  },

  // Get a single note by ID
  async getNoteById(noteId, userId) {
    // Business logic here
  },

  // Create a new note
  async createNote(noteData, userId) {
    // Business logic here
  },

  // Update a note
  async updateNote(noteId, updateData, userId) {
    // Business logic here
  },

  // Delete a note
  async deleteNote(noteId, userId) {
    // Business logic here
  }
};
