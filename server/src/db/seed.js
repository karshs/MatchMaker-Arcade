// Seed script — inserts 100 realistic Indian matrimonial profiles into Neon DB
// Run with: npm run seed
// Safe to re-run — clears existing seed data first

process.env.NODE_NO_WARNINGS = '1';
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── Data Pools ─────────────────────────────────────────────────────────────────

const MALE_NAMES = [
  'Arjun','Rahul','Vikram','Amit','Rohan','Sanjay','Karan','Nikhil',
  'Aditya','Suresh','Ravi','Deepak','Manish','Vikas','Gaurav',
  'Prateek','Sachin','Mohit','Vishal','Ankit','Rajesh','Akash',
  'Sunny','Harsh','Dev','Vivek','Dhruv','Siddharth','Aakash','Yash',
  'Kunal','Ishaan','Parth','Kabir','Aarav','Rishi','Sameer','Tarun',
  'Puneet','Abhinav','Mayank','Piyush','Neeraj','Lalit','Shivam',
  'Akhil','Tushar','Ajay','Sourabh','Naveen',
];

const FEMALE_NAMES = [
  'Priya','Anjali','Neha','Pooja','Sneha','Kavita','Nisha','Swati',
  'Divya','Rishika','Meera','Sonia','Ritika','Pallavi','Shweta',
  'Ananya','Kritika','Simran','Tanvi','Shreya','Aditi','Ritu',
  'Mansi','Preeti','Komal','Deepika','Megha','Shalini','Sapna','Nikita',
  'Isha','Aishwarya','Tanya','Varsha','Charu','Nandini','Radhika',
  'Sunita','Lakshmi','Anjana','Padma','Lavanya','Rashmi','Jyoti',
  'Kaveri','Rupal','Mitali','Bhavna','Seema','Archana',
];

// Religion-specific data pools for realism
const RELIGION_DATA = {
  Hindu: {
    lastNames: ['Sharma','Patel','Singh','Mehta','Verma','Gupta','Shah','Joshi',
      'Kumar','Reddy','Nair','Iyer','Pillai','Rao','Pandey','Mishra',
      'Trivedi','Desai','Malhotra','Kapoor'],
    castes: ['Brahmin','Kshatriya','Vaishya','Maratha','Jat','Patel','Rajput','Nair','Reddy','Iyer'],
    motherTongues: ['Hindi','Gujarati','Marathi','Tamil','Telugu','Kannada','Malayalam','Bengali','Punjabi'],
    languageSets: [
      ['Hindi','English'],['Gujarati','Hindi','English'],['Marathi','Hindi','English'],
      ['Tamil','English'],['Telugu','English'],['Kannada','English','Hindi'],
      ['Malayalam','English'],['Bengali','Hindi','English'],['Punjabi','Hindi','English'],
    ],
  },
  Muslim: {
    lastNames: ['Khan','Ali','Ahmed','Hussain','Siddiqui','Shaikh','Ansari','Qureshi','Mirza','Malik'],
    castes: ['Syed','Sheikh','Pathan','Mughal','Ansari'],
    motherTongues: ['Urdu','Hindi'],
    languageSets: [['Urdu','Hindi','English'],['Urdu','English'],['Hindi','English']],
  },
  Christian: {
    lastNames: ["D'Souza",'Fernandes','Rodrigues','Thomas','George','Joseph','Mathew','Jacob'],
    castes: ['Roman Catholic','Protestant','Syrian Christian'],
    motherTongues: ['English','Malayalam','Tamil'],
    languageSets: [['English','Malayalam'],['English','Tamil'],['English']],
  },
  Sikh: {
    lastNames: ['Singh','Kaur','Gill','Dhillon','Bhatia','Sandhu','Grewal','Sidhu'],
    castes: ['Jat Sikh','Khatri','Arora','Ramgarhia'],
    motherTongues: ['Punjabi'],
    languageSets: [['Punjabi','Hindi','English']],
  },
  Jain: {
    lastNames: ['Shah','Jain','Mehta','Sethi','Kothari','Bafna','Doshi','Sanghvi'],
    castes: ['Digambar','Shwetambar','Oswal','Porwal'],
    motherTongues: ['Gujarati','Rajasthani'],
    languageSets: [['Gujarati','Hindi','English'],['Rajasthani','Hindi','English']],
  },
};

