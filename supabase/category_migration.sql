-- Category name migration: old flat categories → Moonlight Gear hierarchy
-- Run this in Supabase SQL Editor

-- gears table
UPDATE gears SET category = 'Sleeping Bag'        WHERE category = 'Sleeping bag';
UPDATE gears SET category = 'Sleeping Mat'        WHERE category = 'Sleeping mat';
UPDATE gears SET category = 'Stove & Fuel'        WHERE category = 'Cook';
UPDATE gears SET category = 'Bottle & Filter'     WHERE category = 'Water';
UPDATE gears SET category = 'GPS & Communication' WHERE category = 'Electronics';
UPDATE gears SET category = 'Stuff Sack'          WHERE category = 'Accessories';
UPDATE gears SET category = 'T-shirt & Shirt'     WHERE category = 'Apparel';
UPDATE gears SET category = 'Others'              WHERE category = 'Chair';

-- gear_catalog table
UPDATE gear_catalog SET category = 'Sleeping Bag'        WHERE category = 'Sleeping bag';
UPDATE gear_catalog SET category = 'Sleeping Mat'        WHERE category = 'Sleeping mat';
UPDATE gear_catalog SET category = 'Stove & Fuel'        WHERE category = 'Cook';
UPDATE gear_catalog SET category = 'Bottle & Filter'     WHERE category = 'Water';
UPDATE gear_catalog SET category = 'GPS & Communication' WHERE category = 'Electronics';
UPDATE gear_catalog SET category = 'Stuff Sack'          WHERE category = 'Accessories';
UPDATE gear_catalog SET category = 'T-shirt & Shirt'     WHERE category = 'Apparel';
UPDATE gear_catalog SET category = 'Others'              WHERE category = 'Chair';

-- wishlist table
UPDATE wishlist SET category = 'Sleeping Bag'        WHERE category = 'Sleeping bag';
UPDATE wishlist SET category = 'Sleeping Mat'        WHERE category = 'Sleeping mat';
UPDATE wishlist SET category = 'Stove & Fuel'        WHERE category = 'Cook';
UPDATE wishlist SET category = 'Bottle & Filter'     WHERE category = 'Water';
UPDATE wishlist SET category = 'GPS & Communication' WHERE category = 'Electronics';
UPDATE wishlist SET category = 'Stuff Sack'          WHERE category = 'Accessories';
UPDATE wishlist SET category = 'T-shirt & Shirt'     WHERE category = 'Apparel';
UPDATE wishlist SET category = 'Others'              WHERE category = 'Chair';

-- Confirm results
SELECT category, COUNT(*) FROM gears GROUP BY category ORDER BY category;
