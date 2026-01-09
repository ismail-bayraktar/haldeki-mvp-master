-- Phase 11: Warehouse MVP - Enum Extension
-- Date: 2025-01-09
-- Purpose: Add warehouse_manager to app_role enum (separate migration to avoid transaction issues)

-- Add warehouse_manager to the enum type
ALTER TYPE app_role
ADD VALUE IF NOT EXISTS 'warehouse_manager';
