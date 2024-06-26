import fs from "fs";

import User from "../models/User.mjs";
import path from "path";
/**
 * Get all user profiles (Admin only)
 */
export const getAllProfiles = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: User not authorized",
    });
  }

  try {
    const users = await User.find().select("-password -passwordConfirm");
    res.status(200).json({
      message: "All user profiles",
      data: users,
    });
  } catch (error) {
    console.error(`Error getting profiles: ${error}`);
    res.status(500).json({
      error: "Error getting all profiles",
    });
  }
};

/**
 * Get the current user's profile
 */
export const getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized: User not found",
    });
  }

  try {
    const currentUser = await User.findById(req.user._id).select(
      "-password -passwordConfirm  -createdAt "
    );
    console.log(currentUser);
    const { email, fullName, username, phone, address, image } = currentUser;
    const userInfo = {
      email,
      fullName,
      username,
      address,
      phone,
      image,
    };
    console.log(userInfo);
    res.status(200).json(userInfo);
  } catch (error) {
    console.error(`Error getting profile: ${error}`);
    res.status(500).json({
      error: "Error getting profile",
    });
  }
};

/**
 * Update the current user's profile
 */
export const updateProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized: User not found",
    });
  }
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-password -passwordConfirm");

    res.status(200).json({
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error(`Error updating profile: ${error}`);
    res.status(500).json({
      error: "Error updating profile",
    });
  }
};

/**
 * Update the current user's password
 */
export const updatePassword = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized: User not found",
    });
  }

  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!user || !(await user.correctPassword(currentPassword))) {
      return res.status(401).json({
        error: "Incorrect current password",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        error: "New passwords do not match",
      });
    }

    user.password = newPassword;
    user.passwordConfirm = confirmNewPassword;
    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(`Error updating password: ${error}`);
    res.status(500).json({
      error: "Error updating password",
    });
  }
};

export async function uploadImage(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized: User not found",
    });
  }
  const image = req.files.image;
  try {
    if (!image) {
      return res.status(400).send("No file uploaded");
    }
    const base64String = image[0].buffer.toString("base64");
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }
    user.image = base64String;
    await user.save();
    return res.status(200).json({ message: "image uploaded successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getUsersCharts(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized: User not found",
    });
  }
  try {
    const users = await User.find(
      {},
      {
        password: 0,
        image: 0,
        passwordConfirm: 0,
      }
    );
    const userCountByDate = {};
    users.forEach((user) => {
      const date = user.createdAt.toISOString().split("T")[0];
      if (userCountByDate[date]) {
        userCountByDate[date]++;
      } else {
        userCountByDate[date] = 1;
      }
    });
    console.log(userCountByDate);
    const userCountData = Object.keys(userCountByDate).map((date) => ({
      date: date,
      count: userCountByDate[date],
    }));
    userCountData.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.status(200).json({
      message: "Charts",
      data: userCountData,
    });
  } catch (error) {
    console.error(`Error getting profiles: ${error}`);
    res.status(500).json({
      error: "Error getting all profiles",
    });
  }
}

export const adminUpdateUser = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: User not authorized",
    });
  }
  try {
    const updatedUser = await User.findOneAndUpdate(
      { username: req.body.username },
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-_id -password -passwordConfirm -email -username");

    res.status(200).json({
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error(`Error updating profile: ${error}`);
    res.status(500).json({
      error: "Error updating profile",
    });
  }
};

export async function adminUploadImage(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized: User not found",
    });
  }
  const image = req.files.image;
  try {
    if (!image) {
      return res.status(400).send("No file uploaded");
    }
    const base64String = image[0].buffer.toString("base64");
    const userId = req.body.username;
    const user = await User.find({ username: userId });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }
    user[0].image = base64String;
    await user[0].save();
    return res.status(200).json({ message: "image uploaded successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export const adminDeleteUser = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: User not authorized",
    });
  }
  try {
    const deletedUser = await User.findOneAndDelete({
      username: req.body.username,
    });
    res.status(200).json({
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    console.error(`Error deleting user: ${error}`);
    res.status(500).json({
      error: "Error deleting user",
    });
  }
};
