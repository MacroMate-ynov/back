import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface User extends Document {
  name: string;
  email: string;
  password?: string;
  role?: string;
  provider?: string;
  googleId?: string;
  comparePassword: (enteredPassword: string) => boolean;
}

const userSchema = new Schema<User>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    enum: ["user", "coach", "admin"],
    default: "user",
  },
  provider: {
    type: String,
  },
  googleId: {
    type: String,
  },
});

userSchema.pre("validate", function (next) {
  if (!this.password && (!this.provider || this.provider !== "google")) {
    return next(new Error("Password is required if not using Google OAuth"));
  }
  next();
});


userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password)
    return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema);