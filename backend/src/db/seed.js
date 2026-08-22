const { db } = require('../config/db');
const { users, cities, activities } = require('./schema');
const bcrypt = require('bcryptjs');
const { eq } = require('drizzle-orm');

// ─── Seed Data (India) ──────────────────────────────────────────────────────

const CITIES_DATA = [
  // North India
  { name: 'New Delhi', country: 'India', region: 'North India', costIndex: '24.00', popularityScore: 97 },
  { name: 'Jaipur', country: 'India', region: 'North India', costIndex: '16.00', popularityScore: 93 },
  { name: 'Udaipur', country: 'India', region: 'North India', costIndex: '20.00', popularityScore: 90 },
  { name: 'Jodhpur', country: 'India', region: 'North India', costIndex: '15.00', popularityScore: 82 },
  { name: 'Agra', country: 'India', region: 'North India', costIndex: '14.00', popularityScore: 91 },
  { name: 'Varanasi', country: 'India', region: 'North India', costIndex: '12.00', popularityScore: 85 },
  { name: 'Lucknow', country: 'India', region: 'North India', costIndex: '13.00', popularityScore: 70 },
  { name: 'Shimla', country: 'India', region: 'North India', costIndex: '18.00', popularityScore: 85 },
  { name: 'Manali', country: 'India', region: 'North India', costIndex: '17.00', popularityScore: 88 },
  { name: 'Leh', country: 'India', region: 'North India', costIndex: '20.00', popularityScore: 86 },
  { name: 'Rishikesh', country: 'India', region: 'North India', costIndex: '13.00', popularityScore: 81 },
  { name: 'Nainital', country: 'India', region: 'North India', costIndex: '14.00', popularityScore: 72 },
  { name: 'Amritsar', country: 'India', region: 'North India', costIndex: '14.00', popularityScore: 84 },
  // West India
  { name: 'Mumbai', country: 'India', region: 'West India', costIndex: '30.00', popularityScore: 96 },
  { name: 'Pune', country: 'India', region: 'West India', costIndex: '24.00', popularityScore: 76 },
  { name: 'Goa', country: 'India', region: 'West India', costIndex: '22.00', popularityScore: 94 },
  { name: 'Ahmedabad', country: 'India', region: 'West India', costIndex: '16.00', popularityScore: 71 },
  // South India
  { name: 'Bengaluru', country: 'India', region: 'South India', costIndex: '26.00', popularityScore: 88 },
  { name: 'Mysuru', country: 'India', region: 'South India', costIndex: '15.00', popularityScore: 78 },
  { name: 'Hampi', country: 'India', region: 'South India', costIndex: '10.00', popularityScore: 75 },
  { name: 'Kochi', country: 'India', region: 'South India', costIndex: '18.00', popularityScore: 87 },
  { name: 'Munnar', country: 'India', region: 'South India', costIndex: '16.00', popularityScore: 80 },
  { name: 'Alleppey', country: 'India', region: 'South India', costIndex: '17.00', popularityScore: 83 },
  { name: 'Chennai', country: 'India', region: 'South India', costIndex: '20.00', popularityScore: 82 },
  { name: 'Ooty', country: 'India', region: 'South India', costIndex: '14.00', popularityScore: 77 },
  { name: 'Madurai', country: 'India', region: 'South India', costIndex: '12.00', popularityScore: 74 },
  { name: 'Hyderabad', country: 'India', region: 'South India', costIndex: '21.00', popularityScore: 86 },
  // East India
  { name: 'Kolkata', country: 'India', region: 'East India', costIndex: '17.00', popularityScore: 84 },
  { name: 'Darjeeling', country: 'India', region: 'East India', costIndex: '15.00', popularityScore: 79 },
  // Islands
  { name: 'Port Blair', country: 'India', region: 'Andaman & Nicobar Islands', costIndex: '25.00', popularityScore: 78 },
];

