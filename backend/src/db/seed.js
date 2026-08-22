const { db } = require('../config/db');
const { users, cities, activities } = require('./schema');
const bcrypt = require('bcryptjs');
const { eq } = require('drizzle-orm');

// ─── Seed Data ──────────────────────────────────────────────────────────────

const CITIES_DATA = [
  // Asia
  { name: 'Tokyo',       country: 'Japan',        region: 'Asia',          costIndex: '72.50', popularityScore: 98 },
  { name: 'Kyoto',       country: 'Japan',        region: 'Asia',          costIndex: '65.00', popularityScore: 91 },
  { name: 'Osaka',       country: 'Japan',        region: 'Asia',          costIndex: '60.00', popularityScore: 88 },
  { name: 'Bangkok',     country: 'Thailand',     region: 'Asia',          costIndex: '35.00', popularityScore: 94 },
  { name: 'Bali',        country: 'Indonesia',    region: 'Asia',          costIndex: '28.00', popularityScore: 92 },
  { name: 'Singapore',   country: 'Singapore',    region: 'Asia',          costIndex: '85.00', popularityScore: 89 },
  { name: 'Hanoi',       country: 'Vietnam',      region: 'Asia',          costIndex: '22.00', popularityScore: 82 },
  { name: 'Seoul',       country: 'South Korea',  region: 'Asia',          costIndex: '58.00', popularityScore: 87 },
  // Europe
  { name: 'Paris',       country: 'France',       region: 'Europe',        costIndex: '90.00', popularityScore: 99 },
  { name: 'Rome',        country: 'Italy',        region: 'Europe',        costIndex: '75.00', popularityScore: 96 },
  { name: 'Barcelona',   country: 'Spain',        region: 'Europe',        costIndex: '70.00', popularityScore: 95 },
  { name: 'Amsterdam',   country: 'Netherlands',  region: 'Europe',        costIndex: '80.00', popularityScore: 90 },
  { name: 'Prague',      country: 'Czech Republic', region: 'Europe',      costIndex: '45.00', popularityScore: 86 },
  { name: 'Lisbon',      country: 'Portugal',     region: 'Europe',        costIndex: '55.00', popularityScore: 88 },
  { name: 'Vienna',      country: 'Austria',      region: 'Europe',        costIndex: '78.00', popularityScore: 85 },
  { name: 'Santorini',   country: 'Greece',       region: 'Europe',        costIndex: '82.00', popularityScore: 93 },
  // Americas
  { name: 'New York',    country: 'USA',          region: 'North America', costIndex: '100.00', popularityScore: 99 },
  { name: 'San Francisco', country: 'USA',        region: 'North America', costIndex: '98.00', popularityScore: 88 },
  { name: 'Miami',       country: 'USA',          region: 'North America', costIndex: '85.00', popularityScore: 86 },
  { name: 'Mexico City', country: 'Mexico',       region: 'North America', costIndex: '40.00', popularityScore: 84 },
  { name: 'Buenos Aires', country: 'Argentina',   region: 'South America', costIndex: '32.00', popularityScore: 80 },
  { name: 'Rio de Janeiro', country: 'Brazil',    region: 'South America', costIndex: '42.00', popularityScore: 85 },
  { name: 'Cartagena',   country: 'Colombia',     region: 'South America', costIndex: '30.00', popularityScore: 78 },
  { name: 'Cusco',       country: 'Peru',         region: 'South America', costIndex: '25.00', popularityScore: 83 },
  // Middle East & Africa
  { name: 'Dubai',       country: 'UAE',          region: 'Middle East',   costIndex: '92.00', popularityScore: 91 },
  { name: 'Istanbul',    country: 'Turkey',       region: 'Middle East',   costIndex: '48.00', popularityScore: 90 },
  { name: 'Marrakech',   country: 'Morocco',      region: 'Africa',        costIndex: '30.00', popularityScore: 82 },
  { name: 'Cape Town',   country: 'South Africa', region: 'Africa',        costIndex: '38.00', popularityScore: 84 },
  // Oceania
  { name: 'Sydney',      country: 'Australia',    region: 'Oceania',       costIndex: '88.00', popularityScore: 89 },
  { name: 'Melbourne',   country: 'Australia',    region: 'Oceania',       costIndex: '84.00', popularityScore: 82 },
  // South Asia
  { name: 'Mumbai',      country: 'India',        region: 'South Asia',    costIndex: '28.00', popularityScore: 79 },
  { name: 'Delhi',       country: 'India',        region: 'South Asia',    costIndex: '22.00', popularityScore: 76 },
  { name: 'Jaipur',      country: 'India',        region: 'South Asia',    costIndex: '18.00', popularityScore: 74 },
  { name: 'Kathmandu',   country: 'Nepal',        region: 'South Asia',    costIndex: '15.00', popularityScore: 71 },
  // Canada & Oceania
  { name: 'Toronto',     country: 'Canada',       region: 'North America', costIndex: '82.00', popularityScore: 80 },
  { name: 'Vancouver',   country: 'Canada',       region: 'North America', costIndex: '85.00', popularityScore: 78 },
  { name: 'Queenstown',  country: 'New Zealand',  region: 'Oceania',       costIndex: '75.00', popularityScore: 77 },
  { name: 'Edinburgh',   country: 'UK',           region: 'Europe',        costIndex: '72.00', popularityScore: 81 },
  { name: 'Dubrovnik',   country: 'Croatia',      region: 'Europe',        costIndex: '68.00', popularityScore: 83 },
  { name: 'Reykjavik',   country: 'Iceland',      region: 'Europe',        costIndex: '95.00', popularityScore: 79 },
];

