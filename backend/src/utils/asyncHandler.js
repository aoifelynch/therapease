/**
 * Wrapper for async route handlers to catch errors and pass them to Express error middleware
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express route handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
