import { DateTime } from 'hijri-date';

export interface IslamicEvent {
  name: string;
  description: string;
  date: Date;
  hijriDate: string;
}

function getHijriDate(date: Date): string {
  const hijriDate = new DateTime(date);
  return `${hijriDate.day} ${hijriDate.monthName} ${hijriDate.year}`;
}

export function getIslamicEvents(year: number = new Date().getFullYear()): IslamicEvent[] {
  const events = [
    {
      name: "Ramadan",
      description: "The holy month of fasting",
      gregorianDate: new Date(year, 2, 10) // Approximate, will vary yearly
    },
    {
      name: "Eid ul-Fitr",
      description: "Festival of breaking the fast",
      gregorianDate: new Date(year, 3, 10) // Approximate, will vary yearly
    },
    {
      name: "Eid ul-Adha",
      description: "Festival of sacrifice",
      gregorianDate: new Date(year, 5, 17) // Approximate, will vary yearly
    },
    {
      name: "Islamic New Year",
      description: "First day of Muharram",
      gregorianDate: new Date(year, 6, 19) // Approximate, will vary yearly
    },
    {
      name: "Ashura",
      description: "10th day of Muharram",
      gregorianDate: new Date(year, 6, 28) // Approximate, will vary yearly
    },
    {
      name: "Mawlid al-Nabi",
      description: "Birth of Prophet Muhammad (PBUH)",
      gregorianDate: new Date(year, 8, 27) // Approximate, will vary yearly
    }
  ];

  return events.map(event => ({
    name: event.name,
    description: event.description,
    date: event.gregorianDate,
    hijriDate: getHijriDate(event.gregorianDate)
  }));
}
