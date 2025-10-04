import jwt from "jsonwebtoken"; 

export default function authMiddleware (req,res,next) {
  const authHeader = req.header("Authorization");

  const token = authHeader?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id };
      next();
    } catch (err) {
      console.log(err);
      res.status(401).json({ message: "Token is not valid" });
    }
}