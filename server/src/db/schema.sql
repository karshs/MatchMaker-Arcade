-- ============================================================
-- MatchMaker Arcade — PostgreSQL Schema
-- Run once against Neon DB via: node src/db/migrate.js
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- TABLE: customers
-- The core entity. Every matrimonial profile lives here.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  first_name        VARCHAR(50)  NOT NULL,
  last_name         VARCHAR(50)  NOT NULL,
  gender            VARCHAR(10)  NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  date_of_birth     DATE         NOT NULL,
  photo_url         TEXT,

  -- Location
  city              VARCHAR(80)  NOT NULL,
  state             VARCHAR(80),
  country           VARCHAR(50)  NOT NULL DEFAULT 'India',

  -- Marital history
  marital_status    VARCHAR(20)  NOT NULL DEFAULT 'Never Married'
                      CHECK (marital_status IN ('Never Married', 'Divorced', 'Widowed', 'Separated')),

  -- Professional
  education         VARCHAR(60),   -- e.g. 'B.Tech', 'MBA', 'MBBS', 'CA'
  college           VARCHAR(120),
  occupation        VARCHAR(80),
  company           VARCHAR(120),
  annual_income     INTEGER,       -- in INR lakhs per annum (e.g. 12 = 12 LPA)
  employed_in       VARCHAR(30)
                      CHECK (employed_in IN ('Government', 'Private', 'Business', 'Not Working', 'Other')),

  -- Family background
  religion          VARCHAR(40),
  caste             VARCHAR(80),
  sub_caste         VARCHAR(80),
  mother_tongue     VARCHAR(40),
  family_type       VARCHAR(20)
                      CHECK (family_type IN ('Nuclear', 'Joint', 'Extended')),
  family_values     VARCHAR(20)
                      CHECK (family_values IN ('Traditional', 'Moderate', 'Liberal')),
  father_occupation VARCHAR(80),
  mother_occupation VARCHAR(80),
  num_siblings      INTEGER        DEFAULT 0,
  manglik_status    VARCHAR(20)    DEFAULT 'Does Not Matter'
                      CHECK (manglik_status IN ('Yes', 'No', 'Partial', 'Does Not Matter')),

  -- Lifestyle
  languages         TEXT[],        -- e.g. ARRAY['Hindi', 'Gujarati', 'English']
  diet              VARCHAR(20)
                      CHECK (diet IN ('Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan', 'Jain')),
  smoking           VARCHAR(20)    DEFAULT 'Never'
                      CHECK (smoking IN ('Never', 'Occasionally', 'Regularly')),
  drinking          VARCHAR(20)    DEFAULT 'Never'
                      CHECK (drinking IN ('Never', 'Occasionally', 'Regularly', 'Socially')),
  open_to_pets      BOOLEAN        DEFAULT FALSE,
  physical_activity VARCHAR(20)
                      CHECK (physical_activity IN ('Active', 'Moderate', 'Sedentary')),
  personality_type  VARCHAR(20)
                      CHECK (personality_type IN ('Introvert', 'Ambivert', 'Extrovert')),
  interests         TEXT[],        -- e.g. ARRAY['Travel', 'Cricket', 'Music']

  -- Physical attributes (common in Indian matrimonial)
  height_cm         INTEGER,
  complexion        VARCHAR(20),   -- Fair / Wheatish / Dark
  body_type         VARCHAR(20)
                      CHECK (body_type IN ('Slim', 'Athletic', 'Average', 'Heavy')),

  -- Future plans
  want_kids         VARCHAR(20)    DEFAULT 'Yes'
                      CHECK (want_kids IN ('Yes', 'No', 'Open', 'Already Has')),
  open_to_relocate  BOOLEAN        DEFAULT TRUE,
  marriage_timeline VARCHAR(30)
                      CHECK (marriage_timeline IN (
                        'Within 6 months', '6-12 months', '1-2 years', 'After 2 years', 'Not Sure'
                      )),

  -- Partner preferences
  pref_age_min      INTEGER,
  pref_age_max      INTEGER,
  pref_education    TEXT[],        -- acceptable education levels
  pref_income_min   INTEGER,       -- in LPA
  pref_income_max   INTEGER,
  pref_religion     TEXT[],        -- empty = open to all
  pref_caste        TEXT[],        -- NULL or empty = open to all castes
  pref_location     TEXT[],        -- preferred cities/states
  pref_diet         TEXT[],
  pref_family_type  TEXT[],
  pref_manglik      VARCHAR(20),   -- NULL = no preference
  deal_breakers     TEXT[],        -- free-text tags e.g. 'Smoker', 'No kids'

  -- CRM metadata
  journey_status    VARCHAR(30)    NOT NULL DEFAULT 'Profile Verified'
                      CHECK (journey_status IN (
                        'Profile Verified', 'Searching', 'Matches Shared',
                        'Interested', 'Call Scheduled', 'Meeting Scheduled',
                        'Successful Match', 'Paused', 'Inactive'
                      )),
  registered_on     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  last_updated      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  is_active         BOOLEAN        NOT NULL DEFAULT TRUE
);


-- ────────────────────────────────────────────────────────────
-- TABLE: notes
-- Matchmaker's interaction log for each customer.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note_type   VARCHAR(20) NOT NULL
                CHECK (note_type IN ('Call', 'Meeting', 'Follow Up', 'General Note')),
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Speed up fetching all notes for a customer
CREATE INDEX IF NOT EXISTS idx_notes_customer ON notes(customer_id);


-- ────────────────────────────────────────────────────────────
-- TABLE: matches
-- Records of match suggestions — computed by the match engine.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS matches (
  id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_a_id UUID     NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_b_id UUID     NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  score         SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  ai_insights   TEXT,    -- cached AI explanation (so we don't call OpenAI twice)
  status        VARCHAR(20) NOT NULL DEFAULT 'Suggested'
                  CHECK (status IN ('Suggested', 'Sent', 'Interested', 'Rejected', 'Successful')),
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate match pairs
  UNIQUE (customer_a_id, customer_b_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_a ON matches(customer_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_b ON matches(customer_b_id);


-- ────────────────────────────────────────────────────────────
-- TABLE: journey_events
-- Append-only timeline of every status change for a customer.
-- The current status lives on customers.journey_status (fast read).
-- Full history lives here (audit trail).
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journey_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  from_status VARCHAR(30),          -- NULL on first transition from 'Profile Verified'
  to_status   VARCHAR(30) NOT NULL,
  note        TEXT,                 -- optional matchmaker note on why status changed
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by  VARCHAR(80) DEFAULT 'admin@matchmaker.com'
);

CREATE INDEX IF NOT EXISTS idx_journey_customer ON journey_events(customer_id);
