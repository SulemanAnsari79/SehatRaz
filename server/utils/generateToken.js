import jwt from "jsonwebtoken";

const generateToken = (id, role) => {
  return jwt.sign(
    { _id: id, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export default generateToken;
