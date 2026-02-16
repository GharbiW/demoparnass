-- Migration: Add 4 timestamp fields to ride table
-- MCom-0011: Restructure Ride to have 4 mandatory timestamps

-- Add new timestamp columns to ride table
ALTER TABLE IF EXISTS ride
ADD COLUMN IF NOT EXISTS presence_chargement TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS depart_chargement TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS arrivee_livraison TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fin_livraison TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS address_depart UUID REFERENCES address(id),
ADD COLUMN IF NOT EXISTS address_arrivee UUID REFERENCES address(id);

-- Add comments for documentation
COMMENT ON COLUMN ride.presence_chargement IS 'Timestamp when truck arrives at loading dock (mise à quai)';
COMMENT ON COLUMN ride.depart_chargement IS 'Timestamp when truck leaves loading location';
COMMENT ON COLUMN ride.arrivee_livraison IS 'Timestamp when truck arrives at delivery location';
COMMENT ON COLUMN ride.fin_livraison IS 'Timestamp when delivery is completed';
COMMENT ON COLUMN ride.address_depart IS 'Loading address (departure point)';
COMMENT ON COLUMN ride.address_arrivee IS 'Delivery address (arrival point)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ride_presence_chargement ON ride(presence_chargement);
CREATE INDEX IF NOT EXISTS idx_ride_arrivee_livraison ON ride(arrivee_livraison);
CREATE INDEX IF NOT EXISTS idx_ride_address_depart ON ride(address_depart);
CREATE INDEX IF NOT EXISTS idx_ride_address_arrivee ON ride(address_arrivee);
