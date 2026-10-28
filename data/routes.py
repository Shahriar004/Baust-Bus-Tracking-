"""
data/routes.py
---------------
Centralized route, stop, schedule, and fare data for Baust Bus Tracking System.

Academic Note:
- All bus routes, stops, departure times, and fares are stored in this single file.
- Updating any stop name, time, or fare in this file automatically updates the
  entire website without modifying HTML templates or application logic.
- Strictly contains the 3 official BAUST routes:
  1. দিনাজপুর ↔ BAUST (dinajpur)
  2. রংপুর ↔ BAUST (rangpur)
  3. নীলফামারী ↔ BAUST (nilphamari)
"""

# Warning notice for returning schedules (Mandatory as per specification Section 11)
RETURN_WARNING_NOTICE = (
    "সতর্কতা: ফেরার সময়সূচি আনুমানিক। প্রকৃত সময়সূচি ও ভাড়া সংশ্লিষ্ট কর্তৃপক্ষের কাছ থেকে যাচাই করে নিন।"
)

# Informational notice regarding GPS live tracking (Section 5.4)
NO_GPS_NOTICE = (
    "এই ওয়েবসাইটে বাসের রুট, সময়সূচি ও ভাড়ার তথ্য দেওয়া হয়। বর্তমানে প্রকৃত GPS-ভিত্তিক লাইভ বাস ট্র্যাকিং সুবিধা নেই।"
)

