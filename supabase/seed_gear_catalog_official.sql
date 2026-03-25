-- ============================================================
-- Ninauu — Official Gear Weight Seed Database
-- Sources: Manufacturer official websites / spec sheets
-- All weights in grams (g). is_verified = true.
-- ============================================================

INSERT INTO gear_catalog (name, brand, weight_g, category, is_verified, description) VALUES

-- ══════════════════════════════════════════
-- TENT & TARP
-- ══════════════════════════════════════════

-- Big Agnes
('Fly Creek HV UL2',          'Big Agnes',  907,  'Tent',  true, 'Ultralight 2-person freestanding tent'),
('Copper Spur HV UL2',        'Big Agnes', 1020,  'Tent',  true, '2-person ultralight backpacking tent'),
('Copper Spur HV UL3',        'Big Agnes', 1360,  'Tent',  true, '3-person ultralight backpacking tent'),
('Tiger Wall UL2 Solution Dye','Big Agnes',  907,  'Tent',  true, 'Trekking pole supported 2P tent'),

-- Nemo
('Hornet Elite OSMO 2P',      'Nemo',       816,  'Tent',  true, 'Ultralight 2-person tent'),
('Hornet OSMO 2P',            'Nemo',      1020,  'Tent',  true, '2-person backpacking tent'),
('Dragonfly OSMO 2P',         'Nemo',      1077,  'Tent',  true, 'Versatile 2-person tent'),
('Spike 1P',                  'Nemo',       680,  'Tent',  true, '1-person ultralight tent'),

-- MSR
('Hubba Hubba NX 2',          'MSR',       1540,  'Tent',  true, '2-person backpacking tent'),
('Carbon Reflex 2',           'MSR',        908,  'Tent',  true, 'Carbon fiber ultralight 2P tent'),
('Freelite 2',                'MSR',        907,  'Tent',  true, 'Ultralight trekking pole tent'),

-- Zpacks
('Duplex',                    'Zpacks',     510,  'Tent',  true, 'DCF 2-person trekking pole tent'),
('Plex Solo',                 'Zpacks',     284,  'Tent',  true, 'DCF solo trekking pole tent'),
('Plex Duplex',               'Zpacks',     411,  'Tent',  true, 'DCF 2P tent revised'),

-- Six Moon Designs
('Lunar Solo',                'Six Moon Designs', 595, 'Tent', true, 'Solo silnylon trekking pole tent'),
('Lunar Duo Explore',         'Six Moon Designs', 794, 'Tent', true, '2P trekking pole tent'),

-- Tarptent
('Notch Li',                  'Tarptent',   340,  'Tent',  true, 'Ultralight solo trekking pole tent'),
('Stratospire Li',            'Tarptent',   737,  'Tent',  true, '2-person DCF tent'),
('Protrail Li',               'Tarptent',   397,  'Tent',  true, 'Solo semi-freestanding tent'),

-- Gossamer Gear
('The One',                   'Gossamer Gear', 589, 'Tent', true, 'Solo silpoly trekking pole tent'),
('The Two',                   'Gossamer Gear', 737, 'Tent', true, '2P silpoly trekking pole tent'),

-- Montbell
('U.L. Dome Shelter 1',       'mont-bell',  630,  'Tent',  true, 'Ultralight solo dome tent'),
('U.L. Dome Shelter 2',       'mont-bell',  790,  'Tent',  true, 'Ultralight 2P dome tent'),
('Stellarium 1',              'mont-bell',  770,  'Tent',  true, 'Mesh inner 1-person tent'),

-- Tarps
('Cuben Fiber Tarp',          'Zpacks',     141,  'Tarp',  true, 'DCF silnylon tarp'),
('SilTarp 1',                 'MSR',        290,  'Tarp',  true, 'Silnylon tarp'),
('DD Tarp 3x3',               'DD Hammocks',445,  'Tarp',  true, 'Versatile 3x3m tarp'),

-- ══════════════════════════════════════════
-- BACKPACK
-- ══════════════════════════════════════════

-- Zpacks
('Arc Blast 55L',             'Zpacks',     453,  'Backpack', true, 'DCF frameless 55L pack'),
('Arc Haul Ultra 60L',        'Zpacks',     539,  'Backpack', true, 'DCF 60L framed pack'),
('Zero 38L',                  'Zpacks',     170,  'Backpack', true, 'DCF ultralight frameless 38L'),

