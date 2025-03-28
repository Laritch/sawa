/**
 * Custom error class for API errors with status codes
 */
export class ApiError extends Error {
  /**
   * Create a new API error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Error|null} originalError - Original error object if available
   */
  constructor(statusCode, message, originalError = null) {
    super(message);
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.isOperational = true; // Indicates if this is an operational error that we expected

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   * @param {string} message - Error message
   * @returns {ApiError} - Bad request error
   */
  static badRequest(message = 'Bad Request') {
    return new ApiError(400, message);
  }

  /**
   * Create a 401 Unauthorized error
   * @param {string} message - Error message
   * @returns {ApiError} - Unauthorized error
   */
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  /**
   * Create a 403 Forbidden error
   * @param {string} message - Error message
   * @returns {ApiError} - Forbidden error
   */
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  /**
   * Create a 404 Not Found error
   * @param {string} message - Error message
   * @returns {ApiError} - Not found error
   */
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  /**
   * Create a 409 Conflict error
   * @param {string} message - Error message
   * @returns {ApiError} - Conflict error
   */
  static conflict(message = 'Resource conflict') {
    return new ApiError(409, message);
  }

  /**
   * Create a 422 Unprocessable Entity error
   * @param {string} message - Error message
   * @returns {ApiError} - Validation error
   */
  static validationError(message = 'Validation failed') {
    return new ApiError(422, message);
  }

  /**
   * Create a 429 Too Many Requests error
   * @param {string} message - Error message
   * @returns {ApiError} - Rate limit error
   */
  static rateLimit(message = 'Too many requests') {
    return new ApiError(429, message);
  }

  /**
   * Create a 500 Internal Server Error
   * @param {string} message - Error message
   * @param {Error} originalError - Original error object
   * @returns {ApiError} - Server error
   */
  static internal(message = 'Internal server error', originalError = null) {
    return new ApiError(500, message, originalError);
  }
}

/**
 * Global error handler middleware for Express
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorMiddleware = (err, req, res, next) => {
  // Log the error for debugging
  console.error('ERROR:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Set defaults
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  // Prepare response
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Something went wrong',
      statusCode,
      isOperational
    }
  };

  // Add validation errors if they exist
  if (err.errors) {
    errorResponse.error.details = err.errors;
  }

  // Add request ID if available (useful for tracking)
  if (req.id) {
    errorResponse.error.requestId = req.id;
  }

  // In development, include stack trace and original error
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
    if (err.originalError) {
      errorResponse.error.original = {
        message: err.originalError.message,
        stack: err.originalError.stack
      };
    }
  }

  // Send the response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async handler to avoid try/catch blocks in route handlers
 * @param {Function} fn - Route handler function
 * @returns {Function} - Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle uncaught exceptions and unhandled rejections
 * @param {Object} server - HTTP server instance
 */
export const setupErrorHandlers = (server) => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error);

    // Log fatal error and exit gracefully
    if (!error.isOperational) {
      console.error('FATAL ERROR. Shutting down...');
      server.close(() => {
        process.exit(1);
      });
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (error) => {
    console.error('UNHANDLED REJECTION:', error);

    // Log fatal error and exit gracefully
    if (!error.isOperational) {
      console.error('FATAL ERROR. Shutting down...');
      server.close(() => {
        process.exit(1);
      });
    }
  });

  // Handle SIGTERM signal (e.g., when Heroku restarts dynos)
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated.');
    });
  });
};

export default {
  ApiError,
  errorMiddleware,
  asyncHandler,
  setupErrorHandlers
};
