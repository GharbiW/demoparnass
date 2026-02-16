-- ================================================================
-- 050 – Sites d'exploitation
-- ================================================================
-- Table for managing operational sites (depots, parkings, garages,
-- lieux de prise de service, etc.)
-- ================================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS site (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    nom                 VARCHAR(255) NOT NULL,
    type                VARCHAR(50)  NOT NULL DEFAULT 'lieu_prise_service',
        -- depot | parking | garage | lieu_prise_service
    is_lieu_prise_service BOOLEAN NOT NULL DEFAULT FALSE,

    -- Address
    adresse             TEXT,
    ville               VARCHAR(150),
    code_postal         VARCHAR(20),
    pays                VARCHAR(100) DEFAULT 'France',

    -- GPS coordinates
    latitude            DECIMAL(10, 7),
    longitude           DECIMAL(10, 7),

    -- Contact
    contact_nom         VARCHAR(255),
    contact_telephone   VARCHAR(50),

    -- Operations
    horaires            VARCHAR(255),
    capacite            INTEGER DEFAULT 0,

    -- Timestamps
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_site_type ON site (type);
CREATE INDEX IF NOT EXISTS idx_site_ville ON site (ville);
CREATE INDEX IF NOT EXISTS idx_site_is_lieu_prise_service ON site (is_lieu_prise_service);

-- 3. Updated_at trigger
CREATE OR REPLACE FUNCTION update_site_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_site_updated_at ON site;
CREATE TRIGGER trg_site_updated_at
    BEFORE UPDATE ON site
    FOR EACH ROW
    EXECUTE FUNCTION update_site_updated_at();

-- 4. RLS
ALTER TABLE site ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read site"
    ON site FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert site"
    ON site FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update site"
    ON site FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete site"
    ON site FOR DELETE TO authenticated USING (true);

-- Allow service role full access (backend uses service role key)
CREATE POLICY "Allow service role full access on site"
    ON site FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Seed data – 7 lieux de prise de service
INSERT INTO site (nom, type, is_lieu_prise_service, adresse, ville, code_postal, pays)
VALUES
    ('GLS TRAPPES',                'lieu_prise_service', TRUE, 'Route de Trappes',                         'Elancourt',        '78990', 'France'),
    ('FEDEX ELANCOURT',            'lieu_prise_service', TRUE, '14 Rue du Maréchal de Lattre de Tassigny', 'Elancourt',        '78990', 'France'),
    ('CHRONOPOST CHILLY',          'lieu_prise_service', TRUE, 'Rue Clément Ader',                         'Chilly-Mazarin',   '91380', 'France'),
    ('VIAPOSTE CHILLY - PITP SUD', 'lieu_prise_service', TRUE, 'Rue des Mares Juliennes',                  'Chilly-Mazarin',   '91380', 'France'),
    ('Dépôt Parnass',              'lieu_prise_service', TRUE, 'Rue du Pont de la Brèche',                 'Goussainville',    '95190', 'France'),
    ('Parking Aulnay',             'lieu_prise_service', TRUE, '1 Boulevard André Citroën',                'Aulnay-sous-Bois', '93600', 'France'),
    ('Parking Moissy',             'lieu_prise_service', TRUE, '281 Rue de la Mare aux Canes',             'Moissy-Cramayel',  '77550', 'France')
ON CONFLICT DO NOTHING;