-- Gossamer Gear
('Mariposa 60',               'Gossamer Gear', 680, 'Backpack', true, 'Frameless 60L ultralight pack'),
('Gorilla 40',                'Gossamer Gear', 567, 'Backpack', true, '40L ultralight pack'),

-- Hyperlite Mountain Gear
('Southwest 3400',            'Hyperlite Mountain Gear', 817, 'Backpack', true, 'DCF 55L pack'),
('Windrider 3400',            'Hyperlite Mountain Gear', 822, 'Backpack', true, 'DCF 55L with frame'),
('Junction 3400',             'Hyperlite Mountain Gear', 771, 'Backpack', true, 'DCF minimalist 55L'),

-- Osprey
('Exos 58',                   'Osprey',    1170,  'Backpack', true, 'Lightweight men''s 58L pack'),
('Exos Pro 55',               'Osprey',     870,  'Backpack', true, 'Ultralight men''s 55L pack'),
('Levity Pro 45',             'Osprey',     680,  'Backpack', true, 'Ultralight men''s 45L pack'),
('Eja Pro 55',                'Osprey',     793,  'Backpack', true, 'Ultralight women''s 55L pack'),

-- Granite Gear
('Crown2 60',                 'Granite Gear', 1077, 'Backpack', true, 'Lightweight 60L pack'),

-- ULA Equipment
('Circuit',                   'ULA Equipment', 765, 'Backpack', true, 'Versatile 68L ultralight pack'),
('Catalyst',                  'ULA Equipment', 907, 'Backpack', true, 'Heavy-duty 68L pack'),

-- Montbell
('Versalight 25',             'mont-bell',  368,  'Backpack', true, '25L ultralight pack'),
('Versalight 40',             'mont-bell',  530,  'Backpack', true, '40L ultralight pack'),
('Grand King Pack 65',        'mont-bell',  1570, 'Backpack', true, 'Multi-day 65L trekking pack'),

-- ══════════════════════════════════════════
-- SLEEPING BAG
-- ══════════════════════════════════════════

-- Western Mountaineering
('UltraLite 20°F',            'Western Mountaineering', 680, 'Sleeping Bag', true, '20°F/-7°C down sleeping bag'),
('SummerLite 32°F',           'Western Mountaineering', 454, 'Sleeping Bag', true, '32°F/0°C down sleeping bag'),
('Megalite 30°F',             'Western Mountaineering', 567, 'Sleeping Bag', true, '30°F/-1°C women''s down bag'),

-- Zpacks
('Sleeping Bag 20°F',         'Zpacks',     369,  'Sleeping Bag', true, '20°F DCF down quilt/bag'),

-- Enlightened Equipment
('Revelation 20°F Quilt',     'Enlightened Equipment', 510, 'Sleeping Bag', true, '20°F down quilt'),
('Enigma 20°F Quilt',         'Enlightened Equipment', 454, 'Sleeping Bag', true, '20°F premium down quilt'),

-- Nemo
('Disco 15°F',                'Nemo',      1247,  'Sleeping Bag', true, '15°F spoon-shaped down bag'),
('Riff 15°F',                 'Nemo',       964,  'Sleeping Bag', true, '15°F men''s down bag'),

-- Big Agnes
('Torchlight UL 20',          'Big Agnes',  624,  'Sleeping Bag', true, '20°F ultralight down bag'),
('Lost Dog 15',               'Big Agnes',  964,  'Sleeping Bag', true, '15°F down sleeping bag'),

-- Montbell
('Down Hugger 800 #1',        'mont-bell',  339,  'Sleeping Bag', true, '#1 (5°C) 800FP down mummy bag'),
('Down Hugger 800 #2',        'mont-bell',  370,  'Sleeping Bag', true, '#2 (0°C) 800FP down mummy bag'),
('Down Hugger 800 #3',        'mont-bell',  399,  'Sleeping Bag', true, '#3 (-5°C) 800FP down mummy bag'),
('Down Hugger 900 #0',        'mont-bell',  354,  'Sleeping Bag', true, '#0 (10°C) 900FP down mummy bag'),
('Down Hugger 900 #3',        'mont-bell',  388,  'Sleeping Bag', true, '#3 (-5°C) 900FP down mummy bag'),
('Super Spiral Down Hugger #3','mont-bell', 578,  'Sleeping Bag', true, '#3 (-5°C) 360° stretch down bag'),