ROUTES_DATA = {
    "dinajpur": {
        "id": "dinajpur",
        "name": "দিনাজপুর",
        "title": "দিনাজপুর ↔ BAUST",
        "estimated_distance": "প্রায় ৩৮ কি.মি.",
        "short_description": (
            "সুইহারী তেলপাম্প, মডার্ন মোড়, দিনাজপুর টার্মিনাল, কলেজ মোড়, দশ মাইল ও রানীর বন্দর হয়ে BAUST ক্যাম্পাসে যাতায়াতের নির্ধারিত বাস রুট।"
        ),
        "icon_name": "route-north",
        "going": {
            "direction_key": "going",
            "direction_title": "দিনাজপুর থেকে BAUST",
            "direction_label": "BAUST-এ যাওয়ার সময়সূচি",
            "route_start_time": "সকাল ৬টা ২০ মিনিট",
            "is_estimated": False,
            "notice": None,
            "stops": [
                {"serial": "১", "name": "সুইহারী তেলপাম্প", "time": "সকাল ৬:২০", "fare": "৭০ টাকা"},
                {"serial": "২", "name": "মডার্ন মোড়", "time": "সকাল ৬:২২", "fare": "৭০ টাকা"},
                {"serial": "৩", "name": "লিলির মোড়", "time": "সকাল ৬:২৬", "fare": "৭০ টাকা"},
                {"serial": "৪", "name": "মেডিকেল মোড়", "time": "সকাল ৬:২৮", "fare": "৭০ টাকা"},
                {"serial": "৫", "name": "মহারাজার মোড়", "time": "সকাল ৬:৩০", "fare": "৭০ টাকা"},
                {"serial": "৬", "name": "দিনাজপুর টার্মিনাল", "time": "সকাল ৬:৩৫", "fare": "৭০ টাকা"},
                {"serial": "৭", "name": "কলেজ মোড়", "time": "সকাল ৬:৪০", "fare": "৭০ টাকা"},
                {"serial": "৮", "name": "বাঁশেরহাট", "time": "সকাল ৬:৫০", "fare": "৬০ টাকা"},
                {"serial": "৯", "name": "দশ মাইল", "time": "সকাল ৭:০০", "fare": "৪৫ টাকা"},
                {"serial": "১০", "name": "ভূষির বন্দর", "time": "সকাল ৭:০৫", "fare": "৪০ টাকা"},
                {"serial": "১১", "name": "রানীর বন্দর", "time": "সকাল ৭:১০", "fare": "২৫ টাকা"},
            ],
        },
        "returning": {
            "direction_key": "returning",
            "direction_title": "BAUST থেকে দিনাজপুর",
            "direction_label": "BAUST থেকে ফেরার সময়সূচি",
            "route_start_time": "দুপুর ২টা ৩৫ মিনিট",
            "is_estimated": True,
            "notice": RETURN_WARNING_NOTICE,
            "stops": [
                {"serial": "১", "name": "BAUST", "time": "দুপুর ২:৩৫", "fare": None},
                {"serial": "২", "name": "রানীর বন্দর", "time": "দুপুর ২:৫৫", "fare": "২৫ টাকা"},
                {"serial": "৩", "name": "ভূষির বন্দর", "time": "বিকেল ৩:০০", "fare": "৪০ টাকা"},
                {"serial": "৪", "name": "দশ মাইল", "time": "বিকেল ৩:০৫", "fare": "৪৫ টাকা"},
                {"serial": "৫", "name": "বাঁশেরহাট", "time": "বিকেল ৩:১৫", "fare": "৬০ টাকা"},
                {"serial": "৬", "name": "কলেজ মোড়", "time": "বিকেল ৩:২৫", "fare": "৭০ টাকা"},
                {"serial": "৭", "name": "দিনাজপুর টার্মিনাল", "time": "বিকেল ৩:৩০", "fare": "৭০ টাকা"},
                {"serial": "৮", "name": "মহারাজার মোড়", "time": "বিকেল ৩:৩৫", "fare": "৭০ টাকা"},
                {"serial": "৯", "name": "মেডিকেল মোড়", "time": "বিকেল ৩:৩৭", "fare": "৭০ টাকা"},
                {"serial": "১০", "name": "লিলির মোড়", "time": "বিকেল ৩:৩৯", "fare": "৭০ টাকা"},
                {"serial": "১১", "name": "মডার্ন মোড়", "time": "বিকেল ৩:৪৩", "fare": "৭০ টাকা"},
                {"serial": "১২", "name": "সুইহারী তেলপাম্প", "time": "বিকেল ৩:৪৫", "fare": "৭০ টাকা"},
            ],
        },
    },
    "rangpur": {
        "id": "rangpur",
        "name": "রংপুর",
        "title": "রংপুর ↔ BAUST",
        "estimated_distance": "প্রায় ৪২ কি.মি.",
        "short_description": (
            "শাপলা, জাহাজ কোম্পানি, পায়রা, মেডিকেল মোড়, পাগলাপীর ও তারাগঞ্জ হয়ে BAUST ক্যাম্পাসে যাতায়াতের নির্ধারিত বাস রুট।"
        ),
        "icon_name": "route-east",
        "going": {
            "direction_key": "going",
            "direction_title": "রংপুর থেকে BAUST",
            "direction_label": "BAUST-এ যাওয়ার সময়সূচি",
            "route_start_time": "সকাল ৬টা ৩০ মিনিট",
            "is_estimated": False,
            "notice": None,
            "stops": [
                {"serial": "১", "name": "শাপলা", "time": "সকাল ৬:৩০", "fare": "৭০ টাকা"},
                {"serial": "২", "name": "জাহাজ কোম্পানি", "time": "সকাল ৬:৩৫", "fare": "৭০ টাকা"},
                {"serial": "৩", "name": "পায়রা", "time": "সকাল ৬:৩৭", "fare": "৭০ টাকা"},
                {"serial": "৪", "name": "চেক পোস্ট", "time": "সকাল ৬:৫০", "fare": "৭০ টাকা"},
                {"serial": "৫", "name": "মেডিকেল মোড়", "time": "সকাল ৭:০০", "fare": "৭০ টাকা"},
                {"serial": "৬", "name": "সিও বাজার", "time": "সকাল ৭:০৫", "fare": "৭০ টাকা"},
                {"serial": "৭", "name": "হাসনা", "time": "সকাল ৭:১০", "fare": "৭০ টাকা"},
                {"serial": "৮", "name": "হাজীর হাট", "time": "সকাল ৭:১৫", "fare": "৬০ টাকা"},
                {"serial": "৯", "name": "পাগলাপীর", "time": "সকাল ৭:২৫", "fare": "৫০ টাকা"},
                {"serial": "১০", "name": "ইকরচালী", "time": "সকাল ৭:৩৫", "fare": "৩৫ টাকা"},
                {"serial": "১১", "name": "তারাগঞ্জ", "time": "সকাল ৭:৪৫", "fare": "২৫ টাকা"},
            ],
        },
        "returning": {
            "direction_key": "returning",
            "direction_title": "BAUST থেকে রংপুর",
            "direction_label": "BAUST থেকে ফেরার সময়সূচি",
            "route_start_time": "দুপুর ২টা ৩৫ মিনিট",
            "is_estimated": True,
            "notice": RETURN_WARNING_NOTICE,
            "stops": [
                {"serial": "১", "name": "BAUST", "time": "দুপুর ২:৩৫", "fare": None},
                {"serial": "২", "name": "তারাগঞ্জ", "time": "দুপুর ২:৫৫", "fare": "২৫ টাকা"},
                {"serial": "৩", "name": "ইকরচালী", "time": "বিকেল ৩:০৫", "fare": "৩৫ টাকা"},
                {"serial": "৪", "name": "পাগলাপীর", "time": "বিকেল ৩:১৫", "fare": "৫০ টাকা"},
                {"serial": "৫", "name": "হাজীর হাট", "time": "বিকেল ৩:২৫", "fare": "৬০ টাকা"},
                {"serial": "৬", "name": "হাসনা", "time": "বিকেল ৩:৩০", "fare": "৭০ টাকা"},
                {"serial": "৭", "name": "সিও বাজার", "time": "বিকেল ৩:৩৫", "fare": "৭০ টাকা"},
                {"serial": "৮", "name": "মেডিকেল মোড়", "time": "বিকেল ৩:৪০", "fare": "৭০ টাকা"},
                {"serial": "৯", "name": "চেক পোস্ট", "time": "বিকেল ৩:৫০", "fare": "৭০ টাকা"},
                {"serial": "১০", "name": "পায়রা", "time": "বিকেল ৪:০০", "fare": "৭০ টাকা"},
                {"serial": "১১", "name": "জাহাজ কোম্পানি", "time": "বিকেল ৪:০৫", "fare": "৭০ টাকা"},
                {"serial": "১২", "name": "শাপলা", "time": "বিকেল ৪:১০", "fare": "৭০ টাকা"},
            ],
        },
    },
    "nilphamari": {
        "id": "nilphamari",
        "name": "নীলফামারী",
        "title": "নীলফামারী ↔ BAUST",
        "estimated_distance": "প্রায় ২২ কি.মি.",
        "short_description": (
            "চৌরঙ্গী, কালীবাড়ী, দারোয়ানী, কাজির হাট ও চেলাপীর হয়ে BAUST ক্যাম্পাসে যাতায়াতের নির্ধারিত বাস রুট।"
        ),
        "icon_name": "route-central",
        "going": {
            "direction_key": "going",
            "direction_title": "নীলফামারী থেকে BAUST",
            "direction_label": "BAUST-এ যাওয়ার সময়সূচি",
            # Note: Route start time (সকাল ৭টা) is intentionally stored separately from
            # the first stop time (চৌরঙ্গী - সকাল ৭:১০) as required by Section 10.
            "route_start_time": "সকাল ৭টা",
            "is_estimated": False,
            "notice": None,
            "stops": [
                {"serial": "১", "name": "চৌরঙ্গী", "time": "সকাল ৭:১০", "fare": "৪০ টাকা"},
                {"serial": "২", "name": "কালীবাড়ী", "time": "সকাল ৭:১৫", "fare": "৪০ টাকা"},
                {"serial": "৩", "name": "দারোয়ানী", "time": "সকাল ৭:২০", "fare": "৪০ টাকা"},
                {"serial": "৪", "name": "কাজির হাট", "time": "সকাল ৭:২৫", "fare": "৪০ টাকা"},
                {"serial": "৫", "name": "চেলাপীর", "time": "সকাল ৭:৩০", "fare": "২০ টাকা"},
            ],
        },
        "returning": {
            "direction_key": "returning",
            "direction_title": "BAUST থেকে নীলফামারী",
            "direction_label": "BAUST থেকে ফেরার সময়সূচি",
            "route_start_time": "দুপুর ২টা ৩৫ মিনিট",
            "is_estimated": True,
            "notice": RETURN_WARNING_NOTICE,
            "stops": [
                {"serial": "১", "name": "BAUST", "time": "দুপুর ২:৩৫", "fare": None},
                {"serial": "২", "name": "চেলাপীর", "time": "বিকেল ৩:০৫", "fare": "২০ টাকা"},
                {"serial": "৩", "name": "কাজির হাট", "time": "বিকেল ৩:১০", "fare": "৪০ টাকা"},
                {"serial": "৪", "name": "দারোয়ানী", "time": "বিকেল ৩:১৫", "fare": "৪০ টাকা"},
                {"serial": "৫", "name": "কালীবাড়ী", "time": "বিকেল ৩:২০", "fare": "৪০ টাকা"},
                {"serial": "৬", "name": "চৌরঙ্গী", "time": "বিকেল ৩:২৫", "fare": "৪০ টাকা"},
            ],
        },
    },
}
