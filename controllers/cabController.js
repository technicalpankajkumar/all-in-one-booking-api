import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";


export const createCab = CatchAsyncError(async (req, res, next) => {
  try {
    const {data} = req.body;
    const newData = typeof data == 'object' ? data : JSON.parse(data)
    const {
      car_name, car_type, fuel_type, seat_capacity, bag_capacity,
      base_price, price_unit, description, is_available,
      features // optional object { ac, gps, music_system, automatic_transmission }
    } = newData;

    // Basic validation
    if (!car_name || !car_type || !seat_capacity || !base_price || !price_unit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existCar = await db.car.findFirst({
      where: {
        car_name
      }
    });
    if(existCar){
        return next(new ErrorHandler('This name car already exist.', 400))
    }

    const car = await db.car.create({
      data: {
        car_name,
        car_type,
        fuel_type,
        seat_capacity: Number(seat_capacity),
        bag_capacity: bag_capacity ? Number(bag_capacity) : 0,
        base_price: parseFloat(base_price),
        price_unit,
        description,
        is_available: is_available === undefined ? true : Boolean(is_available)
      }
    });

    // create features if provided
    let feature = {}
    if (features && typeof features === 'object') {
      feature = await db.carFeatures.create({
        data: {
          car_id: car.id,
          ac: Boolean(features.ac),
          gps: Boolean(features.gps),
          music_system: Boolean(features.music_system),
          automatic_transmission: Boolean(features.automatic_transmission)
        }
      });
    }

    // 2) Upload Images if exists
    const files = req.files || [];

    for (const file of files) {
      await db.carImage.create({
        data: {
          car_id: car.id,
          image_url: `/uploads/${file.filename}`
        }
      });
    }
    res.status(201).json({ success: true, car: { ...car, features: feature } });
  } catch (err) {
    return next(new ErrorHandler(err.message, 500))
  }
});

export const updateCabById = CatchAsyncError(async (req, res,next) => {
  try {
    const { cabId } = req.params;

    
    const existing = await db.car.findUnique({ where: { id: cabId } });
    if (!existing) return res.status(404).json({ error: "Car not found" });

    const {data,deletedImages} = req.body;
    const {features,...dataToUpdate} = typeof data == 'object' ? data : JSON.parse(data)

    // Update base info
    const updatedCar = await db.car.update({
      where: { id: cabId },
      data: dataToUpdate
    });

    const featuresExist = await db.carFeatures.findUnique({ where: { car_id: cabId } });
    if (features && typeof features === 'object'&& featuresExist) {
      await db.carFeatures.update({
        where: { car_id: cabId },
        data: {
          ac: Boolean(features.ac),
          gps: Boolean(features.gps),
          music_system: Boolean(features.music_system),
          automatic_transmission: Boolean(features.automatic_transmission)
        }
      });
    }

    const parsedDeletedImages =
      typeof deletedImages === "object"
        ? deletedImages
        : deletedImages
        ? JSON.parse(deletedImages)
        : [];

    // -----------------------------
    //  IMAGE UPDATE HANDLING
    // -----------------------------
    const files = req.files || [];

    /** STEP 1: Delete images that user removed in UI */
    if (parsedDeletedImages.length > 0) {
      await db.carImage.deleteMany({
        where: {
          id: {
            in: parsedDeletedImages,
          },
        },
      });
    }

    /** STEP 2: Check how many images exist now */
    const remainingImages = await db.carImage.count({
      where: { car_id: cabId },
    });

    /** STEP 3: Validate total images limit (max 6) */
    if (remainingImages + files.length > 6) {
      return res.status(400).json({
        error: `Maximum 6 images allowed. You already have ${remainingImages}.`,
      });
    }

    /** STEP 4: Add new uploaded images */
    for (const file of files) {
      await db.carImage.create({
        data: {
          car_id: cabId,
          image_url: `/uploads/${file.filename}`,
        },
      });
    }

    /** STEP 5: Return updated list */
    const updatedImages = await db.carImage.findMany({
      where: { car_id: cabId },
    });

    res.json({ success: true, updatedCar,updatedImages });

  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
});

export const getCabs = CatchAsyncError(async (req, res, next) => {
  try {
    const cars = await db.car.findMany({
      include: {
        features: true,
        images: true,
        driver: true
      }
    });
    res.json({ success: true, cars });
  } catch (err) {
    return next(new ErrorHandler(err.message, 500))
  }
});


export const getCabById = CatchAsyncError(async (req, res, next) => {
  try {
    const car = await db.car.findUnique({
      where: { id: req.params.cabId },
      include: { features: true, images: true, driver: true }
    });
    if (!car) return res.status(404).json({ error: 'Not found' });
    res.status(200).status(200).json({ success: true, car });
  } catch (err) {
    return next(new ErrorHandler(err.message, 500))
  }
});


export const deleteCabById = CatchAsyncError(async (req, res, next) => {
  try {
    const cabId = req.params.cabId;
    await db.carImage.deleteMany({ where: { car_id: cabId } });
    await db.carFeatures.deleteMany({ where: { car_id: cabId } });
    // unassign driver if any
    await db.driver.updateMany({ where: { assigned_car_id: cabId }, data: { assigned_car_id: null } });
    await db.car.delete({ where: { id: cabId } });
    res.json({ success: true });
  } catch (err) {
   return next(new ErrorHandler(err.message, 500))
  }
});