-- Sea to Summit
('Spark SpI',                 'Sea to Summit', 370, 'Sleeping Bag', true, '15°C ultralight down bag'),
('Spark SpIII',               'Sea to Summit', 640, 'Sleeping Bag', true, '-9°C ultralight down bag'),

-- ══════════════════════════════════════════
-- SLEEPING MAT
-- ══════════════════════════════════════════

-- Therm-a-Rest
('NeoAir XLite NXT Regular',  'Therm-a-Rest', 354, 'Sleeping Mat', true, 'R-value 4.5 ultralight air pad'),
('NeoAir XLite NXT Large',    'Therm-a-Rest', 454, 'Sleeping Mat', true, 'R-value 4.5 ultralight air pad L'),
('NeoAir XTherm NXT Regular', 'Therm-a-Rest', 430, 'Sleeping Mat', true, 'R-value 7.3 warm air pad'),
('Z Lite Sol Regular',        'Therm-a-Rest', 410, 'Sleeping Mat', true, 'R-value 2.0 closed-cell foam pad'),
('ProLite Plus Regular',      'Therm-a-Rest', 480, 'Sleeping Mat', true, 'R-value 3.7 self-inflating pad'),

-- Nemo
('Tensor Insulated Regular',  'Nemo',        454, 'Sleeping Mat', true, 'R-value 3.5 ultralight air pad'),
('Tensor Alpine Regular',     'Nemo',        482, 'Sleeping Mat', true, 'R-value 4.8 4-season air pad'),

-- Sea to Summit
('Ether Light XT Insulated R','Sea to Summit', 540, 'Sleeping Mat', true, 'R-value 3.2 ultralight air pad'),
('Ultralight Insulated R',    'Sea to Summit', 395, 'Sleeping Mat', true, 'R-value 3.1 ultralight air pad'),

-- Klymit
('Static V2 Regular',         'Klymit',      530, 'Sleeping Mat', true, 'R-value 1.3 budget air pad'),
('Insulated Static V Regular','Klymit',      680, 'Sleeping Mat', true, 'R-value 4.4 insulated air pad'),

-- Montbell
('U.L. Comfort System Pad 150','mont-bell',  270, 'Sleeping Mat', true, 'Ultralight self-inflating pad 150cm'),
('Down Mat 7 180',            'mont-bell',   680, 'Sleeping Mat', true, 'Down-filled air mat 180cm'),

-- ══════════════════════════════════════════
-- TOPS (Jackets)
-- ══════════════════════════════════════════

-- Montbell
('Ex Light Wind Jacket Men''s M', 'mont-bell',  89, 'Shell Jacket', true, 'Ultra-light windshell jacket'),
('Versalite Jacket Men''s M',     'mont-bell', 164, 'Shell Jacket', true, 'Waterproof ultralight jacket'),
('Tachyon Jacket Men''s M',       'mont-bell', 107, 'Shell Jacket', true, 'Ultra-packable windshell'),
('Thunder Pass Jacket Men''s M',  'mont-bell', 350, 'Shell Jacket', true, 'Waterproof hardshell jacket'),
('U.L. Down Jacket Men''s M',     'mont-bell', 202, 'Insulation Jacket', true, '800FP down jacket'),
('Plasma 1000 Down Jacket M',     'mont-bell', 133, 'Insulation Jacket', true, '1000FP ultralight down jacket'),

-- Patagonia
('Nano Puff Jacket Men''s M',     'Patagonia', 312, 'Insulation Jacket', true, 'PrimaLoft insulation jacket'),
('Micro Puff Jacket Men''s M',    'Patagonia', 217, 'Insulation Jacket', true, 'Ultralight PrimaLoft jacket'),
('Houdini Jacket Men''s M',       'Patagonia', 120, 'Shell Jacket',      true, 'Ultralight windshell jacket'),
('Torrentshell 3L Men''s M',      'Patagonia', 383, 'Shell Jacket',      true, '3-layer waterproof jacket'),

