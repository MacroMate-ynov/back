import jwt from "jsonwebtoken";
import { Response } from "express";
import { environment } from "../env/environment";

const generateToken = (res: Response, userId: string) => {
  const jwtSecret = environment.JWT_SECRET || "";

  if (!jwtSecret) {
    console.error("JWT_SECRET is not defined!");
    throw new Error("JWT_SECRET is missing in environment variables.");
  }

  if (!userId) {
    console.error("User ID is undefined or invalid!");
    throw new Error("Cannot generate token: User ID is missing.");
  }

  console.log("googleId->", userId);
    const token = jwt.sign({userId}, jwtSecret, {
    expiresIn: "1h",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000,
  });

  return token;
};

const clearToken = (res: Response) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  console.log("Cookie cleared");
};

export { generateToken, clearToken };