import { notesService } from '../services/notesService.js';

// UPDATE
export const updateNote = async (req, res) => {
  const updatedNote = await notesService.updateNote(req.params.noteId, req.body, req.user._id);

  res.status(200).json({
    success: true,
    data: updatedNote,
    message: 'Note updated successfully'
  });
};

// DELETE 
export const deleteNote = async (req, res) => {
  const result = await notesService.deleteNote(req.params.noteId, req.user._id);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Note deleted successfully'
  });
};

// VIEW SINGLE NOTE
export const getNoteById = async (req, res) => {
  const note = await notesService.getNoteById(req.params.noteId, req.user._id);

  res.status(200).json({
    success: true,
    data: note,
    message: "Note retrieved successfully",
  });
};
