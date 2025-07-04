/**
 * Extract client information from request
 * @param {Object} req - Express request object
 * @returns {Object} Client information
 */
export const getClientInfo = (req) => {
  const ipAddress = req.ip || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress || 
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   req.headers['x-forwarded-for']?.split(',')[0] ||
                   req.headers['x-real-ip'] ||
                   null;

  const userAgent = req.headers['user-agent'] || null;

  return {
    ipAddress,
    userAgent
  };
}; 