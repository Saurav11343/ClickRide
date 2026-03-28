import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePartnerStore } from "../../store/usePartnerStore";
import toast from "react-hot-toast";
import authBg from "../../assets/img/LoginBg.webp";
import { Camera } from "lucide-react";
import { Video } from "lucide-react";
import { Loader } from "lucide-react";

export default function PartnerSignup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dob: "",
    mobile: "",
    gender: "",
    profilePic: "",
    profileVideo: "",
    roleName: "Partner",
  });

  const { partnerSignup, isSigningUp } = usePartnerStore();
  const navigate = useNavigate();

  const [selectedImg, setSelectedImg] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error("First Name is Required");
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last Name is Required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Invalid email format");
      return false;
    }
    if (!formData.mobile) {
      toast.error("Mobile Number is Required");
      return false;
    }
    if (!formData.gender) {
      toast.error("Gender is Required");
      return false;
    }
    if (!formData.dob) {
      toast.error("Date of Birth is required");
      return false;
    }
    const dob = new Date(formData.dob);
    const age = new Date().getFullYear() - dob.getFullYear();
    if (age < 18) {
      toast.error("You must be 18 years or older to sign up");
      return false;
    }
    if (!formData.profilePic) {
      toast.error("Profile Image is required");
      return false;
    }
    if (formData.profilePic.size > 2 * 1024 * 1024) {
      // 2MB limit
      toast.error("Profile Image must be less than 2MB");
      return false;
    }
    if (!formData.profileVideo) {
      toast.error("Profile Video is required");
      return false;
    }
    if (formData.profileVideo.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast.error("Profile Video must be less than 10MB");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (isValid === true) {
      try {
        const response = await partnerSignup(formData);
        if (response.success) {
          navigate("/login");
        }
      } catch (error) {
        toast.error("An error occurred during signup.");
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Profile Image must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setSelectedImg(reader.result);
        setFormData((prevData) => ({ ...prevData, profilePic: reader.result }));
      };
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Profile Video must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setSelectedVideo(reader.result);
        setFormData((prevData) => ({
          ...prevData,
          profileVideo: reader.result,
        }));
      };
    }
  };
  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${authBg})` }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-10 backdrop-blur-lg p-6 px-8 rounded-lg shadow-lg w-full max-w-3xl"
      >
        <div className="mb-6 text-center">
          <h2 className="text-4xl font-semibold text-white">
            <Link to="/">
              <span className="text-white">Click</span>
              <span className="text-teal-500">Ride</span>
              <span className="text-white"> Partner</span>
            </Link>
          </h2>
        </div>
        {/* Grid Layout for Image, Video, and Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Column: Image and Video Upload */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="relative">
              <label
                htmlFor="avatar-upload"
                className="block text-white text-base font-medium"
              >
                Profile Image
              </label>
              <img
                src={selectedImg || "/avatar.png"} // Use selectedImg if available, otherwise fallback to default avatar
                alt="Profile"
                className="w-full h-40 rounded-lg object-cover border-4 border-blue-500 shadow-lg"
              />
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 p-2 rounded-full cursor-pointer transition-all duration-200 ${isSigningUp ? "animate-pulse pointer-events-none" : ""}`}
              >
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isSigningUp}
                />
              </label>
              <p className="text-white text-xs mt-2 text-center w-40 mx-auto">
                Your face should be clearly visible in the profile image.
              </p>
            </div>

            {/* Video Upload */}
            <div className="relative">
              <label
                htmlFor="video-upload"
                className="block text-white text-base font-medium"
              >
                Profile Video
              </label>
              {selectedVideo ? (
                <video
                  className="w-full h-40 object-cover border-4  border-blue-500 shadow-lg"
                  controls
                >
                  <source src={selectedVideo} type="video/mp4" />
                </video>
              ) : (
                <div className="w-full h-40 border-4  border-blue-500 flex justify-center items-center bg-gray-300">
                  <p className="text-center text-white">No Video Selected</p>
                </div>
              )}
              <label
                htmlFor="video-upload"
                className={`absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 p-2 rounded-full cursor-pointer transition-all duration-200 ${isSigningUp ? "animate-pulse pointer-events-none" : ""}`}
              >
                <Video className="w-6 h-6 text-white" />
                <input
                  type="file"
                  id="video-upload"
                  className="hidden"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={isSigningUp}
                />
              </label>
              <p className="text-white text-xs mt-2 text-center w-44 mx-auto">
                Your face video with something moving in the background.
              </p>
            </div>
          </div>

          {/* Second Column: User Details */}
          <div className="space-y-6">
            {/* First and Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-white text-base font-medium"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-white text-base font-medium"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-white text-base font-medium"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter your email address"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label
                htmlFor="mobile"
                className="block text-white text-base font-medium"
              >
                Mobile Number
              </label>
              <input
                type="tel"
                id="mobile"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                placeholder="Enter your mobile number"
              />
            </div>

            {/* Gender */}
            <div>
              <label
                htmlFor="gender"
                className="block text-white text-base font-medium"
              >
                Gender
              </label>
              <select
                id="gender"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label
                htmlFor="dob"
                className="block text-white text-base font-medium"
              >
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
              />
            </div>
          </div>
        </div>
        {/* Information Disclaimer */}
        <div className="text-center text-white mt-4">
          <p className="text-sm">
            Your personal information such as name, image, and video will only
            be used for verification purposes and will be deleted within 1 to 2
            weeks.
          </p>
        </div>

        {/* Submit Button */}
        <div className="text-center mt-6">
          {isSigningUp ? (
            <div className="flex items-center+ justify-center">
              <Loader className="size-10 animate-spin text-white" />
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-2 px-4 bg-teal-500 text-white font-semibold rounded-lg focus:outline-none hover:bg-teal-600"
            >
              Sign Up
            </button>
          )}
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-white font-bold">
            Already Registered?{" "}
            <Link to="/Login" className="text-teal-500 font-bold">
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