const CITIES = [
  { city:'Mumbai', state:'Maharashtra' },{ city:'Mumbai', state:'Maharashtra' },
  { city:'Mumbai', state:'Maharashtra' },{ city:'Delhi', state:'Delhi' },
  { city:'Delhi', state:'Delhi' },{ city:'Delhi', state:'Delhi' },
  { city:'Bangalore', state:'Karnataka' },{ city:'Bangalore', state:'Karnataka' },
  { city:'Bangalore', state:'Karnataka' },{ city:'Ahmedabad', state:'Gujarat' },
  { city:'Ahmedabad', state:'Gujarat' },{ city:'Pune', state:'Maharashtra' },
  { city:'Pune', state:'Maharashtra' },{ city:'Hyderabad', state:'Telangana' },
  { city:'Hyderabad', state:'Telangana' },{ city:'Chennai', state:'Tamil Nadu' },
  { city:'Chennai', state:'Tamil Nadu' },{ city:'Kolkata', state:'West Bengal' },
  { city:'Kolkata', state:'West Bengal' },{ city:'Jaipur', state:'Rajasthan' },
];

const OCCUPATIONS = [
  { title:'Software Engineer', range:[10,35], sector:'Private' },
  { title:'Senior Software Engineer', range:[20,50], sector:'Private' },
  { title:'Product Manager', range:[18,45], sector:'Private' },
  { title:'Doctor (MBBS)', range:[12,40], sector:'Private' },
  { title:'Chartered Accountant', range:[10,30], sector:'Business' },
  { title:'MBA Manager', range:[12,35], sector:'Private' },
  { title:'Teacher', range:[5,12], sector:'Government' },
  { title:'Entrepreneur', range:[10,60], sector:'Business' },
  { title:'Lawyer', range:[8,30], sector:'Business' },
  { title:'Architect', range:[8,25], sector:'Private' },
  { title:'Government Officer', range:[6,15], sector:'Government' },
  { title:'Nurse', range:[4,10], sector:'Private' },
  { title:'Data Scientist', range:[15,40], sector:'Private' },
  { title:'Financial Analyst', range:[8,25], sector:'Private' },
  { title:'Pharmacist', range:[5,15], sector:'Private' },
];

const EDUCATION = ['B.Tech','B.E.','MBBS','MBA','CA','B.Sc','M.Tech','B.Com','M.Sc','BBA','LLB','B.Arch'];

const COMPANIES = [
  'Infosys','TCS','Wipro','HCL Technologies','Tech Mahindra','Reliance Industries',
  'HDFC Bank','ICICI Bank','Bajaj Finance','Amazon India','Google India',
  'Microsoft India','Flipkart','Deloitte','KPMG','Apollo Hospitals',
  'L&T','Godrej Industries','Tata Consultancy','Zomato','PhonePe',
];

const COLLEGES = [
  'IIT Bombay','IIT Delhi','IIT Madras','NIT Trichy','BITS Pilani',
  'Delhi University','Mumbai University','Pune University','Anna University',
  'AIIMS Delhi','Manipal University','VIT Vellore','SP Jain Institute',
  'IIM Ahmedabad','IIM Bangalore','Osmania University',
];

const INTERESTS = [
  'Travel','Music','Cricket','Reading','Cooking','Yoga','Gym',
  'Photography','Movies','Dancing','Gaming','Painting','Trekking',
  'Swimming','Badminton','Chess','Meditation','Cycling',
];

const JOURNEY_DIST = [
  'Profile Verified','Profile Verified','Profile Verified','Profile Verified',
  'Searching','Searching','Searching','Searching','Searching','Searching',
  'Searching','Searching','Searching','Searching','Searching',
  'Matches Shared','Matches Shared','Matches Shared','Matches Shared',
  'Matches Shared','Matches Shared','Matches Shared',
  'Interested','Interested','Interested','Interested',
  'Call Scheduled','Call Scheduled','Call Scheduled',
  'Meeting Scheduled','Meeting Scheduled',
  'Successful Match','Successful Match',
  'Paused','Paused',
  'Inactive','Inactive',
];

const RELIGION_DIST = [
  'Hindu','Hindu','Hindu','Hindu','Hindu','Hindu','Hindu','Hindu','Hindu','Hindu',
  'Hindu','Hindu','Hindu','Hindu','Hindu','Muslim','Muslim','Muslim',
  'Christian','Christian','Sikh','Sikh','Jain','Jain',
];

