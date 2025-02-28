import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";

// Create User Profile

export  const createProfile = CatchAsyncError( async (req,res,next)=>{
    const { linkedin, github, portfolioUrl, address, currentAddress, designation, summary } = req.body;
    const userId = req.userId;

    // Create a new profile for the user
    // await db.Profile.create({
    //     data: {
    //         auth_id: user.id, // Assuming userId is the foreign key in Profile
    //     },
    // });     
    
    res.status(200).send({message:"Tesing",data:userId})
})
// Update User Profile
export const updateProfile = CatchAsyncError( async (req, res,next)=> {
    const { linkedin, github, portfolioUrl, address, currentAddress, designation, summary } = req.body;
    const { userId } = req.params;

    try {
        // Find the user and include the profile
        const user = await db.Auth.findFirst({
            where: { id: userId },
            include: { profile: true }, // Include the profile relation
        });

        if (!user) {
            return res.status(404).json({ message: 'User  not found' });
        }

        // Update the profile
        const updatedProfile = await db.profile.update({
            where: { id: user.profileId }, // Assuming profileId is the foreign key in Auth
            data: {
                linkedin: linkedin || user.profile.linkedin,
                github: github || user.profile.github,
                portfolio_url: portfolioUrl || user.profile.portfolio_url,
                current_address: currentAddress || user.profile.current_address,
                permanent_address: address || user.profile.permanent_address,
                designation: designation || user.profile.designation,
                summary: summary || user.profile.summary,
            },
        });

        res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})