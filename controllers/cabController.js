import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import fs from "fs";
import path from "path";

// create cab // tested ! 1 //
export const createCab = CatchAsyncError(async (req, res, next) => {
  try {
    const { data } = req.body;
    const user = req.user;
    const newData = typeof data === "object" ? data : JSON.parse(data);

    const {
      car_name,
      car_type,
      fuel_type,
      seat_capacity,
      bag_capacity,
      description,
      is_available,
      feature_ids,
      fare_rules
    } = newData;

    // Validate required fields
    if (!car_name || !car_type || !seat_capacity || !fuel_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check duplicate car
    const existCar = await db.car.findFirst({ where: { car_name } });
    if (existCar) {
      return next(new ErrorHandler("This car name already exists.", 400));
    }

    // Create Car
    const car = await db.car.create({
      data: {
        car_name,
        car_type,
        fuel_type,
        seat_capacity: Number(seat_capacity),
        bag_capacity: bag_capacity ? Number(bag_capacity) : 0,
        description,
        is_available: is_available === undefined ? true : Boolean(is_available),
        created_by_id: user.id
      }
    });

    if (fare_rules) {
      const {
        base_fare, night_multiplier, minimum_fare, late_compensation_per_min,
        waiting_charge_per_min, price_per_min, price_per_km, night_start, night_end
      } = fare_rules;

      await db.carFareRule.create({
        data: {
          car_id: car.id,
          base_fare: Number.parseFloat(base_fare),
          price_per_km: Number.parseFloat(price_per_km),
          price_per_min: Number.parseFloat(price_per_min),
          waiting_charge_per_min: Number.parseFloat(waiting_charge_per_min),
          late_compensation_per_min: Number.parseFloat(late_compensation_per_min),
          minimum_fare: Number.parseFloat(minimum_fare),
          night_multiplier: Number.parseFloat(night_multiplier),
          night_start: night_start || "21:00",
          night_end: night_end || "05:00"
        }
      });
    }

    // ----------------------------------------------------------
    // ✅ Add features (many-to-many)
    // ----------------------------------------------------------
    if (feature_ids && Array.isArray(feature_ids) && feature_ids.length > 0) {
      const featureLinks = feature_ids.map(fid => ({
        car_id: car.id,
        feature_id: fid
      }));

      await db.carJTFeature.createMany({
        data: featureLinks
      });
    }

    // ----------------------------------------------------------
    // ✅ Upload images
    // ----------------------------------------------------------
    const files = req.files || [];
    let isMain = true;

    for (const file of files) {
      await db.carImage.create({
        data: {
          car_id: car.id,
          image_url: `/uploads/${file.filename}`,
          is_main: isMain
        }
      });
      isMain = false;
    }

    // Fetch car with all features
    const fullCar = await db.car.findUnique({
      where: { id: car.id },
      include: {
        features: {
          include: {
            feature: true
          }
        },
        images: true
      }
    });

    res.status(201).json({
      success: true,
      car: fullCar
    });

  } catch (err) {
    return next(new ErrorHandler(err.message, 500));
  }
});

// update cab //tested ! 1 //
export const updateCabById = CatchAsyncError(async (req, res, next) => {
  try {
    const { cabId } = req.params;
    
    if(!cabId) return res.status(404).json({ error: "Invalid Id found!" });
    // 1) Check if car exists
    const existing = await db.car.findUnique({ where: { id: cabId } });
    if (!existing) return res.status(404).json({ error: "Car not found" });

    // Parse request body
    const { data, delete_images } = req.body;

    const parsedData =
      typeof data === "object" ? data : data ? JSON.parse(data) : {};

    const parsedDeletedImages =
      typeof delete_images === "object"
        ? delete_images
        : delete_images
          ? JSON.parse(delete_images)
          : [];

    const { feature_ids, fare_rules, ...carData } = parsedData;

    // -----------------------------
    // 2) Update Main Car Data
    // -----------------------------
    const updatedCar = await db.car.update({
      where: { id: cabId },
      data: {
        car_name: carData.car_name,
        car_type: carData.car_type,
        fuel_type: carData.fuel_type,
        seat_capacity: Number(carData.seat_capacity || 0),
        bag_capacity: carData.bag_capacity ? Number(carData.bag_capacity || 0) : 0,
        description: carData.description,
        is_available: carData.is_available === undefined ? true : Boolean(carData.is_available),
      },
    });

    if (fare_rules) {
      const {
        base_fare, night_multiplier, minimum_fare, late_compensation_per_min,
        waiting_charge_per_min, price_per_min, price_per_km, night_start, night_end
      } = fare_rules;

      const data = {
              base_fare: Number(base_fare),
              price_per_km: Number(price_per_km),
              price_per_min: Number(price_per_min),
              waiting_charge_per_min: Number(waiting_charge_per_min),
              late_compensation_per_min: Number(late_compensation_per_min),
              minimum_fare: Number(minimum_fare),
              night_multiplier: Number(night_multiplier),
              night_start: night_start || "21:00",
              night_end: night_end || "05:00",
            }
            
      await db.carFareRule.upsert({
            where: {
              car_id: cabId,
            },
            update: data ,
            create: {
              car_id:cabId,
              ...data},
          });

    }
    // -----------------------------------------------------------
    // 3) UPDATE FEATURES (Many-to-Many)
    // -----------------------------------------------------------
    if (Array.isArray(feature_ids)) {
      // STEP 1 → Remove existing feature relations
      await db.carJTFeature.deleteMany({
        where: { car_id: cabId },
      });

      // STEP 2 → Insert new feature relations
      const featureLinks = feature_ids.map((fid) => ({
        car_id: cabId,
        feature_id: fid,
      }));

      if (featureLinks.length > 0) {
        await db.carJTFeature.createMany({
          data: featureLinks,
        });
      }
    }

    // -----------------------------------------------------------
    // 4) HANDLE IMAGES (Delete + Add New + Validate Limit)
    // -----------------------------------------------------------

    // STEP A: DELETE IMAGES (Folder + DB)
    if (parsedDeletedImages.length > 0) {
      // 1. Find images before deleting (to remove from folder)
      const oldImages = await db.carImage.findMany({
        where: { id: { in: parsedDeletedImages } },
      });

      // 2. Delete from DB
      await db.carImage.deleteMany({
        where: { id: { in: parsedDeletedImages } },
      });

      // 3. Delete from folder
      oldImages.forEach((img) => {
        const filePath = path.join(
          "uploads",
          img.image_url.replace("/uploads/", "")
        );

        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.log("❌ Error deleting image file:", err);
        }
      });
    }

    // STEP B: Validate Max 6 images
    const existingCount = await db.carImage.count({
      where: { car_id: cabId },
    });

    const newFiles = req.files || [];
    if (existingCount + newFiles.length > 6) {
      return res.status(400).json({
        error: `Max 6 images allowed. You already have ${existingCount}.`,
      });
    }

    // 1️⃣ Check if car already has a main image
    const existingMainImage = await db.carImage.findFirst({
      where: { car_id: cabId, is_main: true }
    });

    let isMain = existingMainImage ? false : true;

    for (const file of newFiles) {
      await db.carImage.create({
        data: {
          car_id: cabId,
          image_url: `/uploads/${file.filename}`,
          is_main: isMain
        },
      });

      // After first iteration, all next images are NOT main
      isMain = false;
    }

    // STEP D: Fetch updated images
    const updatedImages = await db.carImage.findMany({
      where: { car_id: cabId },
    });

    // -----------------------------------------------------------
    // 5) Final Response
    // -----------------------------------------------------------
    return res.json({
      success: true,
      message: "Car updated successfully",
      updatedCar,
      updatedImages,
      updatedFeatures: feature_ids || [],
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// get cabs // tested ! 1 // /cars?page=1&limit=10&search=innova&car_type=SUV&sortBy=price&sortOrder=asc
export const getCabs = CatchAsyncError(async (req, res, next) => {
  try {
    // 🔹 Query Params
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search?.toString() || "";
    const sortBy = req.query.sortBy?.toString() || "created_at";
    const sortOrder = req.query.sortOrder?.toString() === "asc" ? "asc" : "desc";

    // 🔹 Filters  
    const filters = {};

    if (req.query.car_type) filters.car_type = req.query.car_type;
    if (req.query.fuel_type) filters.fuel_type = req.query.fuel_type;
    if (req.query.transmission) filters.transmission = req.query.transmission;
    if (req.query.min_seats) filters.seat_capacity = { gte: Number(req.query.min_seats) };
    if (req.query.max_seats) filters.seat_capacity = { lte: Number(req.query.max_seats) };

    // 🔹 Search on multiple columns
    const searchFilter =
      search
        ? {
          OR: [
            { car_name: { contains: search, mode: "insensitive" } },
            { fuel_type: { contains: search, mode: "insensitive" } }
          ],
        }
        : {};

    // 🔹 TOTAL COUNT (with search + filters)
    const total = await db.car.count({
      where: {
        ...filters,
        ...searchFilter,
      },
    });

    // 🔹 FETCH PAGINATED DATA
    const cars = await db.car.findMany({
      where: {
        ...filters,
        ...searchFilter,
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        images: true,
        drivers: true,
        fare_rules: true,
        features: {
          select: {
          feature: {
            select: {
              id: true,
              name: true,
              },
            },
          },
        },
      }
  });

    // 🔹 Format features
    const formattedCars = cars.map((car) => ({
      ...car,
      features: car.features.map((f) => f.feature),
    }));

    return res.status(200).json({
      success: true,
      data: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        cars: formattedCars,
      }
    });
  } catch (err) {
    return next(new ErrorHandler(err.message, 500));
  }
});


// get cab by id // tested ! 1 //
export const getCabById = CatchAsyncError(async (req, res, next) => {
  try {
    const car = await db.car.findUnique({
      where: { id: req.params.cabId },
      include: {
        images: true,
        drivers: true,
        fare_rules: true,
        features: {
          select: {
          feature: {
            select: {
              id: true,
              name: true,
              },
            },
          },
        },
      }
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Format features to return clean feature details
    const formattedCar = {
      ...car,
      features: car.features.map(f => f.feature)
    };

    return res.status(200).json({ success: true, car: formattedCar });

  } catch (err) {
    return next(new ErrorHandler(err.message, 500));
  }
});


export const deleteCabById = CatchAsyncError(async (req, res, next) => {
  try {
    const cabId = req.params.cabId;

    // 1) Delete images
    await db.carImage.deleteMany({
      where: { car_id: cabId }
    });

    // 2) Delete all feature relations (JOIN TABLE)
    await db.carJTFeature.deleteMany({
      where: { car_id: cabId }
    });

    // 3) Unassign drivers from this car
    await db.driver.updateMany({
      where: { assigned_car_id: cabId },
      data: { assigned_car_id: null }
    });

    // 4) Delete the car itself
    await db.car.delete({
      where: { id: cabId }
    });

    return res.json({ success: true });

  } catch (err) {
    return next(new ErrorHandler(err.message, 500));
  }
});

// create car features   // tested ! 1 //
export const createCarFeatures = CatchAsyncError(async (req, res, next) => {
  try {

    const { name, category, description } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: "Name and category are required." });
    }

    // Check if feature already exists
    const existing = await db.carFeatures.findUnique({
      where: { name },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Feature already exists." });
    }

    // Create feature
    const feature = await db.carFeatures.create({
      data: {
        name,
        category,
        description: description || null,
      },
    });

    return res.status(201).json({ success: true, data: feature });
  }
  catch (err) {
    return next(new ErrorHandler(err.message, 500))
  }

});

// get features  // tested ! 1 //
export const getCarFeatures = CatchAsyncError(async (req, res, next) => {
  try {
    let { search = "", limit = 10, page = 1 } = req.query;

    limit = parseInt(limit);
    page = parseInt(page);
    const skip = (page - 1) * limit;

    let query = {};

    if (search.trim() !== "") {
      query = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } }
        ]
      };
    }
    const features = await db.carFeatures.findMany({
      where: query,
      take: limit,
      skip,
      orderBy:
        search.trim() !== ""
          ? { name: "asc" }      // If searching → sorted
          : {                   // Default → RANDOM LIST
            id: "asc"
          }
    });

    const total = await db.carFeatures.count({ where: query });

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      data: features,
    });

  } catch (err) {
    return next(new ErrorHandler(err.message, 500));
  }
});
