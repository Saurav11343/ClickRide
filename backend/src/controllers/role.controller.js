import { asyncHandler } from "../middleware/error.middleware.js";
import Role from "../models/role.model.js";

const predefinedRoles = [
  { roleName: "Customer", roleDescription: "Regular user of the platform." },
  { roleName: "Admin", roleDescription: "Administrator with full access." },
  { roleName: "Partner", roleDescription: "Partner who lists vehicles for rental." },
];

export const addPreDefinedRole = asyncHandler(async (req, res) => {
  await Promise.all(
    predefinedRoles.map(({ roleName, roleDescription }) =>
      Role.updateOne(
        { roleName },
        { $setOnInsert: { roleName, roleDescription } },
        { upsert: true },
      ),
    ),
  );

  res.status(200).json({ message: "Predefined roles are ready" });
});
