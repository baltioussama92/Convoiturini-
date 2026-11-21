-- Covoiturini database
-- Import with MySQL 5.7+ / MariaDB 10.4+.
SET NAMES utf8mb4;
SET time_zone = '+01:00';

CREATE DATABASE IF NOT EXISTS covoiturini
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE covoiturini;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ride_points;
DROP TABLE IF EXISTS rides;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  gender ENUM('male', 'female') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_phone (phone),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cities (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name_fr VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cities_name_fr (name_fr),
  KEY idx_cities_coordinates (lat, lng)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rides (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  start_name VARCHAR(120) NOT NULL,
  start_lat DECIMAL(9,6) NOT NULL,
  start_lng DECIMAL(9,6) NOT NULL,
  end_name VARCHAR(120) NOT NULL,
  end_lat DECIMAL(9,6) NOT NULL,
  end_lng DECIMAL(9,6) NOT NULL,
  ride_date DATE NOT NULL,
  ride_time TIME NOT NULL,
  seats_total TINYINT UNSIGNED NOT NULL,
  seats_left TINYINT UNSIGNED NOT NULL,
  price DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  gender_allowed ENUM('male', 'female', 'both') NOT NULL DEFAULT 'both',
  phone VARCHAR(20) NOT NULL,
  distance_km DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  duration_min SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_recurring TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('active', 'full', 'cancelled', 'done') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_rides_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_rides_seats_total CHECK (seats_total BETWEEN 1 AND 8),
  CONSTRAINT chk_rides_seats_left CHECK (seats_left <= seats_total),
  CONSTRAINT chk_rides_price CHECK (price >= 0),
  KEY idx_rides_date_status (ride_date, status),
  KEY idx_rides_route (start_name, end_name),
  KEY idx_rides_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ride_points (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ride_id INT UNSIGNED NOT NULL,
  point_order SMALLINT UNSIGNED NOT NULL,
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_ride_points_ride FOREIGN KEY (ride_id) REFERENCES rides (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uq_ride_points_order (ride_id, point_order),
  KEY idx_ride_points_route_order (ride_id, point_order),
  KEY idx_ride_points_coordinates (lat, lng)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Demo password for every account: password
INSERT INTO users (name, phone, email, password_hash, gender) VALUES
('Amel Ben Salah', '+21620100001', 'amel@example.tn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.9lJf8wQ7u8M7S7a', 'female'),
('Youssef Trabelsi', '+21620100002', 'youssef@example.tn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.9lJf8wQ7u8M7S7a', 'male'),
('Sana Gharbi', '+21620100003', 'sana@example.tn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.9lJf8wQ7u8M7S7a', 'female'),
('Mohamed Ayari', '+21620100004', 'mohamed@example.tn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.9lJf8wQ7u8M7S7a', 'male'),
('Nour Kallel', '+21620100005', 'nour@example.tn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.9lJf8wQ7u8M7S7a', 'female'),
('Karim Jaziri', '+21620100006', 'karim@example.tn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.9lJf8wQ7u8M7S7a', 'male'),
('Hiba Mansour', '+21620100007', 'hiba@example.tn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.9lJf8wQ7u8M7S7a', 'female'),
('Walid Ben Amor', '+21620100008', 'walid@example.tn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.9lJf8wQ7u8M7S7a', 'male'),
('Meriem Saidi', '+21620100009', 'meriem@example.tn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.9lJf8wQ7u8M7S7a', 'female'),
('Fares Haddad', '+21620100010', 'fares@example.tn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.9lJf8wQ7u8M7S7a', 'male');

UPDATE users
SET password_hash = '$2y$10$QUKuGl3pKnhuTGDV4Frhk.PyMSWkqPyEoZHV/FQVm1hH95TVsBksa';

INSERT INTO cities (name_fr, name_ar, lat, lng) VALUES
('Tunis', 'تونس', 36.806496, 10.181532),
('Ariana', 'أريانة', 36.866536, 10.164724),
('Ben Arous', 'بن عروس', 36.753056, 10.228611),
('Manouba', 'منوبة', 36.808056, 10.097222),
('Nabeul', 'نابل', 36.451289, 10.735660),
('Hammamet', 'الحمامات', 36.400000, 10.616670),
('Zaghouan', 'زغوان', 36.402910, 10.142920),
('Bizerte', 'بنزرت', 37.274420, 9.873910),
('Béja', 'باجة', 36.725640, 9.181690),
('Jendouba', 'جندوبة', 36.501140, 8.780240),
('Le Kef', 'الكاف', 36.174240, 8.704860),
('Siliana', 'سليانة', 36.084970, 9.370820),
('Sousse', 'سوسة', 35.825390, 10.636990),
('Monastir', 'المنستير', 35.777990, 10.826170),
('Mahdia', 'المهدية', 35.504720, 11.062220),
('Kairouan', 'القيروان', 35.678100, 10.096330),
('Kasserine', 'القصرين', 35.167580, 8.836510),
('Sidi Bouzid', 'سيدي بوزيد', 35.038230, 9.484940),
('Sfax', 'صفاقس', 34.740560, 10.760280),
('Gabès', 'قابس', 33.881460, 10.098200),
('Medenine', 'مدنين', 33.354950, 10.505480),
('Tataouine', 'تطاوين', 32.929670, 10.451770),
('Gafsa', 'قفصة', 34.425000, 8.784170),
('Tozeur', 'توزر', 33.919680, 8.133520),
('Kebili', 'قبلي', 33.704390, 8.969030);

-- Thirty realistic sample rides. Dates are intentionally relative to the import day
-- only in the sense that the application can filter them as demo records.
INSERT INTO rides
(user_id, title, start_name, start_lat, start_lng, end_name, end_lat, end_lng,
 ride_date, ride_time, seats_total, seats_left, price, gender_allowed, phone,
 distance_km, duration_min, is_recurring, status) VALUES
(1, 'Tous les matins vers Ariana', 'Manouba', 36.808056, 10.097222, 'Ariana', 36.866536, 10.164724, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', 3, 2, 3.00, 'both', '+21620100001', 8.40, 28, 1, 'active'),
(2, 'Tunis vers Sousse tôt le matin', 'Tunis', 36.806496, 10.181532, 'Sousse', 35.825390, 10.636990, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '07:30:00', 4, 3, 12.00, 'both', '+21620100002', 143.00, 105, 0, 'active'),
(3, 'Sortie vers Nabeul', 'Tunis', 36.806496, 10.181532, 'Nabeul', 36.451289, 10.735660, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:15:00', 3, 1, 8.00, 'female', '+21620100003', 65.00, 70, 0, 'active'),
(4, 'Sfax - Gabès direct', 'Sfax', 34.740560, 10.760280, 'Gabès', 33.881460, 10.098200, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '06:45:00', 5, 4, 9.00, 'both', '+21620100004', 155.00, 115, 0, 'active'),
(5, 'Ben Arous vers Tunis', 'Ben Arous', 36.753056, 10.228611, 'Tunis', 36.806496, 10.181532, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '07:45:00', 3, 2, 2.50, 'both', '+21620100005', 8.00, 25, 1, 'active'),
(6, 'Bizerte et retour', 'Bizerte', 37.274420, 9.873910, 'Tunis', 36.806496, 10.181532, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '07:00:00', 4, 2, 7.00, 'both', '+21620100006', 68.00, 65, 0, 'active'),
(7, 'Nabeul plage', 'Nabeul', 36.451289, 10.735660, 'Hammamet', 36.400000, 10.616670, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', 3, 2, 3.00, 'female', '+21620100007', 15.00, 20, 0, 'active'),
(8, 'Sousse vers Monastir', 'Sousse', 35.825390, 10.636990, 'Monastir', 35.777990, 10.826170, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:30:00', 3, 3, 3.00, 'both', '+21620100008', 25.00, 30, 1, 'active'),
(9, 'Mahdia - Sfax', 'Mahdia', 35.504720, 11.062220, 'Sfax', 34.740560, 10.760280, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '06:30:00', 4, 2, 10.00, 'both', '+21620100009', 105.00, 90, 0, 'active'),
(10, 'Capitale vers Kairouan', 'Tunis', 36.806496, 10.181532, 'Kairouan', 35.678100, 10.096330, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '06:00:00', 4, 4, 11.00, 'both', '+21620100010', 160.00, 125, 0, 'active'),
(1, 'Manouba - Tunis centre', 'Manouba', 36.808056, 10.097222, 'Tunis', 36.806496, 10.181532, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '08:15:00', 3, 1, 4.00, 'both', '+21620100001', 10.00, 30, 1, 'active'),
(2, 'Ariana vers Nabeul', 'Ariana', 36.866536, 10.164724, 'Nabeul', 36.451289, 10.735660, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '07:15:00', 4, 2, 9.00, 'both', '+21620100002', 72.00, 80, 0, 'active'),
(3, 'Tunis - Hammamet', 'Tunis', 36.806496, 10.181532, 'Hammamet', 36.400000, 10.616670, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '08:00:00', 3, 2, 8.00, 'female', '+21620100003', 70.00, 70, 0, 'active'),
(4, 'Sfax vers Mahdia', 'Sfax', 34.740560, 10.760280, 'Mahdia', 35.504720, 11.062220, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '07:00:00', 4, 1, 10.00, 'both', '+21620100004', 105.00, 90, 0, 'active'),
(5, 'Gabès - Medenine', 'Gabès', 33.881460, 10.098200, 'Medenine', 33.354950, 10.505480, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '09:00:00', 3, 2, 6.00, 'both', '+21620100005', 76.00, 65, 0, 'active'),
(6, 'Tunis - Béja', 'Tunis', 36.806496, 10.181532, 'Béja', 36.725640, 9.181690, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '06:30:00', 4, 3, 8.00, 'both', '+21620100006', 105.00, 95, 0, 'active'),
(7, 'Kairouan - Sousse', 'Kairouan', 35.678100, 10.096330, 'Sousse', 35.825390, 10.636990, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '08:45:00', 3, 1, 6.00, 'female', '+21620100007', 55.00, 55, 0, 'active'),
(8, 'Monastir - Mahdia', 'Monastir', 35.777990, 10.826170, 'Mahdia', 35.504720, 11.062220, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '07:30:00', 3, 2, 5.00, 'both', '+21620100008', 50.00, 45, 0, 'active'),
(9, 'Sfax - Djerba', 'Sfax', 34.740560, 10.760280, 'Medenine', 33.354950, 10.505480, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '05:45:00', 5, 4, 15.00, 'both', '+21620100009', 220.00, 180, 0, 'active'),
(10, 'Tataouine - Gabès', 'Tataouine', 32.929670, 10.451770, 'Gabès', 33.881460, 10.098200, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '06:15:00', 4, 2, 12.00, 'both', '+21620100010', 125.00, 110, 0, 'active'),
(1, 'Tunis - Zaghouan', 'Tunis', 36.806496, 10.181532, 'Zaghouan', 36.402910, 10.142920, DATE_ADD(CURDATE(), INTERVAL 8 DAY), '07:00:00', 3, 2, 6.00, 'both', '+21620100001', 57.00, 55, 0, 'active'),
(2, 'Bizerte - Nabeul', 'Bizerte', 37.274420, 9.873910, 'Nabeul', 36.451289, 10.735660, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '06:00:00', 4, 3, 12.00, 'both', '+21620100002', 145.00, 135, 0, 'active'),
(3, 'Ariana - Sousse', 'Ariana', 36.866536, 10.164724, 'Sousse', 35.825390, 10.636990, DATE_ADD(CURDATE(), INTERVAL 9 DAY), '07:45:00', 3, 1, 13.00, 'female', '+21620100003', 150.00, 115, 0, 'active'),
(4, 'Sfax - Kairouan', 'Sfax', 34.740560, 10.760280, 'Kairouan', 35.678100, 10.096330, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '08:00:00', 4, 2, 10.00, 'both', '+21620100004', 115.00, 105, 0, 'active'),
(5, 'Gabès - Djerba', 'Gabès', 33.881460, 10.098200, 'Medenine', 33.354950, 10.505480, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '08:30:00', 3, 1, 6.00, 'both', '+21620100005', 76.00, 65, 0, 'active'),
(6, 'Le Kef - Tunis', 'Le Kef', 36.174240, 8.704860, 'Tunis', 36.806496, 10.181532, DATE_ADD(CURDATE(), INTERVAL 10 DAY), '05:30:00', 4, 3, 13.00, 'both', '+21620100006', 175.00, 160, 0, 'active'),
(7, 'Jendouba - Béja', 'Jendouba', 36.501140, 8.780240, 'Béja', 36.725640, 9.181690, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '07:00:00', 3, 2, 6.00, 'female', '+21620100007', 65.00, 60, 0, 'active'),
(8, 'Sousse - Kairouan', 'Sousse', 35.825390, 10.636990, 'Kairouan', 35.678100, 10.096330, DATE_ADD(CURDATE(), INTERVAL 11 DAY), '08:15:00', 4, 4, 6.00, 'both', '+21620100008', 55.00, 55, 0, 'active'),
(9, 'Tozeur - Gafsa', 'Tozeur', 33.919680, 8.133520, 'Gafsa', 34.425000, 8.784170, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '07:30:00', 3, 2, 7.00, 'both', '+21620100009', 95.00, 80, 0, 'active'),
(10, 'Kebili - Gabès', 'Kebili', 33.704390, 8.969030, 'Gabès', 33.881460, 10.098200, DATE_ADD(CURDATE(), INTERVAL 12 DAY), '06:45:00', 4, 1, 8.00, 'both', '+21620100010', 95.00, 75, 0, 'active');

-- Three ordered route points per ride are enough for the demo map and can be
-- extended by the backend with the simplified OSRM geometry.
INSERT INTO ride_points (ride_id, point_order, lat, lng) VALUES
(1,1,36.808056,10.097222),(1,2,36.840000,10.130000),(1,3,36.866536,10.164724),
(2,1,36.806496,10.181532),(2,2,36.350000,10.400000),(2,3,35.825390,10.636990),
(3,1,36.806496,10.181532),(3,2,36.650000,10.450000),(3,3,36.451289,10.735660),
(4,1,34.740560,10.760280),(4,2,34.280000,10.450000),(4,3,33.881460,10.098200),
(5,1,36.753056,10.228611),(5,2,36.780000,10.210000),(5,3,36.806496,10.181532),
(6,1,37.274420,9.873910),(6,2,36.980000,10.000000),(6,3,36.806496,10.181532),
(7,1,36.451289,10.735660),(7,2,36.430000,10.670000),(7,3,36.400000,10.616670),
(8,1,35.825390,10.636990),(8,2,35.800000,10.730000),(8,3,35.777990,10.826170),
(9,1,35.504720,11.062220),(9,2,35.100000,10.950000),(9,3,34.740560,10.760280),
(10,1,36.806496,10.181532),(10,2,36.200000,10.120000),(10,3,35.678100,10.096330),
(11,1,36.808056,10.097222),(11,2,36.810000,10.140000),(11,3,36.806496,10.181532),
(12,1,36.866536,10.164724),(12,2,36.650000,10.450000),(12,3,36.451289,10.735660),
(13,1,36.806496,10.181532),(13,2,36.600000,10.420000),(13,3,36.400000,10.616670),
(14,1,34.740560,10.760280),(14,2,35.100000,10.900000),(14,3,35.504720,11.062220),
(15,1,33.881460,10.098200),(15,2,33.650000,10.300000),(15,3,33.354950,10.505480),
(16,1,36.806496,10.181532),(16,2,36.760000,9.700000),(16,3,36.725640,9.181690),
(17,1,35.678100,10.096330),(17,2,35.780000,10.350000),(17,3,35.825390,10.636990),
(18,1,35.777990,10.826170),(18,2,35.650000,10.950000),(18,3,35.504720,11.062220),
(19,1,34.740560,10.760280),(19,2,34.100000,10.600000),(19,3,33.354950,10.505480),
(20,1,32.929670,10.451770),(20,2,33.450000,10.300000),(20,3,33.881460,10.098200),
(21,1,36.806496,10.181532),(21,2,36.600000,10.150000),(21,3,36.402910,10.142920),
(22,1,37.274420,9.873910),(22,2,36.900000,10.200000),(22,3,36.451289,10.735660),
(23,1,36.866536,10.164724),(23,2,36.350000,10.400000),(23,3,35.825390,10.636990),
(24,1,34.740560,10.760280),(24,2,35.250000,10.400000),(24,3,35.678100,10.096330),
(25,1,33.881460,10.098200),(25,2,33.600000,10.250000),(25,3,33.354950,10.505480),
(26,1,36.174240,8.704860),(26,2,36.450000,9.400000),(26,3,36.806496,10.181532),
(27,1,36.501140,8.780240),(27,2,36.620000,8.980000),(27,3,36.725640,9.181690),
(28,1,35.825390,10.636990),(28,2,35.720000,10.350000),(28,3,35.678100,10.096330),
(29,1,33.919680,8.133520),(29,2,34.150000,8.400000),(29,3,34.425000,8.784170),
(30,1,33.704390,8.969030),(30,2,33.760000,9.500000),(30,3,33.881460,10.098200);