// Activities per city (5-8 per city, all categories covered; hotels/stays filed under "other")
function buildActivities(cityMap) {
  return [
    // ── New Delhi ──────────────────────────────────────────────────────────
    { cityName: 'New Delhi', name: 'Red Fort & Chandni Chowk Walk', category: 'sightseeing', cost: '0', duration: 150, description: 'Mughal-era fort followed by the bustling lanes and street food of Old Delhi.' },
    { cityName: 'New Delhi', name: 'Humayun\'s Tomb & Qutub Minar', category: 'sightseeing', cost: '15', duration: 180, description: 'Two UNESCO World Heritage Mughal and Indo-Islamic monuments in one day.' },
    { cityName: 'New Delhi', name: 'Old Delhi Street Food Trail', category: 'food', cost: '18', duration: 150, description: 'Parathe Wali Gali, chaat, and jalebi in the heart of the old city.' },
    { cityName: 'New Delhi', name: 'Hauz Khas Village Nightlife', category: 'nightlife', cost: '35', duration: 240, description: 'Rooftop bars and lounges overlooking a 14th-century reservoir and deer park.' },
    { cityName: 'New Delhi', name: 'Akshardham Temple Visit', category: 'culture', cost: '5', duration: 150, description: 'Sprawling modern temple complex known for its intricate stone carvings.' },
    { cityName: 'New Delhi', name: 'The Imperial New Delhi', category: 'other', cost: '180', duration: 1440, description: 'Colonial-era luxury hotel on Janpath, near Connaught Place.' },
    // ── Jaipur ─────────────────────────────────────────────────────────────
    { cityName: 'Jaipur', name: 'Amber Fort & Elephant Ride', category: 'sightseeing', cost: '20', duration: 180, description: 'Hilltop Rajput fort with mirrored halls, best reached via jeep or elephant.' },
    { cityName: 'Jaipur', name: 'Hawa Mahal & City Palace', category: 'sightseeing', cost: '12', duration: 150, description: 'The iconic "Palace of Winds" and the royal City Palace museum.' },
    { cityName: 'Jaipur', name: 'Rajasthani Thali Dinner', category: 'food', cost: '15', duration: 90, description: 'Traditional unlimited thali with dal baati churma at a heritage haveli.' },
    { cityName: 'Jaipur', name: 'Jaipur Bazaar Shopping', category: 'culture', cost: '0', duration: 150, description: 'Johari and Bapu Bazaar for block-print textiles, gems, and juttis.' },
    { cityName: 'Jaipur', name: 'Hot Air Balloon Safari', category: 'adventure', cost: '150', duration: 90, description: 'Sunrise balloon ride over the Aravalli hills and Amber Fort.' },
    { cityName: 'Jaipur', name: 'Rambagh Palace', category: 'other', cost: '260', duration: 1440, description: 'Former residence of the Maharaja of Jaipur, now a Taj heritage hotel.' },
    // ── Udaipur ────────────────────────────────────────────────────────────
    { cityName: 'Udaipur', name: 'City Palace & Lake Pichola Boat Ride', category: 'sightseeing', cost: '18', duration: 150, description: 'Sunset boat ride past the Lake Palace and City Palace ghats.' },
    { cityName: 'Udaipur', name: 'Jagdish Temple & Old City Walk', category: 'culture', cost: '0', duration: 120, description: 'Intricately carved Indo-Aryan temple in the middle of the old town.' },
    { cityName: 'Udaipur', name: 'Rooftop Dinner with Lake View', category: 'food', cost: '25', duration: 120, description: 'Mewari cuisine served overlooking Lake Pichola at dusk.' },
    { cityName: 'Udaipur', name: 'Vintage Car Museum', category: 'culture', cost: '8', duration: 60, description: 'Royal collection of restored vintage cars once owned by the Mewar family.' },
    { cityName: 'Udaipur', name: 'Taj Lake Palace', category: 'other', cost: '320', duration: 1440, description: 'Iconic white-marble palace hotel floating in the middle of Lake Pichola.' },
    // ── Jodhpur ────────────────────────────────────────────────────────────
    { cityName: 'Jodhpur', name: 'Mehrangarh Fort', category: 'sightseeing', cost: '15', duration: 150, description: 'One of India\'s largest forts, towering over the Blue City.' },
    { cityName: 'Jodhpur', name: 'Blue City Rooftop Café Hop', category: 'food', cost: '12', duration: 120, description: 'Cafes with views over Jodhpur\'s indigo-painted old town houses.' },
    { cityName: 'Jodhpur', name: 'Jaswant Thada & Clock Tower Market', category: 'sightseeing', cost: '3', duration: 120, description: 'Marble cenotaph followed by the lively Sardar Market bazaar.' },
    { cityName: 'Jodhpur', name: 'Desert Safari & Camel Ride', category: 'adventure', cost: '30', duration: 180, description: 'Sand dunes and camel trek on the outskirts of the Thar Desert.' },
    { cityName: 'Jodhpur', name: 'Umaid Bhawan Palace', category: 'other', cost: '350', duration: 1440, description: 'Art Deco royal palace hotel, part still home to the Jodhpur royal family.' },
    // ── Agra ───────────────────────────────────────────────────────────────
    { cityName: 'Agra', name: 'Taj Mahal Sunrise Visit', category: 'sightseeing', cost: '15', duration: 120, description: 'The iconic white-marble mausoleum, best seen at dawn to avoid crowds.' },
    { cityName: 'Agra', name: 'Agra Fort', category: 'sightseeing', cost: '10', duration: 120, description: 'Red sandstone Mughal fort overlooking the Yamuna and the Taj.' },
    { cityName: 'Agra', name: 'Fatehpur Sikri Day Trip', category: 'sightseeing', cost: '12', duration: 240, description: 'Abandoned Mughal capital city built by Emperor Akbar.' },
    { cityName: 'Agra', name: 'Mughlai Food Trail', category: 'food', cost: '14', duration: 90, description: 'Petha sweets and Mughlai curries in the lanes around Sadar Bazaar.' },
    { cityName: 'Agra', name: 'The Oberoi Amarvilas', category: 'other', cost: '300', duration: 1440, description: 'Luxury hotel with every room offering a direct view of the Taj Mahal.' },
    // ── Varanasi ───────────────────────────────────────────────────────────
    { cityName: 'Varanasi', name: 'Ganga Aarti at Dashashwamedh Ghat', category: 'culture', cost: '0', duration: 90, description: 'Nightly Hindu fire ritual performed on the banks of the Ganges.' },
    { cityName: 'Varanasi', name: 'Sunrise Boat Ride on the Ganges', category: 'sightseeing', cost: '10', duration: 90, description: 'Rowboat past the ghats as the city wakes and pilgrims bathe.' },
    { cityName: 'Varanasi', name: 'Kashi Vishwanath Temple', category: 'culture', cost: '0', duration: 90, description: 'One of the twelve Jyotirlinga shrines dedicated to Lord Shiva.' },
    { cityName: 'Varanasi', name: 'Banarasi Street Food Walk', category: 'food', cost: '10', duration: 120, description: 'Kachori sabzi, lassi, and Banarasi paan in the old city lanes.' },
    { cityName: 'Varanasi', name: 'Sarnath Day Trip', category: 'sightseeing', cost: '5', duration: 150, description: 'Site of Buddha\'s first sermon, a short drive from the ghats.' },
    // ── Lucknow ────────────────────────────────────────────────────────────
    { cityName: 'Lucknow', name: 'Bara Imambara & Bhool Bhulaiya', category: 'sightseeing', cost: '8', duration: 120, description: '18th-century monument famous for its labyrinth of narrow passages.' },
    { cityName: 'Lucknow', name: 'Tunday Kababi Food Trail', category: 'food', cost: '10', duration: 90, description: 'Legendary galouti kebabs and Awadhi biryani in Chowk market.' },
    { cityName: 'Lucknow', name: 'Rumi Darwaza & Chota Imambara', category: 'sightseeing', cost: '5', duration: 90, description: 'Ornate Awadhi gateway and mausoleum lit up beautifully at night.' },
    { cityName: 'Lucknow', name: 'Bazaar Chikankari Shopping', category: 'culture', cost: '0', duration: 120, description: 'Hazratganj market for hand-embroidered chikankari garments.' },
    // ── Shimla ─────────────────────────────────────────────────────────────
    { cityName: 'Shimla', name: 'The Ridge & Mall Road Walk', category: 'sightseeing', cost: '0', duration: 120, description: 'Colonial-era promenade with mountain views and old churches.' },
    { cityName: 'Shimla', name: 'Kalka-Shimla Toy Train', category: 'sightseeing', cost: '15', duration: 300, description: 'UNESCO-listed narrow-gauge railway winding through pine forests.' },
    { cityName: 'Shimla', name: 'Jakhoo Temple Hike', category: 'adventure', cost: '0', duration: 120, description: 'Short trek up to Shimla\'s highest point, home to a giant Hanuman statue.' },
    { cityName: 'Shimla', name: 'Himachali Dham Dinner', category: 'food', cost: '12', duration: 90, description: 'Traditional multi-course Himachali meal served on a leaf plate.' },
    { cityName: 'Shimla', name: 'Wildflower Hall', category: 'other', cost: '220', duration: 1440, description: 'Oberoi resort set in cedar forest, once the residence of Lord Kitchener.' },
    // ── Manali ─────────────────────────────────────────────────────────────
    { cityName: 'Manali', name: 'Solang Valley Adventure Sports', category: 'adventure', cost: '35', duration: 240, description: 'Paragliding, zorbing, and (in winter) skiing against a snow backdrop.' },
    { cityName: 'Manali', name: 'Rohtang Pass Day Trip', category: 'sightseeing', cost: '25', duration: 480, description: 'High-altitude mountain pass with snow, glaciers, and valley views.' },
    { cityName: 'Manali', name: 'Old Manali Café Hopping', category: 'food', cost: '10', duration: 150, description: 'Israeli and Tibetan-influenced cafes along the Manalsu river.' },
    { cityName: 'Manali', name: 'Hadimba Temple', category: 'culture', cost: '0', duration: 60, description: 'Ancient wooden cave temple set inside a cedar forest.' },
    { cityName: 'Manali', name: 'River Rafting on the Beas', category: 'adventure', cost: '20', duration: 90, description: 'Grade II-III white-water rafting through the Kullu valley.' },
    // ── Leh ────────────────────────────────────────────────────────────────
    { cityName: 'Leh', name: 'Pangong Lake Road Trip', category: 'sightseeing', cost: '40', duration: 720, description: 'High-altitude lake changing color through shades of blue, made famous on film.' },
    { cityName: 'Leh', name: 'Leh Palace & Old Town', category: 'sightseeing', cost: '5', duration: 90, description: 'Former royal palace modeled on the Potala Palace in Lhasa.' },
    { cityName: 'Leh', name: 'Khardung La Motorbike Ride', category: 'adventure', cost: '30', duration: 300, description: 'Ride one of the world\'s highest motorable mountain passes.' },
    { cityName: 'Leh', name: 'Ladakhi Kitchen Cooking Class', category: 'food', cost: '18', duration: 120, description: 'Learn to make thukpa and momos in a traditional Ladakhi home.' },
    { cityName: 'Leh', name: 'Hemis Monastery Visit', category: 'culture', cost: '5', duration: 120, description: 'Largest and wealthiest monastery in Ladakh, set in a quiet valley.' },
    // ── Rishikesh ──────────────────────────────────────────────────────────
    { cityName: 'Rishikesh', name: 'White Water Rafting on the Ganges', category: 'adventure', cost: '20', duration: 150, description: 'Grade III-IV rapids from Shivpuri down to Rishikesh.' },
    { cityName: 'Rishikesh', name: 'Ganga Aarti at Triveni Ghat', category: 'culture', cost: '0', duration: 60, description: 'Evening prayer ceremony with floating diyas along the riverbank.' },
    { cityName: 'Rishikesh', name: 'Yoga & Meditation Retreat Session', category: 'relaxation', cost: '15', duration: 120, description: 'Drop-in yoga class in the self-proclaimed "Yoga Capital of the World".' },
    { cityName: 'Rishikesh', name: 'Laxman Jhula & Café Walk', category: 'sightseeing', cost: '0', duration: 90, description: 'Iconic suspension bridge lined with cafes and shops on both banks.' },
    { cityName: 'Rishikesh', name: 'Bungee Jumping at Jumpin Heights', category: 'adventure', cost: '75', duration: 90, description: 'India\'s highest fixed-platform bungee jump, near Mohanchatti.' },
    // ── Nainital ───────────────────────────────────────────────────────────
    { cityName: 'Nainital', name: 'Naini Lake Boating', category: 'relaxation', cost: '8', duration: 60, description: 'Rowboat or paddleboat ride on the crescent-shaped Naini Lake.' },
    { cityName: 'Nainital', name: 'Naina Devi Temple', category: 'culture', cost: '0', duration: 60, description: 'Lakeside temple dedicated to the goddess Naina Devi.' },
    { cityName: 'Nainital', name: 'Snow View Point Cable Car', category: 'sightseeing', cost: '10', duration: 90, description: 'Ropeway ride offering views of the snow-capped Himalayan peaks.' },
    { cityName: 'Nainital', name: 'Mall Road Food Walk', category: 'food', cost: '8', duration: 90, description: 'Kumaoni snacks and bakery treats along the lakeside promenade.' },
    // ── Amritsar ───────────────────────────────────────────────────────────
    { cityName: 'Amritsar', name: 'Golden Temple & Langar', category: 'culture', cost: '0', duration: 150, description: 'Sikhism\'s holiest shrine; free community kitchen feeds thousands daily.' },
    { cityName: 'Amritsar', name: 'Wagah Border Retreat Ceremony', category: 'sightseeing', cost: '0', duration: 90, description: 'High-energy daily flag-lowering ceremony at the India-Pakistan border.' },
    { cityName: 'Amritsar', name: 'Amritsari Kulcha & Lassi Trail', category: 'food', cost: '10', duration: 90, description: 'Stuffed kulchas and thick lassi in the lanes near Town Hall.' },
    { cityName: 'Amritsar', name: 'Jallianwala Bagh', category: 'sightseeing', cost: '0', duration: 60, description: 'Historic memorial garden commemorating the 1919 massacre.' },
    // ── Mumbai ─────────────────────────────────────────────────────────────
    { cityName: 'Mumbai', name: 'Gateway of India & Elephanta Caves', category: 'sightseeing', cost: '15', duration: 240, description: 'Colonial-era arch monument plus a ferry to the ancient rock-cut caves.' },
    { cityName: 'Mumbai', name: 'Marine Drive Sunset Walk', category: 'relaxation', cost: '0', duration: 90, description: 'The "Queen\'s Necklace" promenade curving along the Arabian Sea.' },
    { cityName: 'Mumbai', name: 'Mumbai Street Food Tour', category: 'food', cost: '20', duration: 150, description: 'Vada pav, pav bhaji, and bhel puri across Girgaon and Mohammed Ali Road.' },
    { cityName: 'Mumbai', name: 'Bollywood Studio Tour', category: 'culture', cost: '35', duration: 180, description: 'Behind-the-scenes look at a working Hindi film studio.' },
    { cityName: 'Mumbai', name: 'Bandra-Worli Sea Link Nightlife', category: 'nightlife', cost: '45', duration: 240, description: 'Rooftop bars in Bandra and Lower Parel with skyline views.' },
    { cityName: 'Mumbai', name: 'Taj Mahal Palace Mumbai', category: 'other', cost: '280', duration: 1440, description: 'Historic waterfront palace hotel next to the Gateway of India.' },
    // ── Pune ───────────────────────────────────────────────────────────────
    { cityName: 'Pune', name: 'Shaniwar Wada Fort', category: 'sightseeing', cost: '5', duration: 90, description: 'Historic fortified palace, former seat of the Peshwa rulers.' },
    { cityName: 'Pune', name: 'Sinhagad Fort Trek', category: 'adventure', cost: '5', duration: 240, description: 'Popular half-day hill fort trek on the outskirts of the city.' },
    { cityName: 'Pune', name: 'Misal Pav Trail', category: 'food', cost: '8', duration: 90, description: 'Spicy Maharashtrian breakfast dish, a Pune institution.' },
    { cityName: 'Pune', name: 'Osho Ashram & Koregaon Park', category: 'culture', cost: '5', duration: 120, description: 'Meditation resort and the leafy, cafe-lined Koregaon Park area.' },
    // ── Goa ────────────────────────────────────────────────────────────────
    { cityName: 'Goa', name: 'Baga & Calangute Beach Day', category: 'relaxation', cost: '0', duration: 240, description: 'North Goa\'s liveliest stretch of sand, shacks, and water sports.' },
    { cityName: 'Goa', name: 'Old Goa Churches Heritage Walk', category: 'culture', cost: '5', duration: 120, description: 'UNESCO-listed Basilica of Bom Jesus and Se Cathedral.' },
    { cityName: 'Goa', name: 'Goan Seafood Shack Dinner', category: 'food', cost: '18', duration: 120, description: 'Fresh catch and fish curry rice at a beachside shack in Anjuna.' },
    { cityName: 'Goa', name: 'Anjuna Flea Market & Nightlife', category: 'nightlife', cost: '30', duration: 300, description: 'Wednesday flea market followed by beach clubs and trance parties.' },
    { cityName: 'Goa', name: 'Scuba Diving at Grande Island', category: 'adventure', cost: '55', duration: 180, description: 'Introductory scuba dive among coral reefs off the Goan coast.' },
    { cityName: 'Goa', name: 'Taj Exotica Resort & Spa', category: 'other', cost: '240', duration: 1440, description: 'Beachfront luxury resort on Benaulim Beach in South Goa.' },
    // ── Ahmedabad ──────────────────────────────────────────────────────────
    { cityName: 'Ahmedabad', name: 'Sabarmati Ashram', category: 'culture', cost: '0', duration: 90, description: 'Mahatma Gandhi\'s former residence on the banks of the Sabarmati river.' },
    { cityName: 'Ahmedabad', name: 'Old City Heritage Walk', category: 'sightseeing', cost: '5', duration: 150, description: 'Pols, havelis, and stepwells through UNESCO-listed Ahmedabad.' },
    { cityName: 'Ahmedabad', name: 'Manek Chowk Night Food Market', category: 'food', cost: '10', duration: 120, description: 'Gujarati street food market that turns into a dessert hub after dark.' },
    { cityName: 'Ahmedabad', name: 'Adalaj Stepwell', category: 'sightseeing', cost: '3', duration: 60, description: 'Intricately carved five-storey stepwell on the outskirts of the city.' },
    // ── Bengaluru ──────────────────────────────────────────────────────────
    { cityName: 'Bengaluru', name: 'Lalbagh Botanical Garden', category: 'relaxation', cost: '2', duration: 90, description: '240-acre garden built around a glasshouse modeled on Crystal Palace.' },
    { cityName: 'Bengaluru', name: 'Bengaluru Palace', category: 'sightseeing', cost: '8', duration: 90, description: 'Tudor-style palace inspired by England\'s Windsor Castle.' },
    { cityName: 'Bengaluru', name: 'Craft Beer & Microbrewery Trail', category: 'nightlife', cost: '25', duration: 180, description: 'India\'s microbrewery capital — Indiranagar and Koramangala taprooms.' },
    { cityName: 'Bengaluru', name: 'South Indian Filter Coffee & Dosa Trail', category: 'food', cost: '10', duration: 90, description: 'Classic Udupi-style darshinis serving dosa, idli, and filter coffee.' },
    { cityName: 'Bengaluru', name: 'Nandi Hills Sunrise Trip', category: 'adventure', cost: '10', duration: 240, description: 'Early-morning drive to a hilltop fortress for sunrise views.' },
    // ── Mysuru ─────────────────────────────────────────────────────────────
    { cityName: 'Mysuru', name: 'Mysore Palace Illumination', category: 'sightseeing', cost: '10', duration: 120, description: 'Indo-Saracenic royal palace lit up with 100,000 bulbs on weekends.' },
    { cityName: 'Mysuru', name: 'Chamundi Hill Temple', category: 'culture', cost: '0', duration: 90, description: 'Hilltop temple with panoramic views over the city.' },
    { cityName: 'Mysuru', name: 'Mysore Pak & Devaraja Market', category: 'food', cost: '6', duration: 90, description: 'Try the city\'s famous sweet and browse the century-old market.' },
    { cityName: 'Mysuru', name: 'Yoga Retreat Session', category: 'relaxation', cost: '12', duration: 90, description: 'Traditional Ashtanga yoga class in the birthplace of the practice.' },
    // ── Hampi ──────────────────────────────────────────────────────────────
    { cityName: 'Hampi', name: 'Virupaksha Temple & Bazaar', category: 'culture', cost: '2', duration: 120, description: 'Functioning 7th-century temple at the heart of the ruined Vijayanagara empire.' },
    { cityName: 'Hampi', name: 'Boulder Sunset Point Trek', category: 'adventure', cost: '0', duration: 120, description: 'Short scramble up granite boulders for a sweeping sunset over the ruins.' },
    { cityName: 'Hampi', name: 'Coracle Ride on Tungabhadra River', category: 'relaxation', cost: '5', duration: 60, description: 'Traditional round boat ride between Hampi Bazaar and Virupapur Gaddi.' },
    { cityName: 'Hampi', name: 'Vittala Temple Complex', category: 'sightseeing', cost: '5', duration: 120, description: 'Famous for its stone chariot and musical pillars.' },
    // ── Kochi ──────────────────────────────────────────────────────────────
    { cityName: 'Kochi', name: 'Fort Kochi Heritage Walk', category: 'sightseeing', cost: '0', duration: 150, description: 'Chinese fishing nets, Dutch cemetery, and colonial-era streets.' },
    { cityName: 'Kochi', name: 'Kathakali Dance Performance', category: 'culture', cost: '12', duration: 90, description: 'Traditional Keralan dance-drama with elaborate makeup and costume.' },
    { cityName: 'Kochi', name: 'Kerala Backwater Houseboat Stay', category: 'relaxation', cost: '90', duration: 1440, description: 'Overnight stay aboard a traditional kettuvallam houseboat.' },
    { cityName: 'Kochi', name: 'Malabar Seafood Trail', category: 'food', cost: '15', duration: 90, description: 'Karimeen pollichathu and prawn curry along the Fort Kochi waterfront.' },
    { cityName: 'Kochi', name: 'Brunton Boatyard', category: 'other', cost: '150', duration: 1440, description: 'Heritage waterfront hotel built on the site of a 19th-century boatyard.' },
    // ── Munnar ─────────────────────────────────────────────────────────────
    { cityName: 'Munnar', name: 'Tea Plantation Trek', category: 'adventure', cost: '10', duration: 180, description: 'Walk through rolling emerald tea estates in the Western Ghats.' },
    { cityName: 'Munnar', name: 'Eravikulam National Park', category: 'sightseeing', cost: '8', duration: 150, description: 'Home to the endangered Nilgiri tahr and rolling grassland hills.' },
    { cityName: 'Munnar', name: 'Tea Museum & Tasting', category: 'culture', cost: '5', duration: 60, description: 'Learn how Munnar\'s famous tea is processed, with a tasting session.' },
    { cityName: 'Munnar', name: 'Spice Plantation Tour', category: 'food', cost: '12', duration: 120, description: 'Guided walk through cardamom, pepper, and clove plantations.' },
    // ── Alleppey ───────────────────────────────────────────────────────────
    { cityName: 'Alleppey', name: 'Backwater Houseboat Cruise', category: 'relaxation', cost: '100', duration: 1440, description: 'Overnight cruise through Kerala\'s famous palm-fringed backwaters.' },
    { cityName: 'Alleppey', name: 'Alleppey Beach Sunset', category: 'sightseeing', cost: '0', duration: 60, description: 'Pier-side sunset views on the Arabian Sea coast.' },
    { cityName: 'Alleppey', name: 'Village Canoe Tour', category: 'adventure', cost: '15', duration: 150, description: 'Paddle through narrow backwater canals past village life.' },
    // ── Chennai ────────────────────────────────────────────────────────────
    { cityName: 'Chennai', name: 'Marina Beach Walk', category: 'relaxation', cost: '0', duration: 90, description: 'One of the world\'s longest urban beaches, popular at sunrise.' },
    { cityName: 'Chennai', name: 'Kapaleeshwarar Temple', category: 'culture', cost: '0', duration: 90, description: 'Dravidian-style temple with a towering, colorfully carved gopuram.' },
    { cityName: 'Chennai', name: 'Filter Coffee & Tiffin Trail', category: 'food', cost: '8', duration: 90, description: 'Classic Chennai breakfast: idli, sambar, and strong filter coffee.' },
    { cityName: 'Chennai', name: 'Mahabalipuram Day Trip', category: 'sightseeing', cost: '20', duration: 300, description: 'UNESCO shore temples and rock-cut cave sculptures near the coast.' },
    // ── Ooty ───────────────────────────────────────────────────────────────
    { cityName: 'Ooty', name: 'Nilgiri Mountain Railway', category: 'sightseeing', cost: '12', duration: 300, description: 'UNESCO-listed toy train winding through tea gardens and tunnels.' },
    { cityName: 'Ooty', name: 'Ooty Botanical Garden', category: 'relaxation', cost: '3', duration: 90, description: 'Terraced gardens laid out in 1848 on the slopes of Doddabetta.' },
    { cityName: 'Ooty', name: 'Doddabetta Peak Viewpoint', category: 'sightseeing', cost: '5', duration: 90, description: 'Highest point in the Nilgiris with panoramic tea-estate views.' },
    { cityName: 'Ooty', name: 'Homemade Chocolate & Tea Tasting', category: 'food', cost: '8', duration: 60, description: 'Local specialty — Ooty chocolate paired with fresh Nilgiri tea.' },
    // ── Madurai ────────────────────────────────────────────────────────────
    { cityName: 'Madurai', name: 'Meenakshi Amman Temple', category: 'culture', cost: '0', duration: 150, description: 'Massive temple complex with 14 ornately sculpted gopuram towers.' },
    { cityName: 'Madurai', name: 'Madurai Night Food Trail', category: 'food', cost: '8', duration: 90, description: 'Jigarthanda and Kari dosa at the stalls near the temple.' },
    { cityName: 'Madurai', name: 'Thirumalai Nayakkar Mahal', category: 'sightseeing', cost: '3', duration: 60, description: '17th-century Indo-Saracenic palace with towering pillared courtyards.' },
    // ── Hyderabad ──────────────────────────────────────────────────────────
    { cityName: 'Hyderabad', name: 'Charminar & Laad Bazaar', category: 'sightseeing', cost: '0', duration: 150, description: '16th-century monument surrounded by the famous bangle market.' },
    { cityName: 'Hyderabad', name: 'Golconda Fort Sound & Light Show', category: 'sightseeing', cost: '10', duration: 120, description: 'Evening show narrating the fort\'s history amid its ruins.' },
    { cityName: 'Hyderabad', name: 'Hyderabadi Biryani Trail', category: 'food', cost: '12', duration: 90, description: 'Dum-cooked biryani at the city\'s legendary Irani cafes.' },
    { cityName: 'Hyderabad', name: 'Ramoji Film City', category: 'culture', cost: '35', duration: 480, description: 'One of the world\'s largest film studio complexes, open for tours.' },
    { cityName: 'Hyderabad', name: 'Taj Falaknuma Palace', category: 'other', cost: '300', duration: 1440, description: 'Former Nizam\'s palace perched on a hill overlooking the old city.' },
    // ── Kolkata ────────────────────────────────────────────────────────────
    { cityName: 'Kolkata', name: 'Victoria Memorial', category: 'sightseeing', cost: '5', duration: 120, description: 'Grand white-marble monument set in manicured gardens.' },
    { cityName: 'Kolkata', name: 'Howrah Bridge & Flower Market', category: 'sightseeing', cost: '0', duration: 90, description: 'Iconic cantilever bridge beside Asia\'s largest flower market.' },
    { cityName: 'Kolkata', name: 'Bengali Sweets & Street Food Trail', category: 'food', cost: '10', duration: 120, description: 'Rosogolla, puchka, and kathi rolls across College Street and Park Street.' },
    { cityName: 'Kolkata', name: 'Park Street Nightlife', category: 'nightlife', cost: '30', duration: 240, description: 'Historic entertainment strip with jazz bars and old-school clubs.' },
    { cityName: 'Kolkata', name: 'Dakshineswar Kali Temple', category: 'culture', cost: '0', duration: 90, description: 'Riverside temple made famous by the saint Ramakrishna.' },
    // ── Darjeeling ─────────────────────────────────────────────────────────
    { cityName: 'Darjeeling', name: 'Tiger Hill Sunrise over Kanchenjunga', category: 'sightseeing', cost: '10', duration: 180, description: 'Pre-dawn drive for views of the world\'s third-highest peak.' },
    { cityName: 'Darjeeling', name: 'Darjeeling Himalayan Railway', category: 'sightseeing', cost: '15', duration: 120, description: 'UNESCO-listed "Toy Train" looping through tea gardens.' },
    { cityName: 'Darjeeling', name: 'Tea Estate Tour & Tasting', category: 'food', cost: '10', duration: 120, description: 'Walk a working tea garden and sample first-flush Darjeeling tea.' },
    { cityName: 'Darjeeling', name: 'Himalayan Mountaineering Institute', category: 'culture', cost: '5', duration: 90, description: 'Museum tracing India\'s Everest and Himalayan expedition history.' },
    // ── Port Blair ─────────────────────────────────────────────────────────
    { cityName: 'Port Blair', name: 'Cellular Jail Light & Sound Show', category: 'culture', cost: '5', duration: 90, description: 'Colonial-era prison with an evening show on India\'s freedom struggle.' },
    { cityName: 'Port Blair', name: 'Radhanagar Beach', category: 'relaxation', cost: '0', duration: 240, description: 'Havelock Island beach once rated among Asia\'s best.' },
    { cityName: 'Port Blair', name: 'Scuba Diving at Havelock', category: 'adventure', cost: '65', duration: 180, description: 'Coral reef diving in the Andaman Sea, beginner-friendly.' },
    { cityName: 'Port Blair', name: 'Seafood Shack Dinner', category: 'food', cost: '16', duration: 90, description: 'Fresh-caught fish and crab curry near the harbor.' },
  ].map(a => ({
    ...a,
    cityId: cityMap[a.cityName],
  })).filter(a => a.cityId); // drop any if city name doesn't match
}

