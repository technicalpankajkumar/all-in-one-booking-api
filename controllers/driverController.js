import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";
import fs from "fs";
import ErrorHandler from "../utils/errorHandler.js";
import { generateRandomPassword, generateUniqueUsername } from "./authController.js";
import sendMail from "../utils/sendEmail.js";
import path from "path";

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
        created_by_id: user.id
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

// update driver // tested ! 1 //
export const updateDriver = CatchAsyncError(async (req, res, next) => {
  try {
    const { driverId } = req.params;

    if (!driverId) {
      return next(new ErrorHandler("Driver ID is required", 400));
    }

    // ----------------------------------------------------------------------
    // 1️⃣ Parse incoming data (matches createDriver)
    // ----------------------------------------------------------------------
    const { data, deletedImages } = req.body;
    if (!data) return next(new ErrorHandler("No update data provided", 400));

    const updateData = typeof data === "object" ? data : JSON.parse(data);

    const {
      auth: authFields,
      profile: profileFields,
      driver: driverFields,
    } = updateData;

    // Fetch existing driver
    const existingDriver = await db.driver.findUnique({
      where: { id: driverId },
      include: {
        auth: { include: { profile: true } },
        images: true,
      }
    });

    if (!existingDriver) {
      return next(new ErrorHandler("Driver not found", 404));
    }

    // ----------------------------------------------------------------------
    // 2️⃣ Update Auth (email, mobile, name)
    // ----------------------------------------------------------------------
    if (authFields) {
      await db.auth.update({
        where: { id: existingDriver.auth_id },
        data: {
          name: authFields.name,
          email: authFields.email,
          mobile: authFields.mobile,
        },
      });
    }

    // ----------------------------------------------------------------------
    // 3️⃣ Update Profile
    // ----------------------------------------------------------------------
    if (profileFields) {
      await db.profile.update({
        where: { auth_id: existingDriver.auth_id },
        data: {
          ...profileFields,
          dob: profileFields.dob ? new Date(profileFields.dob) : null,
          experience_years: Number(profileFields.experience_years),
        },
      });
    }

    // ----------------------------------------------------------------------
    // 4️⃣ Update Driver table
    // ----------------------------------------------------------------------
    let driver = await db.driver.update({
      where: { id: driverId },
      data: {
        ...driverFields,
        driving_license_expiry: driverFields?.driving_license_expiry
          ? new Date(driverFields.driving_license_expiry)
          : null,
      },
    });

    // ----------------------------------------------------------------------
    // 5️⃣ Delete Selected Images (from DB + folder)
    // ----------------------------------------------------------------------
    if (deletedImages) {
      const deleteList = JSON.parse(deletedImages);

      for (const imageId of deleteList) {
        const img = await db.driverImage.findUnique({ where: { id: imageId } });
        if (img) {
          const filePath = "." + img.image_path; // convert to filesystem path

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          await db.driverImage.delete({
            where: { id: imageId },
          });
        }
      }
    }

    // ----------------------------------------------------------------------
    // 6️⃣ Add New Uploaded Images (update or create)
    // ----------------------------------------------------------------------
    const files = req.files || {};

    for (const field in files) {
      const file = files[field][0];
      const newImagePath = file.path.replace(/.*uploads/, "/uploads");

      // 1️⃣ Check if an image of this type already exists for this driver
      const existingImage = await db.driverImage.findFirst({
        where: {
          driver_id: driverId,
          image_type: field
        }
      });

      // 2️⃣ If existing → delete old file + remove DB entry
      if (existingImage) {
        const oldFilePath = `.${existingImage.image_path}`;
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath); // delete file from folder
        }

        await db.driverImage.delete({
          where: { id: existingImage.id }
        });
      }

      // 3️⃣ Add new image entry
      await db.driverImage.create({
        data: {
          driver_id: driverId,
          image_type: field,
          image_path: newImagePath
        }
      });
    }


    // ----------------------------------------------------------------------
    // 7️⃣ Return updated driver with full relation data
    // ----------------------------------------------------------------------
    const updatedDriver = await db.driver.findUnique({
      where: { id: driverId },
      include: {
        images: true,
        auth: { include: { profile: true } }
      }
    });

    res.status(200).json({
      success: true,
      message: "Driver updated successfully!",
      driver: updatedDriver,
    });

  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});