-- Arc'teryx
('Atom LT Hoody Men''s M',        'Arc''teryx', 318, 'Insulation Jacket', true, 'Coreloft insulation hoody'),
('Cerium SL Hoody Men''s M',      'Arc''teryx', 196, 'Insulation Jacket', true, 'Down ultralight hoody'),
('Beta LT Jacket Men''s M',       'Arc''teryx', 340, 'Shell Jacket',      true, 'GORE-TEX waterproof jacket'),
('Norvan SL Jacket Men''s M',     'Arc''teryx', 119, 'Shell Jacket',      true, 'Ultra-light trail running shell'),

-- ══════════════════════════════════════════
-- BOTTOMS
-- ══════════════════════════════════════════

-- Montbell
('Versalite Pants Men''s M',    'mont-bell', 120, 'Shell Pants',      true, 'Waterproof ultralight pants'),
('Trail Action Pants Men''s M', 'mont-bell', 166, 'Pants & Shorts',   true, 'Stretch active hiking pants'),
('Light Shell Pants Men''s M',  'mont-bell', 233, 'Shell Pants',      true, 'Breathable windproof pants'),

-- Patagonia
('Torrentshell 3L Pants M',     'Patagonia', 311, 'Shell Pants',      true, '3-layer waterproof pants'),
('Nano Puff Pants Men''s M',    'Patagonia', 255, 'Insulation Pants', true, 'PrimaLoft insulation pants'),

-- ══════════════════════════════════════════
-- FOOTWEAR
-- ══════════════════════════════════════════

('Speedcross 6 Men''s 27cm',    'Salomon',   290, 'Footwear', true, 'Trail running shoe (per shoe)'),
('Speedgoat 5 Men''s 27cm',     'HOKA',      285, 'Footwear', true, 'Trail running shoe (per shoe)'),
('Lone Peak 7 Men''s 27cm',     'Altra',     255, 'Footwear', true, 'Trail running shoe (per shoe)'),
('Cascadia 17 Men''s 27cm',     'Brooks',    298, 'Footwear', true, 'Trail running shoe (per shoe)'),
('Katana Men''s 27cm',          'La Sportiva', 280, 'Footwear', true, 'Trail running shoe (per shoe)'),

-- ══════════════════════════════════════════
-- COOKWARE
-- ══════════════════════════════════════════

-- Jetboil
('Flash',                       'Jetboil',  371, 'Stove & Fuel', true, 'Integrated canister stove system'),
('MiniMo',                      'Jetboil',  363, 'Stove & Fuel', true, 'Simmering-capable canister system'),
('Stash',                       'Jetboil',  119, 'Stove & Fuel', true, 'Ultralight integrated system'),

-- MSR
('PocketRocket 2',              'MSR',       73, 'Stove & Fuel', true, 'Compact canister stove'),
('PocketRocket Deluxe',         'MSR',       93, 'Stove & Fuel', true, 'Canister stove with piezo'),
('WindBurner Solo System',      'MSR',      426, 'Stove & Fuel', true, 'Wind-resistant integrated system'),

-- Snow Peak
('LiteMax Titanium Stove',      'Snow Peak',  56, 'Stove & Fuel', true, 'Ultra-compact titanium stove'),
('GigaPower Stove',             'Snow Peak',  74, 'Stove & Fuel', true, 'Compact canister stove'),
('Trek 700 Titanium',           'Snow Peak', 120, 'Cooker',       true, 'Titanium cook pot 700ml'),
('Trek 900 Titanium',           'Snow Peak', 135, 'Cooker',       true, 'Titanium cook pot 900ml'),

-- BRS
('BRS-3000T',                   'BRS',        25, 'Stove & Fuel', true, 'Ultra-compact titanium stove'),

-- Toaks
('Titanium 750ml Pot',          'Toaks',     116, 'Cooker',       true, 'Titanium pot 750ml'),
('Titanium 900ml Pot',          'Toaks',     130, 'Cooker',       true, 'Titanium pot 900ml'),
('Titanium 1100ml Pot',         'Toaks',     145, 'Cooker',       true, 'Titanium pot 1100ml'),

-- Sea to Summit
('X-Pot 1.4L',                  'Sea to Summit', 135, 'Cooker', true, 'Collapsible pot 1.4L'),
('X-Pot 2.8L',                  'Sea to Summit', 184, 'Cooker', true, 'Collapsible pot 2.8L'),
('Alpha Light Spork',           'Sea to Summit',  11, 'Cutlery', true, 'Titanium spork'),