// ── Helpers ────────────────────────────────────────────────────────────────────

// Deterministic pseudo-random based on a seed (same input = same output)
function sr(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function pick(arr, seed) { return arr[Math.floor(sr(seed) * arr.length)]; }

function pickN(arr, n, seed) {
  const copy = [...arr];
  const result = [];
  for (let j = 0; j < n && copy.length; j++) {
    const idx = Math.floor(sr(seed + j) * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function randInt(min, max, seed) { return Math.floor(sr(seed) * (max - min + 1)) + min; }

// ── Profile Generator ──────────────────────────────────────────────────────────

function generateProfile(index) {
  const s = index * 137; // prime multiplier spreads values across the range
  const isMale = index < 50;

  const firstName = isMale
    ? MALE_NAMES[index % MALE_NAMES.length]
    : FEMALE_NAMES[(index - 50) % FEMALE_NAMES.length];

  // Ensure first 5 profiles use the majority religion (Hindu) to maximize pool
  const religion = index < 5 ? 'Hindu' : pick(RELIGION_DIST, s + 1);
  const rd = RELIGION_DATA[religion];
  const lastName = pick(rd.lastNames, s + 2);
  const caste = pick(rd.castes, s + 3);
  const motherTongue = pick(rd.motherTongues, s + 4);
  const languages = pick(rd.languageSets, s + 5);

  const location = CITIES[index % CITIES.length];
  const occ = OCCUPATIONS[index % OCCUPATIONS.length];
  const income = randInt(occ.range[0], occ.range[1], s + 6);

  const ageMin = isMale ? 24 : 22;
  const ageMax = isMale ? 42 : 38;
  // Ensure first 5 demo profiles are older so they aren't auto-rejected
  const age = index < 5 ? randInt(30, 34, s + 10) : randInt(ageMin, ageMax, s + 10);
  const yr = 2026 - age;
  const mo = String(randInt(1, 12, s + 11)).padStart(2, '0');
  const dy = String(randInt(1, 28, s + 12)).padStart(2, '0');
  const dob = `${yr}-${mo}-${dy}`;

  const diet = religion === 'Jain' ? 'Jain'
    : pick(['Vegetarian','Vegetarian','Non-Vegetarian','Eggetarian'], s + 13);
  const smoking = isMale
    ? pick(['Never','Never','Never','Occasionally'], s + 14) : 'Never';
  const drinking = pick(['Never','Never','Occasionally','Socially'], s + 15);

  const wantKids = pick(['Yes','Yes','Yes','Open','No'], s + 16);
  const openToRelocate = sr(s + 17) > 0.3;
  const timeline = pick(['Within 6 months','6-12 months','1-2 years','After 2 years','Not Sure'], s + 18);
  const journeyStatus = JOURNEY_DIST[index % JOURNEY_DIST.length];

  const interests = pickN(INTERESTS, randInt(3, 5, s + 19), s + 20);
  const heightMin = isMale ? 165 : 153;
  const heightMax = isMale ? 185 : 172;

  // Preferred age range — females tend to prefer older, males prefer younger
  const prefAgeMin = Math.max(18, isMale ? age - 6 : age);
  const prefAgeMax = index < 5 ? 50 : Math.min(50, isMale ? age + 1 : age + 10);

  // Make first 5 profiles completely open to all religions
  const prefReligion = index < 5 ? [] : (sr(s + 21) > 0.4 ? [religion] : []);
  const prefIncomeMin = isMale ? null : Math.max(4, income - 8);
  const prefIncomeMax = isMale ? null : income + 20;

  // Dicebear avatar — unique per name, no API key needed
  const photoUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}${index}`;

  return {
    first_name: firstName,
    last_name: lastName,
    gender: isMale ? 'Male' : 'Female',
    date_of_birth: dob,
    photo_url: photoUrl,
    city: location.city,
    state: location.state,
    country: 'India',
    marital_status: sr(s + 22) > 0.88 ? 'Divorced' : 'Never Married',
    education: pick(EDUCATION, s + 23),
    college: pick(COLLEGES, s + 24),
    occupation: occ.title,
    company: pick(COMPANIES, s + 25),
    annual_income: income,
    employed_in: occ.sector,
    religion,
    caste,
    sub_caste: null,
    mother_tongue: motherTongue,
    family_type: pick(['Nuclear','Joint','Extended'], s + 26),
    family_values: pick(['Traditional','Moderate','Liberal'], s + 27),
    father_occupation: pick(['Business','Service','Government','Retired','Farmer'], s + 28),
    mother_occupation: pick(['Homemaker','Teacher','Business','Service'], s + 29),
    num_siblings: randInt(0, 3, s + 30),
    manglik_status: pick(['Yes','No','No','No','Does Not Matter'], s + 31),
    languages,
    diet,
    smoking,
    drinking,
    open_to_pets: sr(s + 32) > 0.65,
    physical_activity: pick(['Active','Moderate','Sedentary'], s + 33),
    personality_type: pick(['Introvert','Ambivert','Extrovert'], s + 34),
    interests,
    height_cm: randInt(heightMin, heightMax, s + 35),
    complexion: pick(['Fair','Wheatish','Dark'], s + 36),
    body_type: pick(['Slim','Athletic','Average','Heavy'], s + 37),
    want_kids: wantKids,
    open_to_relocate: openToRelocate,
    marriage_timeline: timeline,
    pref_age_min: prefAgeMin,
    pref_age_max: prefAgeMax,
    pref_education: [],
    pref_income_min: prefIncomeMin,
    pref_income_max: prefIncomeMax,
    pref_religion: prefReligion,
    pref_caste: [],
    pref_location: [],
    pref_diet: [],
    pref_family_type: [],
    pref_manglik: null,
    deal_breakers: [],
    journey_status: journeyStatus,
  };
}

// ── Main Seed Function ─────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting seed...\n');

    // Clear existing seeded data so re-runs are safe
    await client.query('DELETE FROM customers WHERE country = $1', ['India']);
    console.log('🗑️  Cleared existing profiles\n');

    await client.query('BEGIN');

    for (let i = 0; i < 100; i++) {
      const p = generateProfile(i);

      await client.query(
        `INSERT INTO customers (
          first_name, last_name, gender, date_of_birth, photo_url,
          city, state, country, marital_status,
          education, college, occupation, company, annual_income, employed_in,
          religion, caste, sub_caste, mother_tongue, family_type, family_values,
          father_occupation, mother_occupation, num_siblings, manglik_status,
          languages, diet, smoking, drinking, open_to_pets,
          physical_activity, personality_type, interests,
          height_cm, complexion, body_type,
          want_kids, open_to_relocate, marriage_timeline,
          pref_age_min, pref_age_max, pref_education,
          pref_income_min, pref_income_max,
          pref_religion, pref_caste, pref_location,
          pref_diet, pref_family_type, pref_manglik, deal_breakers,
          journey_status
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
          $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
          $31,$32,$33,$34,$35,$36,$37,$38,$39,$40,
          $41,$42::text[],$43,$44,$45::text[],$46::text[],
          $47::text[],$48::text[],$49::text[],$50,$51::text[],$52
        )`,
        [
          p.first_name, p.last_name, p.gender, p.date_of_birth, p.photo_url,
          p.city, p.state, p.country, p.marital_status,
          p.education, p.college, p.occupation, p.company, p.annual_income, p.employed_in,
          p.religion, p.caste, p.sub_caste, p.mother_tongue, p.family_type, p.family_values,
          p.father_occupation, p.mother_occupation, p.num_siblings, p.manglik_status,
          p.languages, p.diet, p.smoking, p.drinking, p.open_to_pets,
          p.physical_activity, p.personality_type, p.interests,
          p.height_cm, p.complexion, p.body_type,
          p.want_kids, p.open_to_relocate, p.marriage_timeline,
          p.pref_age_min, p.pref_age_max, p.pref_education,
          p.pref_income_min, p.pref_income_max,
          p.pref_religion, p.pref_caste, p.pref_location,
          p.pref_diet, p.pref_family_type, p.pref_manglik, p.deal_breakers,
          p.journey_status,
        ]
      );

      // Log every 10 records so we can watch progress
      if ((i + 1) % 10 === 0) console.log(`   ✓ Inserted ${i + 1}/100 profiles`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Seed complete — 100 Indian matrimonial profiles inserted!');
    console.log('   50 Male  |  50 Female');
    console.log('   Cities: Mumbai, Delhi, Bangalore, Ahmedabad, Pune, Hyderabad, Chennai, Kolkata, Jaipur');
    console.log('   Religions: Hindu, Muslim, Christian, Sikh, Jain\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
