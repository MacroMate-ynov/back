import { User } from "../models/User";

class UserFactory {
  static async createUser(
    name: string,
    email: string,
    password: string,
    role: string = "user"
  ) {
    if (!name || !email || !password) {
      return { error: "All fields (name, email, password) are required" };
    }

    if (!UserFactory.isValidEmail(email)) {
      return { error: "Invalid email address" };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long" };
    }
    if (!["user", "admin"].includes(role)) {
      return { error: "Invalid user role" };
    }


    const user = new User({ name, email, password, role });

    try {
      await user.save();
      return user;
    } catch (error) {
      console.error("Error saving user:", error);
      return { error: "Error saving user to the database" };
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default UserFactory;