// get drivers // tested ! 1 //
export const getDriver = CatchAsyncError(async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const assigned_car_id = req.query.assigned_car_id || null;
    const status = req.query.status || null;

    const search = req.query.search?.toString() || "";
    const sortBy = req.query.sortBy?.toString() || "created_at";
    const sortOrder = req.query.sortOrder?.toString() === "asc" ? "asc" : "desc";

    // --------------------------------------------
    // 1️⃣ Build Search Conditions
    // --------------------------------------------
    let where = {};

    if (search) {
      where.OR = [
        { auth: { name: { contains: search, mode: "insensitive" } } },
        { auth: { email: { contains: search, mode: "insensitive" } } },
        { auth: { mobile: { contains: search } } },
        { aadhar_number: { contains: search } },
        { pan_number: { contains: search } },
      ];
    }

    // Optional filters
    if (assigned_car_id) where.assigned_car_id = assigned_car_id;
    if (status) where.status = status;

    // --------------------------------------------
    // 2️⃣ Fetch Drivers
    // --------------------------------------------
    const drivers = await db.driver.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),

      orderBy: {
        [sortBy]: sortOrder,
      },

      include: {
        images: true,
        car: true,
        auth: {
          include: { profile: true },
        },
      },
    });

    // --------------------------------------------
    // 3️⃣ Count for Pagination
    // --------------------------------------------
    const total = await db.driver.count({ where });

    res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      drivers,
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});

// getbyid driver // tested ! 1 //
export const getDriverById = CatchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;

    const driver = await db.driver.findUnique({
      where: { id },
      include: {
        images: true,
        car: {
          include: {
            images: true   // Include car images
          }
        },
        auth: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!driver) {
      throw new ErrorHandler("Driver not found", 404);
    }

    res.json({ success: true, driver });
  } catch (err) {
    next(new ErrorHandler(err.message, 500))
  }
});

// hard delete of driver // tested ! 1 //
export const deleteDriver = CatchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch driver with relations
    const driver = await db.driver.findUnique({
      where: { id },
      include: {
        images: true,
        auth: {
          include: { profile: true }
        }
      }
    });

    if (!driver) {
      return next(new ErrorHandler("Driver not found", 404));
    }

    const authId = driver.auth_id;

    // ----------------------------------------------------------------------
    // 1️⃣ Delete physical image files from uploads folder
    // ----------------------------------------------------------------------
    for (const img of driver.images) {
      if (img.image_path) {
        const filePath = path.join(
          process.cwd(),
          img.image_path.replace("/uploads", "uploads")
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // ----------------------------------------------------------------------
    // 2️⃣ Hard Delete Everything using Prisma Transaction
    // ----------------------------------------------------------------------
    await db.$transaction(async (tx) => {
      // Delete Driver Images
      await tx.driverImage.deleteMany({
        where: { driver_id: driver.id }
      });

      // Delete Profile
      await tx.profile.deleteMany({
        where: { auth_id: authId }
      });

      // Delete Driver
      await tx.driver.delete({
        where: { id: driver.id }
      });

      // Delete Auth
      await tx.auth.delete({
        where: { id: authId }
      });
    });

    // ----------------------------------------------------------------------
    // 3️⃣ Success Response
    // ----------------------------------------------------------------------
    return res.status(200).json({
      success: true,
      message: "Driver and all related records deleted successfully"
    });

  } catch (err) {
    return next(new ErrorHandler(err.message, 500));
  }
});

