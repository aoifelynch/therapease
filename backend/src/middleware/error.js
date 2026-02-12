import { INTERNAL_SERVER_ERROR, NOT_FOUND, BAD_REQUEST } from "../utils/HttpError.js";

export const errorHandler = async (error, _req, res, _next) => {
  const { status, message } = error;

  // Handle MongoDB/Mongoose errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(BAD_REQUEST).json({ 
      error: 'Validation Error',
      details: errors 
    });
  }

  if (error.name === 'CastError') {
    return res.status(BAD_REQUEST).json({ 
      error: `Invalid ${error.path}: ${error.value}` 
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(BAD_REQUEST).json({ 
      error: `Duplicate ${field}. This ${field} already exists.` 
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Only log unexpected errors (5xx) or errors without a status code
  // Don't log expected client errors (4xx) like 401, 404, etc.
  if (!status || status >= 500) {
    console.error("Error:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }

  // Handle custom HttpError instances
  if (status && message) {
    return res.status(status).json({ error: message });
  }

  // Default to Internal Server Error
  res.status(INTERNAL_SERVER_ERROR).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : error.message || 'Internal Server Error'
  });
};

export const unknownEndpoint = (_req, res) => {
  res.status(NOT_FOUND).send({ error: "Unknown endpoint" });
};