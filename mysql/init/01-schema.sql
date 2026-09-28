-- Explicit UTF-8 Encoding Setup
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Database Initialization for Recipe Sharing Website
CREATE DATABASE IF NOT EXISTS `recipe_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `recipe_db`;

ALTER DATABASE `recipe_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1. Categories Table (Danh mục món ăn)
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `recipe_ingredients`;
DROP TABLE IF EXISTS `recipes`;
DROP TABLE IF EXISTS `ingredients`;
DROP TABLE IF EXISTS `categories`;

CREATE TABLE `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `icon` VARCHAR(50) DEFAULT 'utensils',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Ingredients Table (Nguyên liệu)
CREATE TABLE `ingredients` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `icon` VARCHAR(50) DEFAULT 'carrot',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Recipes Table (Công thức món ăn)
CREATE TABLE `recipes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(200) NOT NULL,
    `category_id` INT NOT NULL,
    `description` TEXT NULL,
    `prep_time` INT DEFAULT 15 COMMENT 'Thời gian chuẩn bị (phút)',
    `cook_time` INT DEFAULT 30 COMMENT 'Thời gian nấu (phút)',
    `servings` INT DEFAULT 2 COMMENT 'Khẩu phần (người)',
    `calories` INT DEFAULT 350 COMMENT 'Lượng Calo (kcal)',
    `difficulty` VARCHAR(50) DEFAULT 'Trung bình',
    `image_url` VARCHAR(500) NULL,
    `instructions` LONGTEXT NOT NULL COMMENT 'Các bước thực hiện',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Recipe Ingredients Junction Table (Nguyên liệu theo công thức)
