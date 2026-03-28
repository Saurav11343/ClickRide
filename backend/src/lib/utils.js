import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export const getFileNameFromUrl = (url) => {
  if (!url) return null;
  const urlArray = url.split("/");
  const uploadIndex = urlArray.indexOf("upload");
  if (uploadIndex === -1 || uploadIndex === urlArray.length - 1) {
    return null;
  }
  const publicIdArray = urlArray.slice(uploadIndex + 2);
  const fileNameWithExt = publicIdArray[publicIdArray.length - 1];
  const fileName = fileNameWithExt.split(".")[0];
  return publicIdArray
    .slice(0, publicIdArray.length - 1)
    .concat(fileName)
    .join("/");
};
