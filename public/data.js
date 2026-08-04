window.XYZ_BINGO = {
  site: {
    name: "XY&Z Productions",
    shortName: "XY&Z Productions",
    baseUrl: "https://mellifluous-parfait-a01655.netlify.app",
    instagram: "https://www.instagram.com/xyandzproductions/",
    contactLabel: "@XYandZproductions",
    location: "Vero Beach, Florida",
    logo: "/assets/xyz-productions-logo.png",
    services: ["Musical Bingo", "Trivia", "Event Hosting"]
  },
  venues: {
    "island-vibes": {
      slug: "island-vibes",
      name: "Island Vibes Kava Bar",
      shortName: "Island Vibes",
      eyebrow: "WEDNESDAY NIGHT MUSICAL BINGO",
      schedule: "Wednesdays · 7:30 PM",
      description: "Two weekly Island Vibes game nights: musical bingo on Wednesdays at 7:30 PM and team trivia on Thursdays at 8:00 PM, all with bright tropical-nightlife energy.",
      theme: "island",
      mark: "IV",
      logo: "/assets/island-vibes-logo.png",
      logoAlt: "Island Vibes Kava Bar Vero Beach logo",
      brandTagline: "Shell. Vibe. Repeat.",
      brandStyle: "Neon tropical nightlife",
      location: "Vero Beach, Florida",
      announcement: "Scan your card, open tonight’s playlist, and keep the good vibes going.",
      externalUrl: "https://www.instagram.com/islandvibesverobeach/",
      externalLabel: "Visit Island Vibes on Instagram",
      rounds: [
        "vibes-bingo",
        "beach-bingo",
        "emo-bingo",
        "edm-bingo",
        "turn-that-down",
        "70s-summer",
        "then-and-now",
        "80s-night",
        "the-download-years",
        "yallternative",
        "northeaster"
      ]
    },
    "mangrove-sands": {
      slug: "mangrove-sands",
      name: "Mangrove Sands Golf Club & Restaurant",
      shortName: "Mangrove Sands",
      eyebrow: "THURSDAY MUSICAL BINGO",
      schedule: "Thursdays · 5:30–7:30 PM",
      description: "A relaxed coastal golf-club experience with clear navigation, larger controls, and rounds selected for the Mangrove Sands crowd.",
      theme: "mangrove",
      mark: "MS",
      logo: "/assets/mangrove-sands-primary.png",
      alternateLogo: "/assets/mangrove-sands-alternate.jpg",
      mascot: "/assets/mangrove-sands-mascot.png",
      logoAlt: "Mangrove Sands Golf Club and Restaurant mangrove tree logo",
      brandTagline: "Come for the golf. Stay for everything else.",
      brandStyle: "Coastal golf-club warmth",
      location: "Vero Beach, Florida",
      announcement: "Choose tonight’s round or scan the QR code printed on your card.",
      externalUrl: "https://mangrovesands.com/",
      externalLabel: "Visit the Mangrove Sands website",
      rounds: [
        "beach-bingo",
        "turn-that-down",
        "70s-summer",
        "then-and-now",
        "80s-night",
        "northeaster",
        "outlaw-country",
        "diner-music"
      ]
    }
  },
  rounds: {
    "vibes-bingo": {
      slug: "vibes-bingo",
      title: "Vibes Bingo",
      subtitle: "Alternative, pop-punk, hip-hop, indie, and Island Vibes favorites.",
      categories: ["Variety", "Alternative", "Island Vibes"],
      spotifyUrl: "",
      legacyUrl: "https://islandvibesmusicalbingo.netlify.app/?round=vibes-bingo",
      venues: ["island-vibes"],
      accent: "sunset",
      needsLink: true
    },
    "beach-bingo": {
      slug: "beach-bingo",
      title: "Beach Bingo",
      subtitle: "Coastal favorites, summer classics, and easygoing hits.",
      categories: ["Beach", "Summer", "Feel Good"],
      spotifyUrl: "https://open.spotify.com/playlist/6IbPAMKpC2DgWQCWRje1zz",
      venues: ["island-vibes", "mangrove-sands"],
      accent: "ocean"
    },
    "emo-bingo": {
      slug: "emo-bingo",
      title: "Emo Bingo",
      subtitle: "Pop-punk, post-hardcore, scene-era favorites, and emotional sing-alongs.",
      categories: ["Emo", "Pop-Punk", "Alternative"],
      spotifyUrl: "",
      legacyUrl: "https://islandvibesmusicalbingo.netlify.app/?round=emo-bingo",
      venues: ["island-vibes"],
      accent: "storm",
      needsLink: true
    },
    "edm-bingo": {
      slug: "edm-bingo",
      title: "EDM Bingo",
      subtitle: "Festival anthems, dance-floor favorites, and electronic throwbacks.",
      categories: ["EDM", "Dance", "Electronic"],
      spotifyUrl: "",
      legacyUrl: "https://islandvibesmusicalbingo.netlify.app/?round=edm-bingo",
      venues: ["island-vibes"],
      accent: "neon",
      needsLink: true
    },
    "turn-that-down": {
      slug: "turn-that-down",
      title: "Turn That Down",
      subtitle: "Guitar-heavy favorites from the 1960s, 1970s, 1980s, and beyond.",
      categories: ["Classic Rock", "Guitar", "Decades"],
      spotifyUrl: "https://open.spotify.com/playlist/59QgNIB11Az9KkWnePsVcb?si=EZqKll6QQ2-TOz-fSp",
      venues: ["island-vibes", "mangrove-sands"],
      accent: "amp"
    },
    "70s-summer": {
      slug: "70s-summer",
      title: "70s Summer",
      subtitle: "Classic hits, sunshine, road trips, and good times.",
      categories: ["1970s", "Summer", "Classic Hits"],
      spotifyUrl: "https://open.spotify.com/playlist/12dSAw0SMJNk9JW6gXIU74",
      venues: ["island-vibes", "mangrove-sands"],
      accent: "gold"
    },
    "then-and-now": {
      slug: "then-and-now",
      title: "Then & Now",
      subtitle: "Familiar favorites paired with the sounds and hits that followed them.",
      categories: ["Decades", "Pop", "Variety"],
      spotifyUrl: "https://open.spotify.com/playlist/2n4fspcNhJNzCpx1TjwSxS",
      venues: ["island-vibes", "mangrove-sands"],
      accent: "split"
    },
    "80s-night": {
      slug: "80s-night",
      title: "80s Night",
      subtitle: "Big hooks, neon nostalgia, rock staples, and sing-along favorites.",
      categories: ["1980s", "Pop", "Rock"],
      spotifyUrl: "https://open.spotify.com/playlist/1mJ8zNrktEdd8Twx4O5WUl?si=a05c8be6e61640cf",
      venues: ["island-vibes", "mangrove-sands"],
      accent: "neon"
    },
    "the-download-years": {
      slug: "the-download-years",
      title: "The Download Years",
      subtitle: "MP3s, mix CDs, TRL, MySpace, flip phones, and 2000s-to-2010s hits.",
      categories: ["2000s", "2010s", "Pop Culture"],
      spotifyUrl: "",
      legacyUrl: "https://islandvibesmusicalbingo.netlify.app/?round=the-download-years",
      venues: ["island-vibes"],
      accent: "split",
      needsLink: true
    },
    "yallternative": {
      slug: "yallternative",
      title: "Yallternative",
      subtitle: "Alternative country, Americana, roots, and modern renegades.",
      categories: ["Country", "Alternative", "Americana"],
      spotifyUrl: "https://open.spotify.com/playlist/7vIr13t7jzbf2FZWe2OMPM?si=bc47207052bc4a23",
      venues: ["island-vibes"],
      accent: "sunset"
    },
    "northeaster": {
      slug: "northeaster",
      title: "Northeaster",
      subtitle: "Ramones, Sonic Youth, Velvet Underground, Aerosmith, Dropkick Murphys, and more.",
      categories: ["Rock", "Alternative", "Northeast"],
      spotifyUrl: "https://open.spotify.com/playlist/2TuO52EXbhV9Uo3oseurYi?si=806973808f0c4880",
      venues: ["island-vibes", "mangrove-sands"],
      accent: "storm"
    },
    "outlaw-country": {
      slug: "outlaw-country",
      title: "Outlaw Country",
      subtitle: "Classic rebels, modern renegades, and country storytelling.",
      categories: ["Country", "Outlaw", "Americana"],
      spotifyUrl: "https://open.spotify.com/playlist/4HIhLsm7t4lQHrlPZP7ySi?si=fb54a7099c2e4a92",
      venues: ["mangrove-sands"],
      accent: "outlaw"
    },
    "diner-music": {
      slug: "diner-music",
      title: "Diner Music",
      subtitle: "Jukebox favorites, rock & roll, doo-wop, soul, and Motown.",
      categories: ["Oldies", "Doo-Wop", "Motown"],
      spotifyUrl: "",
      legacyUrl: "https://mangrovesandsmusicalbingo.netlify.app/?round=diner-music",
      venues: ["mangrove-sands"],
      accent: "diner",
      needsLink: true
    }
  }
};
