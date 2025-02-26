import {Profile,User} from '../models/userModel.js';

// Update User Profile
export async function updateProfile(req, res) {
    const { linkedin, github, portfolioUrl, address, currentAddress, designation, summary } = req.body;
    try {
        const { userId } = req.params;
        const { linkedin, github } = req.body;

        // Find the user
        const user = await User.findById(userId).populate('profile');
        if (!user) {
            return res.status(404).json({ message: 'User  not found' });
        }

        // Update the profile
        const profile = user.profile;
        profile.linkedin = linkedin || profile.linkedin;
        profile.github = github || profile.github;
        profile.portfolioUrl = portfolioUrl || profile.portfolioUrl;
        profile.address = address || profile.address;
        profile.currentAddress = currentAddress || profile.currentAddress;
        profile.designation = designation || profile.designation;
        profile.summary = summary || profile.summary;

        await profile.save();

        res.status(200).json({ message: 'Profile updated successfully', profile });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}