export const ensure2FA = (req, res, next) => {
  if (!req.session.is2FAVerified) {
    return res.status(403).json({
      message: "2FA verification required"
    });
  }

  next();
};
