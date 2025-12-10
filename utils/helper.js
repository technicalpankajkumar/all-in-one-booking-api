import dayjs from "dayjs";

export function calculateFinalFare(rule, params) {
  const {
    distanceKm,
    durationMin,
    waitingMin = 0,
    driverLateMin = 0,
    pickupTime
  } = params;

  const isNightRide = checkNightRide(
    pickupTime,
    rule.night_start,
    rule.night_end
  );

  let fare =
    rule.base_fare +
    distanceKm * rule.price_per_km +
    durationMin * rule.price_per_min +
    waitingMin * rule.waiting_charge_per_min -
    driverLateMin * rule.late_compensation_per_min;

  if (isNightRide) {
    fare = fare * rule.night_fultiplier;
  }

  if (fare < rule.minimum_fare) {
    fare = rule.minimum_fare;
  }

  return {
    finalFare: fare,
    isNightRide,
    breakdown: {
      baseFare: rule.base_fare,
      distanceCharge: distanceKm * rule.price_per_km,
      durationCharge: durationMin * rule.price_per_min,
      waitingCharge: waitingMin * rule.waiting_charge_per_min,
      driverLateDiscount: driverLateMin * rule.late_compensation_per_min,
      nightMultiplier: isNightRide ? rule.night_fultiplier : 1,
      minimumFareApplied: fare === rule.minimum_fare,
    }
  };
}

function checkNightRide(pickupTime, nightStart, nightEnd) {
  const format = "HH:mm";

  const pickup = dayjs(pickupTime, format);
  const start = dayjs(nightStart, format);
  const end = dayjs(nightEnd, format);

  if (start.isBefore(end)) {
    return pickup.isAfter(start) && pickup.isBefore(end);
  }

  return pickup.isAfter(start) || pickup.isBefore(end);
}

export function formatTravelTime(durationMin) {
  const hr = Math.floor(durationMin / 60);
  const min = Math.round(durationMin % 60);
  return `${hr} hr ${min} min`;
}
