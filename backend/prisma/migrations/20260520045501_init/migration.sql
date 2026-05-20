-- CreateTable
CREATE TABLE `hospitals` (
    `id` VARCHAR(191) NOT NULL,
    `open_api_id` VARCHAR(20) NULL,
    `name` VARCHAR(100) NOT NULL,
    `address` TEXT NOT NULL,
    `lat` DECIMAL(10, 7) NOT NULL,
    `lng` DECIMAL(10, 7) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `hospital_level` ENUM('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'NIGHT_CARE') NOT NULL,
    `is_pediatric_specialized` BOOLEAN NOT NULL DEFAULT false,
    `is_moonlight_hospital` BOOLEAN NOT NULL DEFAULT false,
    `is_open_24h` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hospitals_open_api_id_key`(`open_api_id`),
    INDEX `hospitals_lat_lng_idx`(`lat`, `lng`),
    INDEX `hospitals_is_pediatric_specialized_idx`(`is_pediatric_specialized`),
    INDEX `hospitals_is_moonlight_hospital_idx`(`is_moonlight_hospital`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hospital_realtime_status` (
    `id` VARCHAR(191) NOT NULL,
    `hospital_id` VARCHAR(191) NOT NULL,
    `adult_beds_total` INTEGER NOT NULL DEFAULT 0,
    `adult_beds_available` INTEGER NOT NULL DEFAULT 0,
    `pediatric_beds_total` INTEGER NOT NULL DEFAULT 0,
    `pediatric_beds_available` INTEGER NOT NULL DEFAULT 0,
    `isolation_beds_total` INTEGER NOT NULL DEFAULT 0,
    `isolation_beds_available` INTEGER NOT NULL DEFAULT 0,
    `pediatric_specialist_on_duty` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hospital_realtime_status_hospital_id_key`(`hospital_id`),
    INDEX `hospital_realtime_status_updated_at_idx`(`updated_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hospital_equipment` (
    `id` VARCHAR(191) NOT NULL,
    `hospital_id` VARCHAR(191) NOT NULL,
    `equipment` ENUM('CT', 'MRI', 'ANGIO', 'VENTILATOR', 'ECMO', 'DEFIBRILLATOR') NOT NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT true,
    `note` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hospital_equipment_hospital_id_equipment_key`(`hospital_id`, `equipment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hospital_alerts` (
    `id` VARCHAR(191) NOT NULL,
    `hospital_id` VARCHAR(191) NOT NULL,
    `alert_type` VARCHAR(60) NOT NULL,
    `message` TEXT NOT NULL,
    `severity` ENUM('WARNING', 'CRITICAL') NOT NULL DEFAULT 'WARNING',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NULL,

    INDEX `hospital_alerts_hospital_id_is_active_idx`(`hospital_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_device_id_key`(`device_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `hospital_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorites_user_id_idx`(`user_id`),
    UNIQUE INDEX `favorites_user_id_hospital_id_key`(`user_id`, `hospital_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `golden_time_categories` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(60) NOT NULL,
    `icon_name` VARCHAR(60) NULL,
    `color_hex` CHAR(7) NULL,
    `animation_file` VARCHAR(120) NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `golden_time_categories_title_key`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `golden_time_steps` (
    `id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NOT NULL,
    `step_number` INTEGER NOT NULL,
    `summary_text` TEXT NOT NULL,
    `detail_text` TEXT NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `golden_time_steps_category_id_display_order_idx`(`category_id`, `display_order`),
    UNIQUE INDEX `golden_time_steps_category_id_step_number_key`(`category_id`, `step_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hospital_reports` (
    `id` VARCHAR(191) NOT NULL,
    `hospital_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `report_type` ENUM('WAIT_TIME', 'PEDIATRIC_CLOSED', 'CAPACITY_FULL', 'EQUIPMENT_DOWN', 'OTHER') NOT NULL,
    `wait_minutes` INTEGER NULL,
    `message` VARCHAR(200) NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `hospital_reports_hospital_id_created_at_idx`(`hospital_id`, `created_at` DESC),
    INDEX `hospital_reports_hospital_id_report_type_created_at_idx`(`hospital_id`, `report_type`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `hospital_realtime_status` ADD CONSTRAINT `hospital_realtime_status_hospital_id_fkey` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hospital_equipment` ADD CONSTRAINT `hospital_equipment_hospital_id_fkey` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hospital_alerts` ADD CONSTRAINT `hospital_alerts_hospital_id_fkey` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_hospital_id_fkey` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `golden_time_steps` ADD CONSTRAINT `golden_time_steps_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `golden_time_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hospital_reports` ADD CONSTRAINT `hospital_reports_hospital_id_fkey` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hospital_reports` ADD CONSTRAINT `hospital_reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