CREATE TABLE `recipe_ingredients` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `recipe_id` INT NOT NULL,
    `ingredient_id` INT NOT NULL,
    `quantity` VARCHAR(50) NOT NULL,
    `unit` VARCHAR(50) NULL,
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Reviews Table (Đánh giá & Bình luận)
CREATE TABLE `reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `recipe_id` INT NOT NULL,
    `author` VARCHAR(100) NOT NULL,
    `rating` TINYINT NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
    `comment` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Seed Data for Categories
INSERT INTO `categories` (`id`, `name`, `description`, `icon`) VALUES
(1, 'Món Á', 'Các món ăn đậm đà bản sắc truyền thống Châu Á', 'bowl-rice'),
(2, 'Món Âu', 'Phong cách ẩm thực tinh tế và hiện đại Phương Tây', 'pizza-slice'),
(3, 'Món Tráng Miệng', 'Những món bánh ngọt và chè thanh mát tuyệt vời', 'cookie-bite'),
(4, 'Đồ Uống', 'Nước ép, sinh tố, cà phê và trà thơm ngon', 'mug-hot'),
(5, 'Món Chay', 'Thực đơn thuần chay thanh tịnh và giàu dinh dưỡng', 'seedling'),
(6, 'Món Ăn Sáng', 'Khởi đầu ngày mới tràn đầy năng lượng', 'egg');

-- Insert Seed Data for Ingredients
INSERT INTO `ingredients` (`id`, `name`, `icon`) VALUES
(1, 'Bánh phở tươi', 'wheat-awn'),
(2, 'Thịt bò tái/nạm', 'drumstick-bite'),
(3, 'Xương ống bò', 'bone'),
(4, 'Hành tây & Hành lá', 'leaf'),
(5, 'Gừng & Quế, Hồi', 'pepper-hot'),
(6, 'Thịt ba chỉ heo', 'bacon'),
(7, 'Bún tươi', 'bowl-rice'),
(8, 'Nước mắm truyền thống', 'bottle-droplet'),
(9, 'Bột mì', 'wheat-awn'),
(10, 'Phô mai Mozzarella', 'cheese'),
(11, 'Cà chua chín', 'apple-whole'),
(12, 'Cá hồi tươi', 'fish'),
(13, 'Rau xà lách & Bơ', 'lemon'),
(14, 'Bột Matcha Nhật', 'leaf'),
(15, 'Sữa tươi không đường', 'glass-water'),
(16, 'Trứng gà', 'egg');

-- Insert Seed Data for Recipes
INSERT INTO `recipes` (`id`, `title`, `category_id`, `description`, `prep_time`, `cook_time`, `servings`, `calories`, `difficulty`, `image_url`, `instructions`) VALUES
(1, 'Phở Bò Truyền Thống Hà Nội', 1, 'Món phở bò với nước dùng trong ngọt đậm đà từ xương ống ninh kỹ cùng quế, hồi, thảo quả và thịt bò tươi ngon.', 30, 180, 4, 480, 'Trung bình', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80', 
'Bước 1: Sơ chế xương ống bò, chần qua nước sôi 5 phút rồi rửa sạch.\nBước 2: Nướng gừng, hành tây, quế, hồi, thảo quả cho thơm rồi nêm vào nồi ninh xương trong 3-4 tiếng.\nBước 3: Chần bánh phở qua nước sôi, xếp vào tô.\nBước 4: Thêm thịt bò thái mỏng, rắc hành lá và chan nước dùng thật nóng lên trên.\nBước 5: Thưởng thức cùng chanh, ớt và quẩy nóng!'),

(2, 'Bún Chả Hà Nội Đậm Đà', 1, 'Thịt ba chỉ nướng than hoa thơm lừng ăn kèm bún tươi, nước mắm đu đủ chua ngọt và rau sống thanh mát.', 25, 40, 3, 520, 'Trung bình', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
'Bước 1: Thái thịt ba chỉ mỏng vừa ăn. Ướp với hành tóm băm, nước mắm, mật ong, dầu hàu và tiêu trong 1 tiếng.\nBước 2: Nặn chả viên và chuẩn bị chả miếng, nướng trên bếp than hoa cho vàng xém hai mặt.\nBước 3: Pha nước mắm chua ngọt gồm nước ấm, đường, giấm, nước mắm và tỏi ớt băm.\nBước 4: Thêm đu đủ, cà rốt ngâm chua vào bát nước chấm.\nBước 5: Dọn bún, rau sống và thịt nướng ra đĩa và thưởng thức.'),

(3, 'Pizza Margherita Chuẩn Ý', 2, 'Món Pizza kinh điển với đế bánh giòn rụm, sốt cà chua tươi, phô mai Mozzarella dẻo thơm và lá húng tây Basil.', 20, 15, 2, 650, 'Dễ', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
'Bước 1: Nhào bột mì với men nở, nước ấm và ít muối, ủ bột 1 tiếng cho nở gấp đôi.\nBước 2: Cán mỏng đế bánh pizza.\nBước 3: Phết đều sốt cà chua lên mặt bánh, rắc phô mai Mozzarella bào sợi.\nBước 4: Nướng bánh trong lò ở 230 độ C trong 12-15 phút đến khi phô mai chảy vàng thum phức.\nBước 5: Trang trí lá húng tây Basil tươi lên trên và dùng nóng.'),

(4, 'Salad Cá Hồi Sốt Chanh Dây', 5, 'Món salad thanh nhẹ kết hợp giữa cá hồi áp chảo, quả bơ béo ngậy, rau xà lách giòn rụm và sốt chanh dây chua ngọt.', 15, 10, 2, 320, 'Dễ', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
'Bước 1: Rửa sạch cá hồi, thấm khô, ướp chút muối và tiêu.\nBước 2: Áp chảo cá hồi mỗi mặt 3 phút cho chín tới, da giòn ngon.\nBước 3: Rửa sạch rau xà lách, cắt bơ vừa ăn.\nBước 4: Pha sốt chanh dây với mật ong, dầu olive và ít muối.\nBước 5: Xếp rau, bơ, cá hồi ra đĩa và rưới sốt chanh dây lên trên.'),

(5, 'Matcha Latte Đá Xay', 4, 'Đồ uống chuẩn phong cách Nhật Bản thơm béo vị sữa tươi quyện cùng hương trà xanh Matcha thanh ngát.', 5, 5, 1, 180, 'Dễ', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
'Bước 1: Hòa tan 3g bột Matcha Nhật với 30ml nước ấm 80 độ C, dùng chổi Chasen đánh tan.\nBước 2: Cho đá viên và sữa tươi vào ly.\nBước 3: Rót từ từ matcha lên trên để tạo tầng 2 màu đẹp mắt.\nBước 4: Khuấy đều và thưởng thức hương vị thanh mát!'),

(6, 'Chè Bưởi An Giang', 3, 'Chè bưởi giòn sần sật béo ngậy nước cốt dừa.', 20, 45, 4, 280, 'Dễ', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
'Bước 1: Sơ chế cùi bưởi với muối.\nBước 2: Luộc cùi bưởi và sên đường.\nBước 3: Nấu nước cốt dừa và thưởng thức.');

-- Insert Recipe Ingredients Mapping
INSERT INTO `recipe_ingredients` (`recipe_id`, `ingredient_id`, `quantity`, `unit`) VALUES
(1, 1, '500', 'g'),
(1, 2, '300', 'g'),
(1, 3, '1', 'kg'),
(1, 4, '2', 'củ'),
(1, 5, '10', 'g'),
(2, 6, '500', 'g'),
(2, 7, '400', 'g'),
(2, 8, '3', 'muỗng canh'),
(3, 9, '250', 'g'),
(3, 10, '150', 'g'),
(3, 11, '2', 'quả'),
(4, 12, '200', 'g'),
(4, 13, '150', 'g'),
(5, 14, '5', 'g'),
(5, 15, '180', 'ml');

-- Insert Seed Reviews
INSERT INTO `reviews` (`recipe_id`, `author`, `rating`, `comment`) VALUES
(1, 'Đầu bếp Minh', 5, 'Công thức nước dùng rất chuẩn vị Hà Nội, ngọt đậm từ xương!'),
(1, 'Thanh Hằng', 5, 'Món phở tuyệt vời, cả nhà mình ai cũng khen ngon.'),
(2, 'Quang Anh', 5, 'Thịt ướp rất vừa miệng, nướng lên thơm lừng.'),
(3, 'Chef Alex', 4, 'Bánh giòn đế ngon, sốt cà chua mọng nước!'),
(4, 'Bích Phương', 5, 'Món salad healthy tuyệt vời cho chế độ ăn giữ dáng.');
