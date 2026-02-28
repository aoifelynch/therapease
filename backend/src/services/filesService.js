import File from '../models/File.js';
import Client from '../models/Client.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';

export default {
  // Upload a new file for a client
  async uploadFile(fileData, userId) {
    const { clientId } = fileData;

    if (!clientId) {
      throw new HttpError(BAD_REQUEST, 'Client ID is required');
    }

    const client = await Client.findById(clientId).exec();
    if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

    if (client.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const file = await File.create({
      ...fileData,
      client: client._id
    });

    return file;
  },

  // Delete a file
  async deleteFile(fileId, userId) {
    const file = await File.findById(fileId)
      .populate('client')
      .exec();

    if (!file) {
      throw new HttpError(NOT_FOUND, 'File not found');
    }

    if (file.client.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    await File.findByIdAndDelete(fileId).exec();

    return { id: fileId };
  }
};
