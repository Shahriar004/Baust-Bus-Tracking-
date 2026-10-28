import { RouteSummaryPayload, SchedulePayload, StopDetails } from '../oop/busSystem';

export type Language = 'bn' | 'en';

// Map Bengali digits to English digits and vice versa
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toEnglishDigits(str: string): string {
  return str.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

export function toBengaliDigits(numOrStr: number | string): string {
  return String(numOrStr).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

// Stop Name Translations (Bengali -> English)
export const STOP_NAME_EN: Record<string, string> = {
  'সুইহারী তেলপাম্প': 'Suihari Petrol Pump',
  'মডার্ন মোড়': 'Modern Mor',
  'মর্ডান মোড়': 'Modern Mor',
  'লিলির মোড়': 'Lilir Mor',
  'মেডিকেল মোড়': 'Medical Mor',
  'মহারাজার মোড়': 'Maharajar Mor',
  'দিনাজপুর টার্মিনাল': 'Dinajpur Terminal',
  'কলেজ মোড়': 'College Mor',
  'বাঁশেরহাট': 'Basherhat',
  'দশ মাইল': 'Dash Mile (10 Mile)',
  'ভূষির বন্দর': 'Bhushirbandar',
  'রানীর বন্দর': 'Ranirbandar',
  'BAUST': 'BAUST',
  'শাপলা': 'Shapla Chattar',
  'জাহাজ কোম্পানি': 'Jahaj Company',
  'পায়রা': 'Payra Chattar',
  'চেক পোস্ট': 'Check Post',
  'সিও বাজার': 'CO Bazar',
  'হাসনা': 'Hasna Bazar',
  'হাজীর হাট': 'Hajirhat',
  'পাগলাপীর': 'Paglapir',
  'ইকরচালী': 'Ikarchali',
  'তারাগঞ্জ': 'Taraganj',
  'চৌরঙ্গী': 'Chourangi Mor',
  'কালীবাড়ী': 'Kalibari',
  'দারোয়ানী': 'Darowani',
  'কাজির হাট': 'Kajirhat',
  'চেলাপীর': 'Chelapir',
};

// Common Bengali spelling variations for forgiving search matching
export const STOP_BN_ALIASES: Record<string, string[]> = {
  'সুইহারী তেলপাম্প': ['সুইহারি তেলপাম্প', 'সুইহারী তেল পাম্প', 'সুইহারি তেল পাম্প'],
  'মডার্ন মোড়': ['মর্ডান মোড়', 'মডার্ন মোর', 'মর্ডান মোর'],
  'লিলির মোড়': ['লিলির মোর'],
  'মেডিকেল মোড়': ['মেডিক্যাল মোড়', 'মেডিকেল মোর'],
  'মহারাজার মোড়': ['মহারাজার মোর'],
  'কলেজ মোড়': ['কলেজ মোর'],
  'বাঁশেরহাট': ['বাশেরহাট', 'বাঁশের হাট'],
  'দশ মাইল': ['১০ মাইল', 'দশমাইল'],
  'ভূষির বন্দর': ['ভুষির বন্দর', 'ভূষিরবন্দর', 'ভুষিরবন্দর'],
  'রানীর বন্দর': ['রাণীর বন্দর', 'রানীরবন্দর', 'রাণীরবন্দর', 'রানির বন্দর'],
  'শাপলা': ['শাপলা চত্বর', 'শাপলা মোড়'],
  'জাহাজ কোম্পানি': ['জাহাজ কোম্পানী', 'জাহাজ কোম্পানি মোড়'],
  'পায়রা': ['পায়রা চত্বর', 'পায়রা চত্বর'],
  'হাজীর হাট': ['হাজির হাট', 'হাজীরহাট', 'হাজিরহাট'],
  'পাগলাপীর': ['পাগলাপির'],
  'ইকরচালী': ['ইকরচালি'],
  'চৌরঙ্গী': ['চৌরঙ্গি', 'চৌরঙ্গী মোড়', 'চৌরঙ্গি মোড়'],
  'কালীবাড়ী': ['কালিবাড়ি', 'কালীবাড়ি', 'কালিবাড়ী', 'কালীবাড়ী মোড়'],
  'দারোয়ানী': ['দারোয়ানি', 'দারোয়ানী', 'দারোয়ানি টেক্সটাইল'],
  'কাজির হাট': ['কাজীর হাট', 'কাজিরহাট', 'কাজীরহাট'],
  'চেলাপীর': ['চেলাপির'],
};

// Route Metadata Translations (Bengali -> English)
export const ROUTE_META_EN: Record<
  string,
  {
    name: string;
    title: string;
    estimated_distance: string;
    short_description: string;
    going_direction_title: string;
    going_start_time: string;
    returning_direction_title: string;
    returning_start_time: string;
  }
> = {
  dinajpur: {
    name: 'Dinajpur',
    title: 'Dinajpur ↔ BAUST',
    estimated_distance: 'Approx. 38 km',
    short_description:
      'Official university bus route to BAUST campus via Suihari Petrol Pump, Modern Mor, Dinajpur Terminal, College Mor, Dash Mile, and Ranirbandar.',
    going_direction_title: 'Dinajpur to BAUST',
    going_start_time: '6:20 AM',
    returning_direction_title: 'BAUST to Dinajpur',
    returning_start_time: '2:35 PM',
  },
  rangpur: {
    name: 'Rangpur',
    title: 'Rangpur ↔ BAUST',
    estimated_distance: 'Approx. 42 km',
    short_description:
      'Official university bus route to BAUST campus via Shapla Chattar, Jahaj Company, Payra, Medical Mor, Paglapir, and Taraganj.',
    going_direction_title: 'Rangpur to BAUST',
    going_start_time: '6:30 AM',
    returning_direction_title: 'BAUST to Rangpur',
    returning_start_time: '2:35 PM',
  },
  nilphamari: {
    name: 'Nilphamari',
    title: 'Nilphamari ↔ BAUST',
    estimated_distance: 'Approx. 22 km',
    short_description:
      'Official university bus route to BAUST campus via Chourangi Mor, Kalibari, Darowani, Kajirhat, and Chelapir.',
    going_direction_title: 'Nilphamari to BAUST',
    going_start_time: '7:00 AM',
    returning_direction_title: 'BAUST to Nilphamari',
    returning_start_time: '2:35 PM',
  },
};

export function translateTimeToEn(bnTime: string): string {
  const withEnDigits = toEnglishDigits(bnTime.trim());
  if (withEnDigits === 'সকাল 6টা 20 মিনিট') return '6:20 AM';
  if (withEnDigits === 'সকাল 6টা 30 মিনিট') return '6:30 AM';
  if (withEnDigits === 'সকাল 7টা') return '7:00 AM';
  if (withEnDigits === 'দুপুর 2টা 35 মিনিট') return '2:35 PM';

  if (withEnDigits.startsWith('সকাল ')) {
    return `${withEnDigits.replace('সকাল ', '').trim()} AM`;
  }
  if (withEnDigits.startsWith('দুপুর ')) {
    return `${withEnDigits.replace('দুপুর ', '').trim()} PM`;
  }
  if (withEnDigits.startsWith('বিকেল ')) {
    return `${withEnDigits.replace('বিকেল ', '').trim()} PM`;
  }
  return withEnDigits;
}

export function translateFareToEn(bnFare: string): string {
  if (!bnFare || bnFare === '—') return '—';
  const enDigits = toEnglishDigits(bnFare);
  return enDigits.replace('টাকা', 'BDT').trim();
}

export function formatStopForLang(
  stop: StopDetails,
  lang: Language
): {
  serial: string;
  name: string;
  rawName: string;
  time: string;
  fare: string;
} {
  if (lang === 'bn') {
    return {
      serial: stop.serial,
      name: stop.name,
      rawName: stop.name,
      time: stop.time,
      fare: stop.fare,
    };
  }
  return {
    serial: toEnglishDigits(stop.serial),
    name: STOP_NAME_EN[stop.name] || stop.name,
    rawName: stop.name,
    time: translateTimeToEn(stop.time),
    fare: translateFareToEn(stop.fare),
  };
}

export function formatRouteForLang(route: RouteSummaryPayload, lang: Language) {
  if (lang === 'bn') {
    return {
      name: route.name,
      title: route.title,
      estimated_distance: route.estimated_distance,
      short_description: route.short_description,
      going_start_time: route.going_start_time,
      returning_start_time: route.returning_start_time,
      first_stop_name: route.going.stops[0]?.name || '—',
    };
  }
  const meta = ROUTE_META_EN[route.id];
  const firstStopBn = route.going.stops[0]?.name || '—';
  return {
    name: meta?.name || route.name,
    title: meta?.title || route.title,
    estimated_distance: meta?.estimated_distance || route.estimated_distance,
    short_description: meta?.short_description || route.short_description,
    going_start_time: meta?.going_start_time || translateTimeToEn(route.going_start_time),
    returning_start_time:
      meta?.returning_start_time || translateTimeToEn(route.returning_start_time),
    first_stop_name: STOP_NAME_EN[firstStopBn] || firstStopBn,
  };
}

export function formatScheduleForLang(schedule: SchedulePayload, lang: Language) {
  const meta = ROUTE_META_EN[schedule.route_id];
  const firstStopBn = schedule.stops[0]?.name || '';
  if (lang === 'bn') {
    return {
      route_title: schedule.route_title || '',
      direction_title: schedule.direction_title,
      direction_label: schedule.direction_label,
      schedule_type: schedule.schedule_type,
      estimated_distance: schedule.estimated_distance,
      route_start_time: schedule.route_start_time,
      first_stop_name: firstStopBn,
      first_stop_time: schedule.first_stop_time,
      notice: schedule.notice,
    };
  }
  const isReturning = schedule.direction_key === 'returning';
  return {
    route_title: meta?.title || schedule.route_title || '',
    direction_title: isReturning
      ? meta?.returning_direction_title || schedule.direction_title
      : meta?.going_direction_title || schedule.direction_title,
    direction_label: isReturning ? 'Returning from BAUST' : 'Going to BAUST',
    schedule_type: isReturning
      ? 'Estimated Schedule (Returning from BAUST)'
      : 'Fixed Schedule (Going to BAUST)',
    estimated_distance: meta?.estimated_distance || schedule.estimated_distance,
    route_start_time: isReturning
      ? meta?.returning_start_time || translateTimeToEn(schedule.route_start_time)
      : meta?.going_start_time || translateTimeToEn(schedule.route_start_time),
    first_stop_name: STOP_NAME_EN[firstStopBn] || firstStopBn,
    first_stop_time: translateTimeToEn(schedule.first_stop_time),
    notice: schedule.notice
      ? 'Note: Returning bus times are estimated. Please verify actual timings and fares with the transport authority.'
      : null,
  };
}

/**
 * Bilingual search helper: matches a stop or route against BOTH Bengali (including common spelling variants) and English text/digits
 */
export function matchesBilingualStopKeyword(stop: StopDetails, rawQuery: string): boolean {
  if (!rawQuery) return true;
  const q = rawQuery.trim().toLowerCase().normalize('NFC');
  if (!q) return true;

  const enStop = formatStopForLang(stop, 'en');
  const bnAliases = STOP_BN_ALIASES[stop.name] || [];
  const searchableFields = [
    stop.name,
    stop.serial,
    stop.time,
    stop.fare,
    enStop.name,
    enStop.serial,
    enStop.time,
    enStop.fare,
    ...bnAliases,
  ].map((s) => s.toLowerCase().normalize('NFC'));

  return searchableFields.some((field) => field.includes(q));
}

export function matchesBilingualRouteMeta(route: RouteSummaryPayload, rawQuery: string): boolean {
  if (!rawQuery) return true;
  const q = rawQuery.trim().toLowerCase().normalize('NFC');
  if (!q) return true;

  const enMeta = formatRouteForLang(route, 'en');
  const searchableFields = [
    route.id,
    route.name,
    route.title,
    route.short_description,
    route.estimated_distance,
    enMeta.name,
    enMeta.title,
    enMeta.short_description,
    enMeta.estimated_distance,
  ].map((s) => s.toLowerCase().normalize('NFC'));

  return searchableFields.some((field) => field.includes(q));
}
