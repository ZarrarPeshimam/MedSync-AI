import express from "express"
import HealthProfile from "../models/HealthProfile.js"
import authMiddleware from "../middlewares/authMiddleware.js"

const router = express.Router();

router.get("/", authMiddleware, async (req,res)=>{
    try{
        const profile = await HealthProfile.findOne({ user: req.user.id });
        if(profile) res.json({profile});
        else {
            // Return an empty profile if none exists
            return res.json({ message: "No profile found", profile: null });
          }
    }
    catch(err){
        res.status(500).json({message : err.message});
    }
})

// Create/Update health profile
router.post("/", authMiddleware, async (req,res)=>{
    try{
        let profile = await HealthProfile.findOne({ user: req.user.id });
        if(profile){
            profile = await HealthProfile.findOneAndUpdate(
                { user: req.user.id },
                req.body,
                { new: true }
            );
        }
        else{
            profile = new HealthProfile({...req.body, user: req.user.id});
            await profile.save();
        }
        res.json({profile});
    }
    catch(err){
        res.status(500).json({message : err.message});
    }
});

export default router;