-- Montbell
('Alpine Cooker 14+16 Set',     'mont-bell', 218, 'Cooker',       true, '2-piece titanium cook pot set'),
('Alpine Cooker 16',            'mont-bell', 113, 'Cooker',       true, 'Titanium cook pot 1.3L'),

-- ══════════════════════════════════════════
-- FIELD GEAR
-- ══════════════════════════════════════════

-- Trekking Poles
('Distance Carbon Z Men''s 120cm',   'Black Diamond', 186, 'Others', true, 'Carbon folding trekking poles (pair)'),
('Trail Back Carbon 110-130cm',       'Black Diamond', 442, 'Others', true, 'Carbon trekking poles (pair)'),
('Micro Vario Carbon 100-130cm',      'Leki',          254, 'Others', true, 'Carbon folding trekking poles (pair)'),
('Ultralite Aergon 100-130cm',        'Leki',          286, 'Others', true, 'Carbon trekking poles (pair)'),

-- Headlamps
('Spot 400 Headlamp',          'Black Diamond',  79, 'Headlamp', true, '400 lumen headlamp'),
('Spot 350 Headlamp',          'Black Diamond',  88, 'Headlamp', true, '350 lumen headlamp'),
('Swift RL Headlamp',          'Black Diamond',  83, 'Headlamp', true, 'Rechargeable 500 lumen'),
('Iko Core Headlamp',          'Petzl',          67, 'Headlamp', true, '500 lumen rechargeable'),
('Bindi Headlamp',             'Petzl',          35, 'Headlamp', true, '200 lumen ultralight'),
('Nao RL',                     'Petzl',         100, 'Headlamp', true, '1500 lumen rechargeable'),

-- GPS & Communication
('inReach Mini 2',             'Garmin',        100, 'GPS & Communication', true, 'Satellite communicator'),
('inReach Messenger',          'Garmin',         55, 'GPS & Communication', true, 'Lightweight satellite messenger'),
('GPSMAP 67i',                 'Garmin',        230, 'GPS & Communication', true, 'GPS with satellite messaging'),

-- Water Filtration
('Squeeze Filter',             'Sawyer',         85, 'Bottle & Filter', true, 'Squeeze water filter 0.1 micron'),
('Micro Squeeze',              'Sawyer',         57, 'Bottle & Filter', true, 'Ultra-compact filter'),
('BeFree 1L',                  'Katadyn',        57, 'Bottle & Filter', true, 'Collapsible bottle filter 1L'),
('TrailShot',                  'MSR',            96, 'Bottle & Filter', true, 'On-the-go pocket filter'),

-- Power Banks
('Anker PowerCore 10000',      'Anker',         180, 'Power Bank', true, '10000mAh portable charger'),
('Anker PowerCore 20100',      'Anker',         356, 'Power Bank', true, '20100mAh portable charger'),
('BioLite Charge 40 PD',       'BioLite',       226, 'Power Bank', true, '40Wh 10000mAh power bank'),

-- Umbrellas
('U.L. Trekking Umbrella',     'mont-bell',     138, 'Umbrella', true, 'Ultralight trekking umbrella'),
('Chrome Dome UL',             'Six Moon Designs', 191, 'Umbrella', true, 'Ultralight trekking umbrella'),
('Liteflex Hiking Umbrella',   'Gossamer Gear', 191, 'Umbrella', true, 'Ultralight hiking umbrella'),

-- Stuff Sacks / Organization
('Ultra-Sil Dry Sack 1L',      'Sea to Summit',  18, 'Stuff Sack', true, '1L waterproof stuff sack'),
('Ultra-Sil Dry Sack 4L',      'Sea to Summit',  28, 'Stuff Sack', true, '4L waterproof stuff sack'),
('Ultra-Sil Dry Sack 13L',     'Sea to Summit',  43, 'Stuff Sack', true, '13L waterproof stuff sack'),

-- Emergency
('Emergency Bivy',             'SOL',            79, 'Emergency', true, 'Reflective emergency bivy'),
('Escape Bivy',                'SOL',           122, 'Emergency', true, 'Breathable emergency bivy'),
('First Aid Kit Ultralight',   'Adventure Medical Kits', 107, 'Emergency', true, 'Ultralight first aid kit')

ON CONFLICT DO NOTHING;