// Additional genuine-looking users (beyond the admin)
const USERS_DATA = [
  { firstName: 'Arjun', lastName: 'Mehta', username: 'arjun.mehta', email: 'arjun.mehta@gmail.com', phoneNumber: '+91 98200 11234', city: 'Mumbai', country: 'India', languagePreference: 'en' },
  { firstName: 'Priya', lastName: 'Nair', username: 'priya.nair', email: 'priya.nair@gmail.com', phoneNumber: '+91 90080 22345', city: 'Kochi', country: 'India', languagePreference: 'en' },
  { firstName: 'Rohan', lastName: 'Kapoor', username: 'rohan.kapoor', email: 'rohan.kapoor@yahoo.com', phoneNumber: '+91 98110 33456', city: 'New Delhi', country: 'India', languagePreference: 'en' },
  { firstName: 'Sneha', lastName: 'Iyer', username: 'sneha.iyer', email: 'sneha.iyer@gmail.com', phoneNumber: '+91 90360 44567', city: 'Chennai', country: 'India', languagePreference: 'en' },
  { firstName: 'Aditya', lastName: 'Sharma', username: 'aditya.sharma', email: 'aditya.sharma@outlook.com', phoneNumber: '+91 99870 55678', city: 'Jaipur', country: 'India', languagePreference: 'hi' },
  { firstName: 'Kavya', lastName: 'Reddy', username: 'kavya.reddy', email: 'kavya.reddy@gmail.com', phoneNumber: '+91 91000 66789', city: 'Hyderabad', country: 'India', languagePreference: 'en' },
  { firstName: 'Vikram', lastName: 'Singh', username: 'vikram.singh', email: 'vikram.singh@gmail.com', phoneNumber: '+91 98140 77890', city: 'Amritsar', country: 'India', languagePreference: 'hi' },
  { firstName: 'Anjali', lastName: 'Gupta', username: 'anjali.gupta', email: 'anjali.gupta@yahoo.com', phoneNumber: '+91 98290 88901', city: 'Ahmedabad', country: 'India', languagePreference: 'en' },
  { firstName: 'Rahul', lastName: 'Verma', username: 'rahul.verma', email: 'rahul.verma@gmail.com', phoneNumber: '+91 99998 99012', city: 'Lucknow', country: 'India', languagePreference: 'hi' },
  { firstName: 'Neha', lastName: 'Joshi', username: 'neha.joshi', email: 'neha.joshi@gmail.com', phoneNumber: '+91 90210 10123', city: 'Pune', country: 'India', languagePreference: 'en' },
  { firstName: 'Karthik', lastName: 'Pillai', username: 'karthik.pillai', email: 'karthik.pillai@gmail.com', phoneNumber: '+91 94440 21234', city: 'Bengaluru', country: 'India', languagePreference: 'en' },
  { firstName: 'Divya', lastName: 'Menon', username: 'divya.menon', email: 'divya.menon@outlook.com', phoneNumber: '+91 94470 32345', city: 'Kolkata', country: 'India', languagePreference: 'en' },
];

