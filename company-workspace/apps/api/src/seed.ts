#!/usr/bin/env ts-node

/**
 * Standalone Database Seeding Script
 *
 * This script can be run manually to seed the database with initial data.
 *
 * Usage:
 *   npm run seed          - Run seed script
 *   npm run seed:force    - Force re-seed (drop and recreate data)
 *
 * The seed process is also automatically run when the server starts
 * unless AUTO_SEED=false is set in environment variables.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SeedService } from './app/seed.service';
import { Logger } from '@nestjs/common';

async function seed() {
  const logger = new Logger('SeedScript');

  logger.log('🌱 Initializing database seeding script...');

  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get the seed service
    const seedService = app.get(SeedService);

    // Check if force mode is enabled
    const isForceMode = process.argv.includes('--force');

    if (isForceMode) {
      logger.warn('⚠️  Force mode enabled - this will overwrite existing data');
    }

    // Run the seed
    await seedService.seedDatabase();

    logger.log('✅ Seeding completed successfully!');

    // Close the application context
    await app.close();

    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed function
seed();
