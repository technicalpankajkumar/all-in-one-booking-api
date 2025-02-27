import { db } from "../config/db";

// Update User Profile
export async function updateProfile(req, res) {
    const { linkedin, github, portfolioUrl, address, currentAddress, designation, summary } = req.body;
    const { userId } = req.params;

    try {
        // Find the user and include the profile
        const user = await db.auth.findUnique({
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
}