// Activities per city (5-10 per city, all categories covered)
function buildActivities(cityMap) {
  return [
    // ── Tokyo ──────────────────────────────────────────────────────────────
    { cityName: 'Tokyo', name: 'Senso-ji Temple', category: 'sightseeing', cost: '0', duration: 90, description: 'Tokyo\'s oldest and most iconic Buddhist temple in Asakusa.' },
    { cityName: 'Tokyo', name: 'Tsukiji Fish Market Tour', category: 'food', cost: '20', duration: 120, description: 'Explore the outer market, taste fresh sashimi and street food.' },
    { cityName: 'Tokyo', name: 'Shibuya Crossing & Shopping', category: 'culture', cost: '0', duration: 180, description: 'Experience the world\'s busiest pedestrian crossing and Shibuya retail.' },
    { cityName: 'Tokyo', name: 'TeamLab Borderless Digital Art', category: 'culture', cost: '32', duration: 180, description: 'Immersive digital art museum in Odaiba.' },
    { cityName: 'Tokyo', name: 'Mount Takao Day Hike', category: 'adventure', cost: '5', duration: 360, description: 'Scenic hike with views of Mt. Fuji on clear days.' },
    { cityName: 'Tokyo', name: 'Shinjuku Nightlife Bar Hop', category: 'nightlife', cost: '40', duration: 240, description: 'Golden Gai and Kabukicho bar crawl.' },
    { cityName: 'Tokyo', name: 'Tokyo DisneySea', category: 'relaxation', cost: '85', duration: 480, description: 'Unique Disney theme park only found in Japan.' },
    // ── Kyoto ──────────────────────────────────────────────────────────────
    { cityName: 'Kyoto', name: 'Fushimi Inari Shrine', category: 'sightseeing', cost: '0', duration: 150, description: 'Famous thousands of torii gates winding up a mountainside.' },
    { cityName: 'Kyoto', name: 'Arashiyama Bamboo Grove', category: 'sightseeing', cost: '0', duration: 90, description: 'Walk through towering bamboo forest near the Tenryu-ji garden.' },
    { cityName: 'Kyoto', name: 'Tea Ceremony Experience', category: 'culture', cost: '35', duration: 90, description: 'Traditional Japanese matcha tea ceremony in a historic machiya.' },
    { cityName: 'Kyoto', name: 'Nishiki Market Street Food', category: 'food', cost: '25', duration: 120, description: '"Kyoto\'s Kitchen" — 400-year-old covered market with local delicacies.' },
    { cityName: 'Kyoto', name: 'Gion District Evening Walk', category: 'culture', cost: '0', duration: 120, description: 'Historic geisha district — best explored at dusk.' },
    { cityName: 'Kyoto', name: 'Kinkaku-ji Golden Pavilion', category: 'sightseeing', cost: '5', duration: 60, description: 'Zen Buddhist temple coated in gold leaf on a reflective pond.' },
    // ── Osaka ──────────────────────────────────────────────────────────────
    { cityName: 'Osaka', name: 'Dotonbori Food Tour', category: 'food', cost: '30', duration: 180, description: 'Takoyaki, okonomiyaki, and ramen in Osaka\'s neon-lit canal district.' },
    { cityName: 'Osaka', name: 'Osaka Castle', category: 'sightseeing', cost: '6', duration: 120, description: 'Restored 16th-century castle with panoramic city views.' },
    { cityName: 'Osaka', name: 'Universal Studios Japan', category: 'adventure', cost: '95', duration: 600, description: 'Wizarding World of Harry Potter and Super Nintendo World.' },
    { cityName: 'Osaka', name: 'Shinsaibashi Shopping', category: 'culture', cost: '0', duration: 180, description: 'Osaka\'s premier shopping arcade with local and international brands.' },
    { cityName: 'Osaka', name: 'Kuromon Ichiba Market', category: 'food', cost: '20', duration: 90, description: '"Osaka\'s Kitchen" — fresh seafood and street food market.' },
    // ── Bangkok ────────────────────────────────────────────────────────────
    { cityName: 'Bangkok', name: 'Grand Palace & Wat Phra Kaew', category: 'sightseeing', cost: '15', duration: 180, description: 'Thailand\'s most sacred complex housing the Emerald Buddha.' },
    { cityName: 'Bangkok', name: 'Chao Phraya River Cruise', category: 'relaxation', cost: '12', duration: 120, description: 'Evening cruise past illuminated temples and riverside life.' },
    { cityName: 'Bangkok', name: 'Floating Market Tour', category: 'culture', cost: '25', duration: 240, description: 'Explore Damnoen Saduak or Amphawa floating markets.' },
    { cityName: 'Bangkok', name: 'Street Food Night Tour', category: 'food', cost: '20', duration: 180, description: 'Guide-led tour through Chinatown and Yaowarat Road stalls.' },
    { cityName: 'Bangkok', name: 'Muay Thai Class', category: 'adventure', cost: '30', duration: 120, description: 'Learn the basics of Thailand\'s national martial art.' },
    { cityName: 'Bangkok', name: 'Khao San Road Nightlife', category: 'nightlife', cost: '25', duration: 300, description: 'Backpacker district famous for bars, music, and street food.' },
    // ── Bali ───────────────────────────────────────────────────────────────
    { cityName: 'Bali', name: 'Tanah Lot Sunset Temple', category: 'sightseeing', cost: '5', duration: 120, description: 'Iconic sea temple perched on a rock formation at sunset.' },
    { cityName: 'Bali', name: 'Rice Terrace Trekking (Tegallalang)', category: 'adventure', cost: '10', duration: 180, description: 'Trek through stunning UNESCO-listed rice terraces near Ubud.' },
    { cityName: 'Bali', name: 'Traditional Balinese Cooking Class', category: 'food', cost: '35', duration: 240, description: 'Market visit + cook 6 authentic Balinese dishes.' },
    { cityName: 'Bali', name: 'Kuta Beach Surf Lesson', category: 'adventure', cost: '20', duration: 120, description: 'Beginner-friendly surf lesson at Bali\'s most famous beach.' },
    { cityName: 'Bali', name: 'Ubud Traditional Dance Show', category: 'culture', cost: '12', duration: 90, description: 'Kecak fire dance performance at the Uluwatu Temple amphitheater.' },
    { cityName: 'Bali', name: 'Spa & Wellness Retreat', category: 'relaxation', cost: '40', duration: 180, description: 'Full-body traditional Balinese massage and flower bath.' },
    // ── Singapore ──────────────────────────────────────────────────────────
    { cityName: 'Singapore', name: 'Gardens by the Bay', category: 'sightseeing', cost: '18', duration: 180, description: 'Futuristic Supertrees and climate-controlled flower domes.' },
    { cityName: 'Singapore', name: 'Hawker Centre Food Crawl', category: 'food', cost: '15', duration: 120, description: 'Chicken rice, laksa, and chilli crab at Maxwell or Lau Pa Sat.' },
    { cityName: 'Singapore', name: 'Sentosa Island Adventure', category: 'adventure', cost: '55', duration: 480, description: 'Universal Studios, S.E.A. Aquarium, and beach clubs.' },
    { cityName: 'Singapore', name: 'Chinatown & Little India Walk', category: 'culture', cost: '0', duration: 180, description: 'Colorful heritage streets, temples, and spice markets.' },
    { cityName: 'Singapore', name: 'Clarke Quay Nightlife', category: 'nightlife', cost: '50', duration: 240, description: 'Riverside entertainment district with clubs and rooftop bars.' },
    // ── Hanoi ──────────────────────────────────────────────────────────────
    { cityName: 'Hanoi', name: 'Hoan Kiem Lake & Ngoc Son Temple', category: 'sightseeing', cost: '0', duration: 90, description: 'Scenic lake and historic temple in the heart of Hanoi.' },
    { cityName: 'Hanoi', name: 'Pho & Banh Mi Street Food Tour', category: 'food', cost: '15', duration: 150, description: 'Guide-led morning tour through Old Quarter\'s best street eats.' },
    { cityName: 'Hanoi', name: 'Water Puppet Show', category: 'culture', cost: '7', duration: 60, description: 'Unique Vietnamese art form dating back to the 11th century.' },
    { cityName: 'Hanoi', name: 'Ha Long Bay Day Cruise', category: 'adventure', cost: '80', duration: 720, description: 'Cruise among thousands of limestone karsts by traditional junk boat.' },
    { cityName: 'Hanoi', name: 'Bia Hoi Corner Nightlife', category: 'nightlife', cost: '10', duration: 180, description: 'Sit on tiny plastic stools at the world\'s cheapest beer junction.' },
    // ── Seoul ──────────────────────────────────────────────────────────────
    { cityName: 'Seoul', name: 'Gyeongbokgung Palace', category: 'sightseeing', cost: '3', duration: 150, description: 'The largest of Seoul\'s Five Grand Palaces from the Joseon dynasty.' },
    { cityName: 'Seoul', name: 'Korean BBQ Dinner', category: 'food', cost: '25', duration: 120, description: 'Grill samgyeopsal and galbi at a traditional charcoal BBQ restaurant.' },
    { cityName: 'Seoul', name: 'Hongdae Street Art & Clubs', category: 'nightlife', cost: '20', duration: 300, description: 'University district known for indie music, clubs, and street performers.' },
    { cityName: 'Seoul', name: 'K-pop Dance Class', category: 'culture', cost: '30', duration: 120, description: 'Learn choreography from a professional K-pop dance studio.' },
    { cityName: 'Seoul', name: 'N Seoul Tower', category: 'sightseeing', cost: '10', duration: 120, description: 'Panoramic city views from the iconic tower on Namsan Mountain.' },
    // ── Paris ──────────────────────────────────────────────────────────────
    { cityName: 'Paris', name: 'Eiffel Tower Visit', category: 'sightseeing', cost: '26', duration: 180, description: 'Ascend the Iron Lady for iconic views over the city of light.' },
    { cityName: 'Paris', name: 'Louvre Museum', category: 'culture', cost: '17', duration: 240, description: 'World\'s largest art museum, home to the Mona Lisa.' },
    { cityName: 'Paris', name: 'Seine River Bateaux Mouches Cruise', category: 'relaxation', cost: '15', duration: 90, description: 'Glass-topped boat cruise past Notre-Dame, Louvre, and Eiffel.' },
    { cityName: 'Paris', name: 'Montmartre & Sacré-Cœur', category: 'sightseeing', cost: '0', duration: 150, description: 'Bohemian hilltop neighborhood with artist studios and basilica.' },
    { cityName: 'Paris', name: 'French Patisserie Baking Class', category: 'food', cost: '85', duration: 240, description: 'Learn to make croissants and macarons with a French pastry chef.' },
    { cityName: 'Paris', name: 'Moulin Rouge Cabaret Show', category: 'nightlife', cost: '110', duration: 180, description: 'The world\'s most famous cabaret with dinner and champagne.' },
    // ── Rome ───────────────────────────────────────────────────────────────
    { cityName: 'Rome', name: 'Colosseum & Roman Forum', category: 'sightseeing', cost: '18', duration: 240, description: 'Walk through 2,000 years of history at Rome\'s ancient amphitheater.' },
    { cityName: 'Rome', name: 'Vatican Museums & Sistine Chapel', category: 'culture', cost: '25', duration: 300, description: 'Michelangelo\'s masterpiece ceiling and St. Peter\'s Basilica.' },
    { cityName: 'Rome', name: 'Pasta Making Class', category: 'food', cost: '60', duration: 180, description: 'Hand-roll fresh pasta with a local nonna in a traditional kitchen.' },
    { cityName: 'Rome', name: 'Trastevere Evening Food Walk', category: 'food', cost: '35', duration: 180, description: 'Wine, supplì, and gelato through Rome\'s most charming neighborhood.' },
    { cityName: 'Rome', name: 'Borghese Gallery', category: 'culture', cost: '13', duration: 120, description: 'Bernini sculptures and Caravaggio paintings in a Baroque villa.' },
    // ── Barcelona ──────────────────────────────────────────────────────────
    { cityName: 'Barcelona', name: 'Sagrada Família Guided Tour', category: 'sightseeing', cost: '26', duration: 150, description: 'Gaudí\'s unfinished Gothic-Modernist basilica, still under construction since 1882.' },
    { cityName: 'Barcelona', name: 'Park Güell', category: 'sightseeing', cost: '10', duration: 120, description: 'Whimsical Gaudí park with mosaic terraces and gingerbread gatehouses.' },
    { cityName: 'Barcelona', name: 'La Boqueria Market', category: 'food', cost: '15', duration: 90, description: 'Barcelona\'s famous covered market for fresh produce, tapas, and jamón.' },
    { cityName: 'Barcelona', name: 'Flamenco Show', category: 'culture', cost: '35', duration: 90, description: 'Passionate flamenco performance in an intimate tablao venue.' },
    { cityName: 'Barcelona', name: 'Barceloneta Beach Day', category: 'relaxation', cost: '0', duration: 240, description: 'Sun, sea, and chiringuito cocktails on the city beach.' },
    { cityName: 'Barcelona', name: 'Gothic Quarter Walking Tour', category: 'culture', cost: '0', duration: 150, description: 'Maze of medieval streets with 2,000 years of layered history.' },
    // ── Amsterdam ──────────────────────────────────────────────────────────
    { cityName: 'Amsterdam', name: 'Canal Boat Tour', category: 'sightseeing', cost: '18', duration: 90, description: 'Glide through 17th-century canal rings — a UNESCO World Heritage Site.' },
    { cityName: 'Amsterdam', name: 'Rijksmuseum', category: 'culture', cost: '22', duration: 180, description: 'Rembrandt\'s Night Watch and Vermeer\'s Milkmaid in a grand national museum.' },
    { cityName: 'Amsterdam', name: 'Anne Frank House', category: 'culture', cost: '16', duration: 90, description: 'Moving wartime hiding place of Anne Frank, now a historic museum.' },
    { cityName: 'Amsterdam', name: 'Vondelpark Bike Ride', category: 'adventure', cost: '12', duration: 180, description: 'Rent a bike and explore Amsterdam\'s beloved green park and canals.' },
    { cityName: 'Amsterdam', name: 'Heineken Experience', category: 'food', cost: '21', duration: 90, description: 'Interactive brewery tour with tasting sessions and a rooftop bar.' },
    // ── Prague ─────────────────────────────────────────────────────────────
    { cityName: 'Prague', name: 'Prague Castle Complex', category: 'sightseeing', cost: '14', duration: 180, description: 'Largest ancient castle in the world, overlooking the Vltava River.' },
    { cityName: 'Prague', name: 'Old Town Square & Astronomical Clock', category: 'sightseeing', cost: '0', duration: 90, description: 'Medieval square with the hourly astronomical clock show.' },
    { cityName: 'Prague', name: 'Czech Beer & Food Tour', category: 'food', cost: '35', duration: 240, description: 'Guided tour of Prague\'s best traditional pubs with svíčková and svařák.' },
    { cityName: 'Prague', name: 'Bohemian Switzerland Day Trip', category: 'adventure', cost: '40', duration: 600, description: 'Hike through the Pravčická Gate natural sandstone arch in Bohemia.' },
    // ── Lisbon ─────────────────────────────────────────────────────────────
    { cityName: 'Lisbon', name: 'Belém Tower & Jerónimos Monastery', category: 'sightseeing', cost: '12', duration: 180, description: 'Manueline monuments from the Age of Exploration UNESCO sites.' },
    { cityName: 'Lisbon', name: 'Fado Dinner Show', category: 'culture', cost: '45', duration: 180, description: 'Portugal\'s soulful music genre in an authentic Alfama tavern.' },
    { cityName: 'Lisbon', name: 'Time Out Market', category: 'food', cost: '20', duration: 120, description: 'Curated hall of Lisbon\'s best chefs — pastéis de nata to bacalhau.' },
    { cityName: 'Lisbon', name: 'Sintra Palace Day Trip', category: 'sightseeing', cost: '30', duration: 480, description: 'Fairy-tale palaces in the misty hills 40 minutes from Lisbon.' },
    { cityName: 'Lisbon', name: 'Tram 28 Ride through Alfama', category: 'culture', cost: '3', duration: 60, description: 'Iconic yellow tram winding through the oldest neighborhood in Lisbon.' },
    // ── New York ───────────────────────────────────────────────────────────
    { cityName: 'New York', name: 'Statue of Liberty & Ellis Island', category: 'sightseeing', cost: '24', duration: 300, description: 'Ferry to the iconic copper statue and immigrant history museum.' },
    { cityName: 'New York', name: 'High Line Walk', category: 'sightseeing', cost: '0', duration: 120, description: 'Elevated park built on former rail tracks with city views and art.' },
    { cityName: 'New York', name: 'Broadway Show', category: 'culture', cost: '120', duration: 180, description: 'See a world-class musical or play on the Great White Way.' },
    { cityName: 'New York', name: 'NYC Pizza Tour', category: 'food', cost: '35', duration: 150, description: 'Guided walking tour tasting New York\'s legendary slice joints.' },
    { cityName: 'New York', name: 'Central Park Bike Tour', category: 'adventure', cost: '25', duration: 180, description: 'Cycle through 843 acres of green space in the heart of Manhattan.' },
    { cityName: 'New York', name: 'Brooklyn Rooftop Bar Crawl', category: 'nightlife', cost: '50', duration: 300, description: 'Panoramic Manhattan skyline views from Brooklyn\'s best rooftop bars.' },
    // ── Dubai ──────────────────────────────────────────────────────────────
    { cityName: 'Dubai', name: 'Burj Khalifa At the Top', category: 'sightseeing', cost: '40', duration: 120, description: 'Observation deck on the world\'s tallest building, 148 floors up.' },
    { cityName: 'Dubai', name: 'Desert Safari with BBQ Dinner', category: 'adventure', cost: '55', duration: 360, description: 'Dune bashing, camel rides, sandboarding, and starlit BBQ dinner.' },
    { cityName: 'Dubai', name: 'Dubai Creek Dhow Cruise', category: 'relaxation', cost: '30', duration: 180, description: 'Traditional wooden dhow dinner cruise on the historic creek.' },
    { cityName: 'Dubai', name: 'Dubai Mall & Fountain Show', category: 'culture', cost: '0', duration: 180, description: 'World\'s largest mall and the spectacular Dubai Fountain at dusk.' },
    { cityName: 'Dubai', name: 'Jumeirah Mosque Tour', category: 'culture', cost: '10', duration: 90, description: 'One of the only mosques in Dubai open to non-Muslim visitors.' },
    // ── Istanbul ───────────────────────────────────────────────────────────
    { cityName: 'Istanbul', name: 'Hagia Sophia & Blue Mosque', category: 'sightseeing', cost: '8', duration: 180, description: 'Two of the world\'s greatest sacred buildings, steps apart.' },
    { cityName: 'Istanbul', name: 'Grand Bazaar Shopping', category: 'culture', cost: '0', duration: 180, description: '4,000+ shops selling spices, carpets, ceramics, and jewelry.' },
    { cityName: 'Istanbul', name: 'Bosphorus Sunset Cruise', category: 'relaxation', cost: '20', duration: 150, description: 'Sail between Europe and Asia on the world\'s only intercontinental strait.' },
    { cityName: 'Istanbul', name: 'Turkish Hamam Experience', category: 'relaxation', cost: '35', duration: 120, description: 'Traditional steam bath, scrub, and oil massage in a historic hammam.' },
    { cityName: 'Istanbul', name: 'Topkapi Palace', category: 'sightseeing', cost: '15', duration: 180, description: 'Former Ottoman imperial palace now housing sacred Islamic relics.' },
    // ── Marrakech ──────────────────────────────────────────────────────────
    { cityName: 'Marrakech', name: 'Djemaa el-Fna Square', category: 'culture', cost: '0', duration: 180, description: 'UNESCO-listed square with snake charmers, storytellers, and food stalls.' },
    { cityName: 'Marrakech', name: 'Majorelle Garden', category: 'sightseeing', cost: '8', duration: 90, description: 'Cobalt-blue villa and botanical garden designed by Yves Saint Laurent.' },
    { cityName: 'Marrakech', name: 'Moroccan Cooking Class', category: 'food', cost: '40', duration: 240, description: 'Souk market visit + cook tagine and pastilla with a local chef.' },
    { cityName: 'Marrakech', name: 'Desert Camel Trek', category: 'adventure', cost: '50', duration: 480, description: 'Sunset camel ride to a Berber camp with stargazing in the Sahara.' },
    // ── Cape Town ──────────────────────────────────────────────────────────
    { cityName: 'Cape Town', name: 'Table Mountain Cable Car', category: 'sightseeing', cost: '22', duration: 180, description: 'Iconic flat-topped mountain with 360-degree Cape Peninsula views.' },
    { cityName: 'Cape Town', name: 'Cape Peninsula Day Tour', category: 'adventure', cost: '45', duration: 600, description: 'Drive to Cape Point, penguin colony at Boulders Beach, and Chapman\'s Peak.' },
    { cityName: 'Cape Town', name: 'Boulders Penguin Colony', category: 'sightseeing', cost: '10', duration: 120, description: 'Walk among thousands of wild African penguins on a protected beach.' },
    { cityName: 'Cape Town', name: 'Cape Winelands Tour', category: 'food', cost: '55', duration: 480, description: 'Visit Stellenbosch and Franschhoek wine estates with tastings.' },
    // ── Sydney ─────────────────────────────────────────────────────────────
    { cityName: 'Sydney', name: 'Sydney Opera House Tour', category: 'sightseeing', cost: '37', duration: 90, description: 'Backstage and architectural tour of the world\'s most famous performing arts venue.' },
    { cityName: 'Sydney', name: 'Bondi to Coogee Coastal Walk', category: 'adventure', cost: '0', duration: 180, description: 'Stunning 6km clifftop trail between two of Sydney\'s iconic beaches.' },
    { cityName: 'Sydney', name: 'Sydney Harbour Bridge Climb', category: 'adventure', cost: '170', duration: 240, description: 'Climb to the summit of the Harbor Bridge for unmatched panoramas.' },
    { cityName: 'Sydney', name: 'Fish Market Seafood Breakfast', category: 'food', cost: '30', duration: 90, description: 'One of the world\'s largest fish markets — oysters, lobster, and prawns.' },
    { cityName: 'Sydney', name: 'Darling Harbour Evening', category: 'relaxation', cost: '0', duration: 180, description: 'Waterfront precinct with restaurants, bars, and free fountain shows.' },
    // ── Mumbai ─────────────────────────────────────────────────────────────
    { cityName: 'Mumbai', name: 'Gateway of India & Taj Hotel', category: 'sightseeing', cost: '0', duration: 90, description: 'Iconic colonial arch on the harbor, facing India\'s most famous hotel.' },
    { cityName: 'Mumbai', name: 'Dharavi Slum Walk', category: 'culture', cost: '20', duration: 180, description: 'Responsible guided tour of Asia\'s largest urban slum and its industries.' },
    { cityName: 'Mumbai', name: 'Street Food Walk — Vada Pav to Pav Bhaji', category: 'food', cost: '12', duration: 150, description: 'Guided walk through Mumbai\'s legendary street food scenes.' },
    { cityName: 'Mumbai', name: 'Bollywood Studio Tour', category: 'culture', cost: '25', duration: 180, description: 'Behind-the-scenes look at India\'s film industry in Film City.' },
    // ── Jaipur ─────────────────────────────────────────────────────────────
    { cityName: 'Jaipur', name: 'Amber Fort Elephant Ride', category: 'sightseeing', cost: '20', duration: 240, description: 'Majestic 16th-century hilltop fort with optional elephant ascent.' },
    { cityName: 'Jaipur', name: 'Hawa Mahal — Palace of Winds', category: 'sightseeing', cost: '2', duration: 60, description: 'Ornate five-story sandstone palace with 953 small windows.' },
    { cityName: 'Jaipur', name: 'Block Printing Textile Workshop', category: 'culture', cost: '15', duration: 120, description: 'Learn traditional Rajasthani block-printing techniques with natural dyes.' },
    { cityName: 'Jaipur', name: 'Rajasthani Thali Cooking Class', category: 'food', cost: '30', duration: 180, description: 'Cook a full Rajasthani spread — dal baati churma, gatte ki sabzi.' },
    // ── Buenos Aires ───────────────────────────────────────────────────────
    { cityName: 'Buenos Aires', name: 'Tango Show & Class', category: 'culture', cost: '40', duration: 240, description: 'Dinner tango show in San Telmo plus a beginner lesson before.' },
    { cityName: 'Buenos Aires', name: 'La Boca Neighborhood Walk', category: 'sightseeing', cost: '0', duration: 120, description: 'Colorful Caminito street art district, birthplace of tango.' },
    { cityName: 'Buenos Aires', name: 'Argentine Asado Experience', category: 'food', cost: '45', duration: 240, description: 'Traditional wood-fire grill with chimichurri, malbec, and empanadas.' },
    { cityName: 'Buenos Aires', name: 'MALBA Modern Art Museum', category: 'culture', cost: '8', duration: 120, description: 'Premier Latin American modern art collection in Palermo.' },
    // ── Rio de Janeiro ─────────────────────────────────────────────────────
    { cityName: 'Rio de Janeiro', name: 'Christ the Redeemer', category: 'sightseeing', cost: '20', duration: 180, description: 'Cable car and train to the iconic Art Deco Christ statue on Corcovado.' },
    { cityName: 'Rio de Janeiro', name: 'Copacabana & Ipanema Beach', category: 'relaxation', cost: '0', duration: 360, description: 'Sun and caiprinhas on two of the world\'s most famous urban beaches.' },
    { cityName: 'Rio de Janeiro', name: 'Samba School Night Tour', category: 'nightlife', cost: '35', duration: 300, description: 'Visit a rehearsal of Rio\'s carnival samba schools — live drums and dancing.' },
    { cityName: 'Rio de Janeiro', name: 'Hang Gliding over Rio', category: 'adventure', cost: '90', duration: 60, description: 'Tandem hang glide from Pedra Bonita with views of Guanabara Bay.' },
    // ── Cusco ──────────────────────────────────────────────────────────────
    { cityName: 'Cusco', name: 'Machu Picchu Day Trip', category: 'sightseeing', cost: '75', duration: 720, description: 'Train to the Inca citadel in the clouds — the ultimate Peruvian experience.' },
    { cityName: 'Cusco', name: 'Sacred Valley Tour', category: 'adventure', cost: '40', duration: 480, description: 'Pisac market, Ollantaytambo ruins, and traditional villages.' },
    { cityName: 'Cusco', name: 'Peruvian Cooking Class', category: 'food', cost: '35', duration: 240, description: 'Ceviche, lomo saltado, and pisco sour class in a colonial kitchen.' },
    { cityName: 'Cusco', name: 'Rainbow Mountain Hike', category: 'adventure', cost: '30', duration: 600, description: 'Arduous but stunning hike to the multicolored Vinicunca Mountain.' },
    // ── Santorini ──────────────────────────────────────────────────────────
    { cityName: 'Santorini', name: 'Oia Sunset Walk', category: 'sightseeing', cost: '0', duration: 180, description: 'Walk the caldera rim to the famous blue-dome village of Oia at sunset.' },
    { cityName: 'Santorini', name: 'Caldera Catamaran Cruise', category: 'relaxation', cost: '85', duration: 480, description: 'Sail to volcanic islands, hot springs, and the Red Beach by catamaran.' },
    { cityName: 'Santorini', name: 'Akrotiri Minoan Excavation', category: 'culture', cost: '12', duration: 90, description: 'Walk through a 3,600-year-old Minoan city preserved by volcanic ash.' },
    { cityName: 'Santorini', name: 'Greek Wine & Cheese Tasting', category: 'food', cost: '40', duration: 120, description: 'Volcanic soil Assyrtiko wines paired with local fava and white eggplant.' },
    // ── Edinburgh ──────────────────────────────────────────────────────────
    { cityName: 'Edinburgh', name: 'Edinburgh Castle', category: 'sightseeing', cost: '18', duration: 180, description: 'Volcanic rock fortress housing Scotland\'s crown jewels.' },
    { cityName: 'Edinburgh', name: 'Arthur\'s Seat Hike', category: 'adventure', cost: '0', duration: 150, description: 'Extinct volcano in the city center with panoramic views.' },
    { cityName: 'Edinburgh', name: 'Scotch Whisky Experience', category: 'food', cost: '18', duration: 75, description: 'Guided tasting of Scotland\'s most iconic spirit on the Royal Mile.' },
    { cityName: 'Edinburgh', name: 'Greyfriars Kirkyard Ghost Tour', category: 'culture', cost: '15', duration: 90, description: 'Spine-chilling night tour of one of the UK\'s most haunted cemeteries.' },
    // ── Dubrovnik ──────────────────────────────────────────────────────────
    { cityName: 'Dubrovnik', name: 'City Walls Walk', category: 'sightseeing', cost: '15', duration: 120, description: 'Walk the full 2km medieval wall encircling the Old City.' },
    { cityName: 'Dubrovnik', name: 'Game of Thrones Tour', category: 'culture', cost: '25', duration: 180, description: 'Visit filming locations for King\'s Landing throughout the city.' },
    { cityName: 'Dubrovnik', name: 'Sea Kayaking & Snorkeling', category: 'adventure', cost: '45', duration: 240, description: 'Paddle around the city walls and snorkel in the Adriatic.' },
    { cityName: 'Dubrovnik', name: 'Elafiti Islands Day Trip', category: 'relaxation', cost: '55', duration: 480, description: 'Three-island boat tour with swimming and fresh seafood lunch.' },
    // ── Queenstown ─────────────────────────────────────────────────────────
    { cityName: 'Queenstown', name: 'Bungy Jump at Kawarau Bridge', category: 'adventure', cost: '180', duration: 120, description: 'The world\'s first commercial bungy jump, above the Kawarau River.' },
    { cityName: 'Queenstown', name: 'Milford Sound Day Trip', category: 'sightseeing', cost: '115', duration: 720, description: 'Cruise through the fiord with cascading waterfalls and dolphin sightings.' },
    { cityName: 'Queenstown', name: 'Skyline Gondola & Luge', category: 'adventure', cost: '35', duration: 180, description: 'Gondola to the Skyline restaurant with panoramic lake views and luge rides.' },
    { cityName: 'Queenstown', name: 'Central Otago Wine Tour', category: 'food', cost: '65', duration: 360, description: 'Visit Pinot Noir vineyards in the dramatic Gibbston Valley.' },
    // ── Reykjavik ──────────────────────────────────────────────────────────
    { cityName: 'Reykjavik', name: 'Northern Lights Tour', category: 'adventure', cost: '60', duration: 360, description: 'Night jeep tour to dark-sky sites to witness the Aurora Borealis.' },
    { cityName: 'Reykjavik', name: 'Blue Lagoon Geothermal Spa', category: 'relaxation', cost: '55', duration: 240, description: 'Soak in the iconic milky-blue geothermal pool surrounded by lava fields.' },
    { cityName: 'Reykjavik', name: 'Golden Circle Day Tour', category: 'sightseeing', cost: '70', duration: 600, description: 'Geysir, Gullfoss waterfall, and Þingvellir National Park in one day.' },
    { cityName: 'Reykjavik', name: 'Reykjavik Viking History Walk', category: 'culture', cost: '18', duration: 120, description: 'Guided walking tour through 1,100 years of Norse and Icelandic history.' },
  ].map(a => ({
    ...a,
    cityId: cityMap[a.cityName],
  })).filter(a => a.cityId); // drop any if city name doesn't match
}

