import filesService from '../services/filesService.js';

// GET ALL
export const getFiles = async (req, res) => {
  const files = await filesService.getAllFiles(req.user._id);

  res.status(200).json({
    success: true,
    data: files,
    message: 'Files retrieved successfully'
  });
};

// UPLOAD
export const uploadFile = async (req, res) => {
  const file = await filesService.uploadFile(req.body, req.user._id);

  res.status(201).json({
    success: true,
    data: file,
    message: 'File uploaded successfully'
  });
};

// DELETE
export const deleteFile = async (req, res) => {
  const result = await filesService.deleteFile(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    data: result,
    message: 'File deleted successfully'
  });
};
