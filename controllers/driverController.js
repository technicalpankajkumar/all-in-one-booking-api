import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";
import fs from "fs";
import ErrorHandler from "../utils/errorHandler.js";
import { generateRandomPassword, generateUniqueUsername } from "./authController.js";
import sendMail from "../utils/sendEmail.js";

// create driver // tested ! 1 //
export const createDriver = CatchAsyncError(async (req, res, next) => {
  try {
    const { data } = req.body;
    const user = req.user;
    const newData = typeof data === "object" ? data : JSON.parse(data);

    const {
      full_name,
      father_name,
      email,
      mobile,
      alternate_mobile,
      dob,
      gender,
      current_address,
      permanent_address,
      city,
      state,
      country,
      pincode,
      aadhar_number,
      pan_number,
      driving_license_number,
      driving_license_expiry,
      bank_account_number,
      bank_ifsc,
      bank_name,
      account_holder_name,
      upi_id,
      experience_years,
      languages_known,
      emergency_contact_name,
      emergency_contact_number,
      emergency_contact_relation,
      assigned_car_id,
    } = newData;

    // ----------------------------------------------------------------------
    // 1️⃣ Check if driver/auth already exists
    // ----------------------------------------------------------------------
    const existingAuth = await db.auth.findFirst({
      where: { OR: [{ email }, { mobile }] },
    });

    if (existingAuth) {
      return next(
        new ErrorHandler("This email or mobile is already registered.", 400)
      );
    }

    // ----------------------------------------------------------------------
    // 2️⃣ Create Auth for Driver
    // ----------------------------------------------------------------------
    const randomPassword = generateRandomPassword();
    const username = await generateUniqueUsername(full_name, email);

    const auth = await db.auth.create({
      data: {
        name: full_name,
        email,
        mobile,
        username,
        password: randomPassword,
        role: "DRIVER",
        is_verified: true,
      },
    });

    // ----------------------------------------------------------------------
    // 3️⃣ Create Profile
    // ----------------------------------------------------------------------
    await db.profile.create({
      data: {
        auth_id: auth.id,
        father_name,
        alternate_mobile,
        dob: dob ? new Date(dob) : null,
        gender,
        experience_years: Number(experience_years),
        current_address,
        permanent_address,
        city,
        state,
        country,
        pincode,
        language: languages_known || [],
      },
    });

    // ----------------------------------------------------------------------
    // 4️⃣ Create Driver
    // ----------------------------------------------------------------------
    const driver = await db.driver.create({
      data: {
        auth_id: auth.id,
        aadhar_number,
        pan_number,
        driving_license_number,
        driving_license_expiry: driving_license_expiry
          ? new Date(driving_license_expiry)
          : null,
        bank_account_number,
        bank_ifsc,
        bank_name,
        account_holder_name,
        upi_id,
        emergency_contact_name,
        emergency_contact_number,
        emergency_contact_relation,
        assigned_car_id,
        created_by_id:user.id
      },
    });

    // ----------------------------------------------------------------------
    // 5️⃣ Save Uploaded Images
    // ----------------------------------------------------------------------
    const files = req.files ?? [];
    const fileFields = Object.keys(files);

    for (const field of fileFields) {
      const file = files[field][0];

      await db.driverImage.create({
        data: {
          driver_id: driver.id,
          image_type: field,
          image_path: file.path.replace(/.*uploads/, "/uploads"),
        },
      });
    }

    // ----------------------------------------------------------------------
    // 6️⃣ Send welcome email with username + password
    // ----------------------------------------------------------------------
    sendMail({
      email,
      subject: `Welcome ${full_name} - Driver Account Created`,
      template: "welcomeDriver.ejs",
      data: {
        name: full_name,
        username,
        password: randomPassword,
      },
    });

    // ----------------------------------------------------------------------
    // 7️⃣ Final Response
    // ----------------------------------------------------------------------
    res.status(201).json({
      success: true,
      message: "Driver account created successfully!",
      auth,
      profileCreated: true,
      driver,
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});

export const updateDriver = CatchAsyncError(async (req, res, next) => {
  try {
    const { driverId } = req.params;

    const { data, deletedImages } = req.body;

    if (!data) throw new ErrorHandler("No data provided", 400);

    const updateData = typeof data === "string" ? JSON.parse(data) : data;

    // Destructure incoming data
    const {
      auth,
      profile,
      driver: driverFields,
    } = updateData;

    // 1️⃣ Update Auth table
    if (auth) {
      await db.auth.update({
        where: { id: auth.id },
        data: {
          name: auth.name,
          email: auth.email,
          mobile: auth.mobile,
        },
      });
    }

    // 2️⃣ Update Profile table
    if (profile) {
      await db.profile.update({
        where: { auth_id: auth.id },
        data: profile,
      });
    }

    // 3️⃣ Update Driver fields
    let driver = await db.driver.update({
      where: { id: driverId },
      data: driverFields,
    });

    // 4️⃣ Delete selected old images
    if (deletedImages) {
      const deleteList = JSON.parse(deletedImages);

      for (const imageId of deleteList) {
        const image = await db.driverImage.findUnique({
          where: { id: imageId },
        });

        if (image) {
          const filePath = `.${image.image_path}`;
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

          await db.driverImage.delete({
            where: { id: imageId },
          });
        }
      }
    }

    // 5️⃣ Add new uploaded images
    const files = req.files || {};

    for (const field in files) {
      const file = files[field][0];

      await db.driverImage.create({
        data: {
          driver_id: driverId,
          image_type: field, // must match enum value
          image_path: file.path.replace(/.*uploads/, "/uploads"),
        },
      });
    }

    // 6️⃣ Fetch full updated driver record
    const updatedDriver = await db.driver.findUnique({
      where: { id: driverId },
      include: {
        images: true,
        auth: {
          include: { profile: true },
        },
      },
    });

    res.json({
      success: true,
      message: "Driver updated successfully",
      driver: updatedDriver,
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});

export const getDriver = CatchAsyncError( async (req, res,next) => {
  try {
    const drivers = await db.driver.findMany({ include: { car: true ,images:true} });
    res.status(200).json({ success: true, drivers });
  } catch (err) {
    next(new ErrorHandler(err.message, 500))
  }
});

export const getDriverById = CatchAsyncError(async (req, res,next) => {
  try{
    const { id } = req.params;

  const driver = await db.driver.findUnique({
    where: { id },
    include: { images: true,  car: {
      include: {
        images: true        // car images
      }
    } }
  });

  if (!driver) {
    throw new ErrorHandler("Driver not found", 404);
  }

  res.json({ success: true, driver });
}catch(err){
  next(new ErrorHandler(err.message, 500))
}
});


export const deleteDriver = CatchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch driver with images + auth reference
    const driver = await db.driver.findUnique({
      where: { id },
      include: {
        Images: true,
        Auth: true
      }
    });

    if (!driver) {
      return next(new ErrorHandler("Driver not found", 404));
    }

    const authId = driver.auth_id;

    // 1️⃣ Delete all image files from local storage
    for (const img of driver.Images) {
      if (img.image_path) {
        const filePath = path.join(process.cwd(), img.image_path.replace("/uploads", "uploads"));

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // 2️⃣ Use a transaction for database cleanup
    await db.$transaction(async (prisma) => {
      // Delete images
      await prisma.driverImage.deleteMany({
        where: { driver_id: id }
      });

      // Delete profile
      await prisma.profile.deleteMany({
        where: { auth_id: authId }
      });

      // Delete driver table entry
      await prisma.driver.delete({
        where: { id }
      });

      // Delete auth (last)
      await prisma.auth.delete({
        where: { id: authId }
      });
    });

    return res.json({
      success: true,
      message: "Driver and all related data deleted successfully"
    });

  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});