// ─── Main Seed ──────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding GlobeTrotter database (India edition)...\n');

  try {
    // 1. Admin user (upsert by email)
    console.log('👤  Seeding admin user...');
    const adminEmail = 'admin@globetrotter.app';
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@1234', 10);
      await db.insert(users).values({
        email: adminEmail,
        passwordHash: hashedPassword,
        firstName: 'Global',
        lastName: 'Admin',
        username: 'globetrotter_admin',
        city: 'New Delhi',
        country: 'India',
        role: 'admin',
        isVerified: true,
        languagePreference: 'en',
      });
      console.log('   ✅ Admin user created.');
      console.log('   📧 Email:    admin@globetrotter.app');
      console.log('   🔑 Password: Admin@1234\n');
    } else {
      console.log('   ℹ️  Admin user already exists — skipped.\n');
    }

    // 2. Regular users (upsert by email)
    console.log('👥  Seeding regular users...');
    let userCount = 0;

    for (const u of USERS_DATA) {
      const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);

      if (existing.length === 0) {
        const hashedPassword = await bcrypt.hash('Traveler@123', 10);
        await db.insert(users).values({
          email: u.email,
          passwordHash: hashedPassword,
          firstName: u.firstName,
          lastName: u.lastName,
          username: u.username,
          phoneNumber: u.phoneNumber,
          city: u.city,
          country: u.country,
          languagePreference: u.languagePreference,
          role: 'user',
          isVerified: true,
        });
        userCount++;
      }
    }

    console.log(`   ✅ ${userCount} users seeded (${USERS_DATA.length - userCount} already existed).\n`);

    // 3. Cities (upsert by name)
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

    // 4. Activities (upsert by name)
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
          cityId: a.cityId,
          name: a.name,
          description: a.description || null,
          category: a.category,
          estimatedCost: a.cost,
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