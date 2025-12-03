import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";
import fs from "fs";
import ErrorHandler from "../utils/errorHandler.js";

export const createDriver = CatchAsyncError(async (req, res,next) => {
  try{
    const {data} = req.body;
    const newData = typeof data == 'object' ? data : JSON.parse(data)

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
    assigned_car_id
  } = newData;



   const dataExist = await db.driver.findUnique({
     where: { email,mobile }
   });
   if(dataExist){
        return next(new ErrorHandler('This email/mobile already exist.', 400))
    }
  // Create Driver
  const driver = await db.driver.create({
    data: {
      full_name,
      father_name,
      email,
      mobile,
      alternate_mobile,
      dob: dob ? new Date(dob) : null,
      gender,
      current_address,
      permanent_address,
      city,
      state,
      pincode,
      aadhar_number,
      pan_number,
      driving_license_number,
      driving_license_expiry: driving_license_expiry ? new Date(driving_license_expiry) : null,
      bank_account_number,
      bank_ifsc,
      bank_name,
      account_holder_name,
      upi_id,
      experience_years: Number(experience_years),
      languages_known: languages_known ? languages_known : [],
      emergency_contact_name,
      emergency_contact_number,
      emergency_contact_relation,
      assigned_car_id
    }
  });
  console.log(newData,'ndw')
  // Save uploaded images
  const files = req.files ?? [];
  const allFiles = Object.keys(files);

  for (const field of allFiles) {
    const file = files[field][0];

    await db.driverImage.create({
      data: {
        driver_id: driver.id,
        image_type: field,
        image_path: file.path.replace(/.*uploads/, "/uploads")
      }
    });
  }

  res.status(201).json({
    success: true,
    message: "Driver added successfully",
    driver
  });
}catch(err){
  next(new ErrorHandler(err.message, 500))
}
});

export const getDriver = CatchAsyncError( async (req, res,next) => {
  try {
    const drivers = await db.driver.findMany({ include: { Car: true ,images:true} });
    res.status(200).json({ success: true, drivers });
  } catch (err) {
    next(new ErrorHandler(err.message, 500))
  }
});

export const getDriverById = CatchAsyncError(async (req, res) => {
  try{
    const { id } = req.params;

  const driver = await db.driver.findUnique({
    where: { id },
    include: { images: true, Car:true }
  });

  if (!driver) {
    throw new ErrorHandler("Driver not found", 404);
  }

  res.json({ success: true, driver });
}catch(err){
  next(new ErrorHandler(err.message, 500))
}
});

export const deleteDriverImage = CatchAsyncError(async (req, res) => {
 try {
    const { imageId } = req.params;

  const image = await db.driverImage.findUnique({ where: { id: imageId } });

  if (!image) throw new ErrorHandler("Image not found", 404);

  // Delete file physically
  const filePath = `.${image.image_path}`;
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  // Delete DB entry
  await db.driverImage.delete({ where: { id: imageId } });

  res.json({ success: true, message: "Image deleted successfully" });
}catch(err){
  next(new ErrorHandler(err.message, 500))
}
});

export const updateDriver = CatchAsyncError(async (req, res) => {
  try{
  const { driverId } = req.params;

  const { data, deletedImages } = req.body;

  if (!data) throw new ErrorHandler("No data provided", 400);

  const updateData = typeof data === "string" ? JSON.parse(data) : data;

  // 1. Update driver fields
  const driver = await db.driver.update({
    where: { id: driverId },
    data: updateData
  });

  // 2. Delete selected images
  if (deletedImages) {
    const deleteList = JSON.parse(deletedImages);

    for (const imageId of deleteList) {
      const image = await db.driverImage.findUnique({ where: { id: imageId } });

      if (image) {
        const filePath = `.${image.image_path}`;
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await db.driverImage.delete({ where: { id: imageId } });
      }
    }
  }

  // 3. Add new images
  const files = req.files || {};

  for (const field in files) {
    const file = files[field][0];

    await db.driverImage.create({
      data: {
        driver_id: driverId,
        image_type: field,
        image_path: file.path.replace(/.*uploads/, "/uploads")
      }
    });
  }

  res.json({
    success: true,
    message: "Driver updated successfully",
    driver
  });
}catch(err){
  next(new ErrorHandler(err.message, 500))
}
});
