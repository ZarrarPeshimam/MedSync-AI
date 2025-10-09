import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleTokens: {
    type: Object,  // stores access_token, refresh_token, expiry_date, etc.
    default: null,
  },
}, { timestamps: true });

export default mongoose.model("User", userSchema);