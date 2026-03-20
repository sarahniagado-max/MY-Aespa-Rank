// Canonical sort order index for sorting fallback (DB-only app)
const SONG_ORDER = {
  "Black Mamba": 1, "Forever": 2, "Next Level": 3, "ænergy": 4, "Savage": 5,
  "I'll Make You Cry": 6, "YEPPI YEPPI": 7, "ICONIC": 8, "Lucid Dream": 9,
  "Dreams Come True": 10, "Girls": 11, "Illusion": 12, "Lingo": 13,
  "Life's Too Short": 14, "ICU": 15, "Life's Too Short (English Version)": 16,
  "Beautiful Christmas": 17, "Hold On Tight": 18, "Welcome to MY World (feat. nævis)": 19,
  "Spicy": 20, "Salty & Sweet": 21, "Thirsty": 22, "I'm Unhappy": 23,
  "'Til We Meet Again": 24, "We Go": 25, "Drama": 26, "Trick or Trick": 27,
  "Don't Blink": 28, "Hot Air Balloon": 29, "YOLO": 30, "You": 31,
  "Better Things": 32, "Jingle Bell Rock": 33,
  "Regret of the Times (2024 aespa Remake ver.)": 34, "Die Trying": 35,
  "Supernova": 36, "Armageddon": 37, "Set The Tone": 38, "Mine": 39,
  "Licorice": 40, "BAHAMA": 41, "Long Chat (#♥)": 42, "Prologue": 43,
  "Live My Life": 44, "Melody": 45, "Hot Mess": 46, "Sun and Moon": 47,
  "ZOOM ZOOM": 48, "UP": 49, "Dopamine": 50, "Bored!": 51, "Spark": 52,
  "Whiplash": 53, "Kill It": 54, "Flights, Not Feelings": 55, "Pink Hoodie": 56,
  "Flowers": 57, "Just Another Girl": 58, "Dirty Work": 59, "Dark Arts": 60,
  "Rich Man": 61, "Drift": 62, "Bubble": 63, "Count On Me": 64, "Angel #48": 65,
  "To The Girls": 66, "Blue": 67, "Ketchup and Lemonade": 68, "Tornado": 69,
  "Good Stuff": 70, "Keychain": 71, "Attitude": 72,
};

export function getSongOrder(title) {
  return SONG_ORDER[title] ?? 999;
}

export const ERAS = ["Savage Era", "Girls Era", "MY WORLD Era", "Drama Era", "Armageddon Era", "Whiplash Era", "Rich Man Era"];