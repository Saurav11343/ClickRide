import crypto from "crypto";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { getFileNameFromUrl } from "../lib/utils.js";
import { AppError, asyncHandler } from "../middleware/error.middleware.js";
import { rejectEmail, sendVerificationEmail } from "../middleware/nodemailer/emails.js";
import PartnerRequest from "../models/partnerRequest.model.js";
import Role from "../models/role.model.js";
import User from "../models/user.model.js";

const destroyAsset = async (url, resourceType) => {
  const publicId = getFileNameFromUrl(url);
  if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export const partnerSignup = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    dob,
    mobile,
    roleName,
    gender,
    profilePic,
    profileVideo,
  } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  if (roleName !== "Partner") throw new AppError(403, "Invalid partner role");
  if (![firstName, lastName, email, dob, mobile, gender, profilePic, profileVideo].every(Boolean)) {
    throw new AppError(400, "All fields are required");
  }

  const birthDate = new Date(dob);
  const adultDate = new Date(birthDate);
  adultDate.setFullYear(adultDate.getFullYear() + 18);
  if (Number.isNaN(birthDate.getTime()) || adultDate > new Date()) {
    throw new AppError(400, "You must be at least 18 years old");
  }

  const [pending, existingUser, role] = await Promise.all([
    PartnerRequest.exists({ email }),
    User.exists({ email }),
    Role.findOne({ roleName: "Partner" }),
  ]);
  if (pending || existingUser) throw new AppError(409, "Email already exists");
  if (!role) throw new AppError(500, "Partner role is not configured");

  const [pictureUpload, videoUpload] = await Promise.all([
    cloudinary.uploader.upload(profilePic, {
      folder: "partners/profile_pics",
      resource_type: "image",
    }),
    cloudinary.uploader.upload(profileVideo, {
      folder: "partners/profile_videos",
      resource_type: "video",
    }),
  ]);

  try {
    const request = await PartnerRequest.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      dob,
      mobile,
      gender,
      profilePic: pictureUpload.secure_url,
      profileVideo: videoUpload.secure_url,
      roleId: role._id,
    });

    res.status(201).json({
      message: "Partner request submitted successfully. Awaiting admin approval.",
      requestId: request._id,
    });
  } catch (error) {
    await Promise.allSettled([
      destroyAsset(pictureUpload.secure_url, "image"),
      destroyAsset(videoUpload.secure_url, "video"),
    ]);
    throw error;
  }
});

export const partnerRequest = asyncHandler(async (req, res) => {
  const requests = await PartnerRequest.find().select("-password").sort({ createdAt: -1 });
  res.status(200).json({
    totalPartnerRequest: requests.length,
    partnerRequestDetails: requests,
  });
});

export const deletePartnerRequest = asyncHandler(async (req, res) => {
  const request = await PartnerRequest.findById(req.body.partnerID);
  if (!request) throw new AppError(404, "Partner request not found");

  await Promise.allSettled([
    destroyAsset(request.profileVideo, "video"),
    destroyAsset(request.profilePic, "image"),
    rejectEmail(request.email, `${request.firstName} ${request.lastName}`),
  ]);
  await request.deleteOne();

  res.status(200).json({ message: "Partner request deleted successfully" });
});

export const validatePartnerRequest = asyncHandler(async (req, res) => {
  const request = await PartnerRequest.findById(req.body.partnerID);
  if (!request) throw new AppError(404, "Partner request not found");
  if (await User.exists({ email: request.email })) {
    throw new AppError(409, "A user with this email already exists");
  }

  const temporaryPassword = crypto.randomInt(100000, 1000000).toString();
  const user = await User.create({
    firstName: request.firstName,
    lastName: request.lastName,
    email: request.email,
    password: await bcrypt.hash(temporaryPassword, 10),
    mobile: request.mobile,
    dob: request.dob,
    profilePic: request.profilePic,
    roleId: request.roleId,
    gender: request.gender,
    mustChangePassword: true,
  });

  try {
    await sendVerificationEmail(request.email, temporaryPassword);
    await request.deleteOne();
  } catch (error) {
    await user.deleteOne();
    throw error;
  }

  res.status(200).json({ message: "Partner approved and credentials emailed" });
});
