import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";


export const createCab = CatchAsyncError( async (req,res,next)=>{
  try {
    const {
      car_name, car_type, fuel_type, seat_capacity, bag_capacity,
      base_price, price_unit, description, is_available,
      features // optional object { ac, gps, music_system, automatic_transmission }
    } = req.body;

    // Basic validation
    if (!car_name || !car_type || !seat_capacity || !base_price || !price_unit) {
      return res.status(400).json({ error: 'Missing required fields' });
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
    if (features && typeof features === 'object') {
      await db.carFeatures.create({
        data: {
          car_id: car.id,
          ac: Boolean(features.ac),
          gps: Boolean(features.gps),
          music_system: Boolean(features.music_system),
          automatic_transmission: Boolean(features.automatic_transmission)
        }
      });
    }

    res.status(201).json({ success: true, car });
  } catch (err) {
    console.error('POST /cars', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Upload image(s) for a car
export const UploadCabImage = CatchAsyncError( async (req,res,next)=>{
  try {
    const { carId } = req.params;
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const files = req.files || [];
    const created = [];
    for (const file of files) {
      const url = `/uploads/${file.filename}`;
      const image = await prisma.carImage.create({
        data: {
          car_id: carId,
          image_url: url,
          is_main: false
        }
      });
      created.push(image);
    }

    res.status(201).json({ success: true, uploaded: created });
  } catch (err) {
    console.error('POST /cars/:carId/images', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

 export const getCabs = CatchAsyncError( async (req,res,next)=>{
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
    console.error('GET /cars', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export const getCabById = CatchAsyncError( async (req,res,next)=>{
  try {
    const car = await db.car.findUnique({
      where: { id: req.params.carId },
      include: { features: true, images: true, driver: true }
    });
    if (!car) return res.status(404).json({ error: 'Not found' });
    res.status(200).status(200).json({ success: true, car });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export const updateCabById = CatchAsyncError( async (req,res,next)=>{
  try {
    const data = req.body;
    if (data.seat_capacity) data.seat_capacity = Number(data.seat_capacity);
    if (data.base_price) data.base_price = parseFloat(data.base_price);

    const car = await db.car.update({
      where: { id: req.params.carId },
      data
    });
    res.json({ success: true, car });
  } catch (err) {
    console.error('PUT /cars/:carId', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

export const deleteCabById = CatchAsyncError( async (req,res,next)=>{
  try {
    const carId = req.params.carId;
    await db.carImage.deleteMany({ where: { car_id: carId } });
    await db.carFeatures.deleteMany({ where: { car_id: carId } });
    // unassign driver if any
    await db.driver.updateMany({ where: { assigned_car_id: carId }, data: { assigned_car_id: null } });
    await db.car.delete({ where: { id: carId } });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /cars/:carId', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});