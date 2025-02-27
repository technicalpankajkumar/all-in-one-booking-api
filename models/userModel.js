import { Schema, model } from 'mongoose';

const authSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    username: { type: String, unique: true , unique: true},
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    // Reference to the Profile schema
    profile: { type: Schema.Types.ObjectId, ref: 'Profile' },
}, { timestamps: true });

// Profile Schema
const profileSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'Auth ' }, // Reference to User
    currentAddress: { type: String },
    parmanentAddress: { type: String },
    designation: { type: String },
    summary: { type: String },
    language: { type: String },
    isExperience : {type:Boolean},
    linkedin: { type: String },
    github: { type: String },
    portfolioUrl: { type: String },
}, { timestamps: true });

const Auth = model('Auth ', authSchema);
const Profile = model('Profile ', profileSchema);

export { Auth, Profile}
