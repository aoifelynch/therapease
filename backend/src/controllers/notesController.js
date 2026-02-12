import Note from '../models/Note.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';

// UPDATE
export const updateNote = async (req, res) => {
  if (!req.params.noteId) {
    throw new HttpError(BAD_REQUEST, 'Note ID is required');
  }

  const note = await Note.findById(req.params.noteId)
    .populate('client')
    .exec();

  if (!note) throw new HttpError(NOT_FOUND, 'Note not found');

  if (note.client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const updates = {
    content: req.body.content ?? note.content,
    templateType: req.body.templateType ?? note.templateType,
    appointment: req.body.appointmentId ?? note.appointment
  };

  const updatedNote = await Note.findByIdAndUpdate(
    req.params.noteId,
    updates,
    { new: true, runValidators: true }
  ).exec();

  res.status(200).json({
    success: true,
    data: updatedNote,
    message: 'Note updated successfully'
  });
};

// DELETE 
export const deleteNote = async (req, res) => {
  const note = await Note.findById(req.params.noteId)
    .populate('client')
    .exec();

  if (!note) {
    throw new HttpError(NOT_FOUND, 'Note not found');
  }

  // ensure the note belongs to the logged-in therapist
  if (note.client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  await Note.findByIdAndDelete(req.params.noteId).exec();

  res.status(200).json({
    success: true,
    data: { id: req.params.noteId },
    message: 'Note deleted successfully'
  });
};

// VIEW SINGLE NOTE
export const getNoteById = async (req, res) => {
    const note = await Note.findById(req.params.noteId)
      .populate("client")
      .exec();

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    if (!note.client || !note.client.user) {
      return res.status(500).json({
        success: false,
        message: "Note is missing client/user reference",
      });
    }

    if (note.client.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this note",
      });
    }

    res.status(200).json({
      success: true,
      data: note,
      message: "Note retrieved successfully",
    });
};
