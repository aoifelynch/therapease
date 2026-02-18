import Note from '../models/Note.js';
import Client from '../models/Client.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';

export const notesService = {
  // Get a single note by ID
  async getNoteById(noteId, userId) {
    const note = await Note.findById(noteId)
      .populate("client")
      .exec();

    if (!note) {
      throw new HttpError(NOT_FOUND, "Note not found");
    }

    if (!note.client || !note.client.user) {
      throw new HttpError(NOT_FOUND, "Note is missing client/user reference");
    }

    if (note.client.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, "Not authorized to view this note");
    }

    return note;
  },

  // Update a note
  async updateNote(noteId, updateData, userId) {
    if (!noteId) {
      throw new HttpError(BAD_REQUEST, 'Note ID is required');
    }

    const note = await Note.findById(noteId)
      .populate('client')
      .exec();

    if (!note) throw new HttpError(NOT_FOUND, 'Note not found');

    if (note.client.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const updates = {
      content: updateData.content ?? note.content,
      templateType: updateData.templateType ?? note.templateType,
      appointment: updateData.appointmentId ?? note.appointment
    };

    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      updates,
      { new: true, runValidators: true }
    ).exec();

    return updatedNote;
  },

  // Delete a note
  async deleteNote(noteId, userId) {
    const note = await Note.findById(noteId)
      .populate('client')
      .exec();

    if (!note) {
      throw new HttpError(NOT_FOUND, 'Note not found');
    }

    // ensure the note belongs to the logged-in therapist
    if (note.client.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    await Note.findByIdAndDelete(noteId).exec();

    return { id: noteId };
  }
};
