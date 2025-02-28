
import "dotenv/config"
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from "url";
import { CatchAsyncError } from "./catchAsyncError.js";
// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sendMail = CatchAsyncError(async (options)=>{
    const transporter = nodemailer.createTransport({
        host:process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        // service:process.env.SMTP_SERVICE,
        auth:{
            user:process.env.SMTP_MAIL,
            pass:process.env.SMTP_PASSWORD
        },
    });

    const {email,subject,template,data}=options;
    //get the pdath to the email template file
    const templatePath = path.join(__dirname,'../mail_templates',template)

    //render the email template with EJS
    const html = await ejs.renderFile(templatePath,data);

    const mailOptions = {
        from:process.env.SMTP_MAIL,
        to:email,
        subject,
        html,
    }
    await transporter.sendMail(mailOptions);
})

export default sendMail;