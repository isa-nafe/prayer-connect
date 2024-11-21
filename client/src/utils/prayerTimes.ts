import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

// SFU Burnaby Campus coordinates
const SFU_COORDINATES = new Coordinates(49.2781, -122.9199);

export function getPrayerTimesForDate(date: Date = new Date()): PrayerTimes {
  return new PrayerTimes(
    SFU_COORDINATES,
    date,
    CalculationMethod.NorthAmerica()
  );
}

export function getNextPrayer(prayerTimes: PrayerTimes): {name: string; time: Date} {
  const prayers = [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Dhuhr', time: prayerTimes.dhuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha }
  ];

  const now = new Date();
  
  // Find the next prayer
  const nextPrayer = prayers.find(prayer => prayer.time > now) || prayers[0];
  
  return nextPrayer;
}

export function getAllPrayerTimes(date: Date = new Date()): Array<{name: string; time: Date}> {
  const prayerTimes = getPrayerTimesForDate(date);
  
  return [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Dhuhr', time: prayerTimes.dhuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha }
  ];
}