// ─── Main Seed ──────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding GlobeTrotter database...\n');

  try {
    // 1. Admin user (upsert by email)
    console.log('👤  Seeding admin user...');
    const adminEmail = 'admin@globetrotter.app';
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@1234', 10);
      await db.insert(users).values({
        email:              adminEmail,
        passwordHash:       hashedPassword,
        firstName:          'Global',
        lastName:           'Admin',
        username:           'globetrotter_admin',
        role:               'admin',
        isVerified:         true,
        languagePreference: 'en',
      });
      console.log('   ✅ Admin user created.');
      console.log('   📧 Email:    admin@globetrotter.app');
      console.log('   🔑 Password: Admin@1234\n');
    } else {
      console.log('   ℹ️  Admin user already exists — skipped.\n');
    }

    // 2. Cities (upsert by name + country)
    console.log('🏙️  Seeding cities...');
    const insertedCities = [];

    for (const c of CITIES_DATA) {
      const existing = await db
        .select()
        .from(cities)
        .where(eq(cities.name, c.name))
        .limit(1);

      if (existing.length === 0) {
        const [created] = await db.insert(cities).values(c).returning();
        insertedCities.push(created);
      } else {
        insertedCities.push(existing[0]);
      }
    }

    console.log(`   ✅ ${insertedCities.length} cities ready.\n`);

    // Build a name → id map for activity linking
    const cityMap = {};
    for (const c of insertedCities) {
      cityMap[c.name] = c.id;
    }

    // 3. Activities (upsert by name + cityId)
    console.log('🎯  Seeding activities...');
    const activityRows = buildActivities(cityMap);
    let activityCount = 0;

    for (const a of activityRows) {
      const existing = await db
        .select()
        .from(activities)
        .where(eq(activities.name, a.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(activities).values({
          cityId:                   a.cityId,
          name:                     a.name,
          description:              a.description || null,
          category:                 a.category,
          estimatedCost:            a.cost,
          estimatedDurationMinutes: a.duration,
        });
        activityCount++;
      }
    }

    console.log(`   ✅ ${activityCount} activities seeded (${activityRows.length - activityCount} already existed).\n`);

    console.log('🎉  Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
}

seed();
