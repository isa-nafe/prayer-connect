import moment from 'moment-hijri';

export interface IslamicEvent {
  name: string;
  description: string;
  date: Date;
  hijriDate: string;
}

function getGregorianDateFromHijri(iYear: number, iMonth: number, iDay: number): Date {
  return moment(`${iYear}-${iMonth}-${iDay}`, 'iYYYY-iM-iD').toDate();
}

function formatHijriDate(iYear: number, iMonth: number, iDay: number): string {
  const hijriDate = moment(`${iYear}-${iMonth}-${iDay}`, 'iYYYY-iM-iD');
  return `${hijriDate.iDate()} ${hijriDate.format('iMMMM')} ${hijriDate.iYear()}`;
}

export function getIslamicEvents(year: number = new Date().getFullYear()): IslamicEvent[] {
  // Get current Hijri year
  const now = moment();
  const currentHijriYear = now.iYear();
  
  const events = [
    {
      name: "Ramadan",
      description: "The holy month of fasting",
      hijri: { month: 9, day: 1 }
    },
    {
      name: "Eid ul-Fitr",
      description: "Festival of breaking the fast",
      hijri: { month: 10, day: 1 }
    },
    {
      name: "Eid ul-Adha",
      description: "Festival of sacrifice",
      hijri: { month: 12, day: 10 }
    },
    {
      name: "Islamic New Year",
      description: "First day of Muharram",
      hijri: { month: 1, day: 1 }
    },
    {
      name: "Ashura",
      description: "10th day of Muharram",
      hijri: { month: 1, day: 10 }
    },
    {
      name: "Mawlid al-Nabi",
      description: "Birth of Prophet Muhammad (PBUH)",
      hijri: { month: 3, day: 12 }
    }
  ];

  return events.map(event => {
    const date = getGregorianDateFromHijri(currentHijriYear, event.hijri.month, event.hijri.day);
    const hijriDate = formatHijriDate(currentHijriYear, event.hijri.month, event.hijri.day);
    
    // If the event has already passed this year, show next year's date
    if (date < new Date()) {
      const nextYearDate = getGregorianDateFromHijri(currentHijriYear + 1, event.hijri.month, event.hijri.day);
      const nextYearHijriDate = formatHijriDate(currentHijriYear + 1, event.hijri.month, event.hijri.day);
      return {
        name: event.name,
        description: event.description,
        date: nextYearDate,
        hijriDate: nextYearHijriDate
      };
    }

    return {
      name: event.name,
      description: event.description,
      date: date,
      hijriDate: hijriDate
    };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
}
