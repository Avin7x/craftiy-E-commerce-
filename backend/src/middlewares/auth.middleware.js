import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const isAuth = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        message: "Unauthorized - no access token provided",
      });
    }

    // jwt.verify throws TokenExpiredError or JsonWebTokenError on failure
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Unauthorized - access token expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Unauthorized - invalid access token",
      });
    }

    console.error("Error in isAuth middleware:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


