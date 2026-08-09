import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { generateToken, getFileNameFromUrl } from "../lib/utils.js";
import { AppError, asyncHandler } from "../middleware/error.middleware.js";
import Role from "../models/role.model.js";
import User from "../models/user.model.js";

const publicUser = (user, roleName) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  dob: user.dob,
  mobile: user.mobile,
  profilePic: user.profilePic || null,
  mustChangePassword: user.mustChangePassword,
  roleId: user.roleId?._id || user.roleId,
  roleName,
});

const isAdult = (value) => {
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return false;
  const adultDate = new Date(birthDate);
  adultDate.setFullYear(adultDate.getFullYear() + 18);
  return adultDate <= new Date();
};

export const signup = asyncHandler(async (req, res) => {
  const { firstName, lastName, password, dob, mobile, roleName } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  if (roleName !== "Customer") {
    throw new AppError(403, "Public signup is only available for customers");
  }
  if (![firstName, lastName, email, password, dob, mobile].every(Boolean)) {
    throw new AppError(400, "All fields are required");
  }
  if (password.length < 6) throw new AppError(400, "Password must be at least 6 characters");
  if (!isAdult(dob)) throw new AppError(400, "You must be at least 18 years old");

  const [existingUser, role] = await Promise.all([
    User.exists({ email }),
    Role.findOne({ roleName: "Customer" }),
  ]);
  if (existingUser) throw new AppError(409, "Email already exists");
  if (!role) throw new AppError(500, "Customer role is not configured");

  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email,
    password: await bcrypt.hash(password, 10),
    dob,
    mobile,
    roleId: role._id,
  });

  generateToken(user._id, res);
  res.status(201).json(publicUser(user, role.roleName));
});

export const login = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;
  if (!email || !password) throw new AppError(400, "Email and password are required");

  const user = await User.findOne({ email }).populate("roleId", "roleName");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(400, "Invalid credentials");
  }

  generateToken(user._id, res);
  res.status(200).json(publicUser(user, user.roleId?.roleName));
});

export const logout = (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = asyncHandler(async (req, res) => {
  const { profilePic } = req.body;
  if (!profilePic) throw new AppError(400, "Profile picture is required");

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError(404, "User not found");

  const previousPublicId = getFileNameFromUrl(user.profilePic);
  const upload = await cloudinary.uploader.upload(profilePic, { folder: "users" });
  user.profilePic = upload.secure_url;
  await user.save();

  if (previousPublicId) {
    cloudinary.uploader.destroy(previousPublicId, { resource_type: "image" }).catch(() => {});
  }

  res.status(200).json(publicUser(user, req.userRole));
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (![currentPassword, newPassword, confirmPassword].every(Boolean)) {
    throw new AppError(400, "All password fields are required");
  }
  if (newPassword !== confirmPassword) {
    throw new AppError(400, "New password and confirm password must match");
  }
  if (newPassword.length < 6) throw new AppError(400, "Password must be at least 6 characters");
  if (newPassword === currentPassword) {
    throw new AppError(400, "New password must differ from the current password");
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError(404, "User not found");
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw new AppError(400, "Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = false;
  await user.save();
  res.status(200).json(publicUser(user, req.userRole));
});

export const checkAuth = (req, res) => {
  res.status(200).json({
    ...req.user.toObject(),
    roleName: req.userRole,
    userID: req.user._id,
  });
};

export const totalUser = asyncHandler(async (req, res) => {
  const roles = await Role.find({ roleName: { $in: ["Customer", "Partner"] } });
  const roleByName = Object.fromEntries(roles.map((role) => [role.roleName, role._id]));
  if (!roleByName.Customer || !roleByName.Partner) {
    throw new AppError(500, "Required roles are not configured");
  }

  const [customers, partners] = await Promise.all([
    User.find({ roleId: roleByName.Customer }).select("-password"),
    User.find({ roleId: roleByName.Partner }).select("-password"),
  ]);

  res.status(200).json({
    totalCustomers: customers.length,
    totalPartners: partners.length,
    customerDetails: customers,
    partnerDetails: partners,
  });
});
