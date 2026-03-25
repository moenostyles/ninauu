-- 最初に登録したユーザー（あなた）のIDを取得して挿入
WITH me AS (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
INSERT INTO gears (name, brand, weight_g, category, user_id) VALUES
  ('Ultralight Travel Toothbrush',                        'Zpacks',          23,   'Others',       (SELECT id FROM me)),
  ('BAEKDU 2 (Main 40L + Pockets 15L)',                   'Cayl',            933,  'Backpack',     (SELECT id FROM me)),
  ('Nero Ultra 38L',                                      'Zpacks',          417,  'Backpack',     (SELECT id FROM me)),
  ('Platy 2L Bottle',                                     'Platypus',        36,   'Bottle & Filter', (SELECT id FROM me)),
  ('Logo bottle 500',                                     'and wander',      110,  'Bottle & Filter', (SELECT id FROM me)),
  ('Chair One High Back',                                 'Helinox',         1300, 'Others',       (SELECT id FROM me)),
  ('Chair Zero',                                          'Helinox',         530,  'Others',       (SELECT id FROM me)),
  ('Ultra-Sil Eye Shade',                                 'Sea To Summit',   58,   'Others',       (SELECT id FROM me)),
  ('Airlite Towel',                                       'Sea To Summit',   30,   'Others',       (SELECT id FROM me)),
  ('FR-ULT / ultra light table',                          'FIELD RECORD',    45,   'Others',       (SELECT id FROM me)),
  ('fold-a-cup',                                          'Wildo',           25,   'Others',       (SELECT id FROM me)),
  ('NICKTSUCAM',                                          'Evernew',         9,    'Others',       (SELECT id FROM me)),
  ('Fillo™ Elite Wide Ultralight Backpacking Pillow',     'NEMO',            118,  'Pillow',       (SELECT id FROM me)),
  ('NB10000',                                             'Nitecore',        150,  'Power Bank',   (SELECT id FROM me)),
  ('3 in 1 Electric Air Pump',                            'PACOONE',         140,  'Others',       (SELECT id FROM me)),
  ('3-ten AURORA 800DX',                                  'NANGA',           1350, 'Sleeping Bag', (SELECT id FROM me)),
  ('Reactor Sleeping Bag Liner (Beluga Black)',            'Sea To Summit',   267,  'Sleeping Bag', (SELECT id FROM me)),
  ('X-lite 300',                                          'Cumulus',         465,  'Sleeping Bag', (SELECT id FROM me)),
  ('Z Lite Sol',                                          'Therm-a-Rest',    410,  'Sleeping Mat', (SELECT id FROM me)),
  ('NeoAir® UberLite™',                                   'Therm-a-Rest',    170,  'Sleeping Mat', (SELECT id FROM me)),
  ('Tensor™ Extreme Conditions Insulated Sleeping Pad',   'NEMO',            710,  'Sleeping Mat', (SELECT id FROM me)),
  ('TREK RAIZ0',                                          'ARAI',            1470, 'Tent',         (SELECT id FROM me)),
  ('Duplex Classic Tent',                                 'Zpacks',          507,  'Tent',         (SELECT id FROM me)),
  ('Duplex Freestanding Flex Kit',                        'Zpacks',          323,  'Tent',         (SELECT id FROM me)),
  ('Lightrek Hiking Umbrella',                            'Gossamer Gear',   164,  'Umbrella',     (SELECT id FROM me)),
  ('DCF Rain Kilt',                                       'Zpacks',          52,   'Others',       (SELECT id FROM me)),
  ('Tyvek® Mat Gray',                                     'HIKER WORKSHOP',  37,   'Ground Sheet', (SELECT id FROM me));
