import { Schema, model } from 'mongoose';

const experienceSchema = new Schema({
    company_name:{type:String,required:true },
    profile: {type: Schema.Types.ObjectId,ref:"Profile" },
    from_date: {type: Date,required:true},
    to_date: { type: Date,},
    description: { type: String},
    role: { type: String, required: true },
},{timestamps:true})

const projectSchema = new Schema({
    name:{type:String, required:true},
    role:{type:String, required:true},
    description:{ type: Text, },
    from_date: {type:Date, required:true},
    to_date:{type:Date},
    profile: {type: Schema.Types.ObjectId, ref:'Profile'}
},{timestamps:true});

const educationSchema = new Schema({
    name: { type: String, required: true },
    from_date: { type: Date, required: true },
    to_date: { type: Date, required: true },
    college_name: { type: String, required: true },
    profile: {type: Schema.Types.ObjectId, ref:'Profile'}
},{timestamps:true})

const skillSchema = new Schema({
    front_end: { type: String, required: true },
    back_end: { type: String, required: true },
    database_end: { type: String, required: true },
    version_control: { type: String, required: true },
    project_management: { type: String, required: true },
    other: { type: String, required: false },
    description: { type: Text, required: true },
    profile: {type: Schema.Types.ObjectId, ref:'Profile', required: true }
},{timestamps:true})

const referenceSchema = new mongoose.Schema({
    profile: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
},{timestamps:true});

const internApprendiceshipSchema = new mongoose.Schema({
    profile: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    companyName: { type: String, required: true },
    role: { type: String, required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    description: { type: String, required: true },
},{timestamps:true});

const Experience = model("Experience",experienceSchema)
const Project = model("Project",projectSchema)
const Education = model("Education",educationSchema)
const Skill = model("Skill",skillSchema)
const InternApprendiceship = model("InternApprendiceship",internApprendiceshipSchema)
const Reference = model("Reference",referenceSchema)

export {Experience}