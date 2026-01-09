/**
 * Phase 12: Product Variations Types
 *
 * Defines types for structured product variations.
 * Variations are normalized and shared across suppliers.
 */

import type { ProductVariationType } from './multiSupplier';

// ============================================================================
// CORE VARIATION TYPES
// ============================================================================

/**
 * Individual variation value
 *
 * Represents a single variation option (e.g., "4 LT", "BEYAZ")
 */
export interface VariationValue {
  value: string;
  display_order: number;
  metadata: Record<string, unknown> | null;
}

/**
 * Variation attribute with all values
 *
 * Groups variation values by type (e.g., all size options)
 */
export interface VariationAttribute {
  type: ProductVariationType;
  values: VariationValue[];
}

/**
 * Extracted variation from raw string
 *
 * Used when parsing variation strings from product names
 */
export interface ExtractedVariation {
  type: ProductVariationType;
  value: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// VARIATION EXTRACTION TYPES
// ============================================================================

/**
 * Variation pattern for extraction
 *
 * Defines regex patterns to identify variations in text
 */
export interface VariationPattern {
  type: ProductVariationType;
  patterns: RegExp[];
  extractValue: (match: RegExpMatchArray) => string;
  metadata?: (match: RegExpMatchArray) => Record<string, unknown>;
}

/**
 * Variation extraction result
 *
 * Result of parsing product name/description for variations
 */
export interface VariationExtractionResult {
  variations: ExtractedVariation[];
  remaining_text: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Variation combination
 *
 * Represents a specific combination of variations
 * (e.g., "4 LT" + "BEYAZ" + "LAVANTA")
 */
export interface VariationCombination {
  variations: Array<{
    type: ProductVariationType;
    value: string;
  }>;
  display_name: string;
  sku_suffix?: string;
}

// ============================================================================
// VARIATION SELECTION TYPES
// ============================================================================

/**
 * Selected variation state
 *
 * Tracks user's variation selection in UI
 */
export interface SelectedVariations {
  [variationType: string]: string | undefined;
}

/**
 * Variation selection context
 *
 * Provides context for variation selection UI
 */
export interface VariationSelectionContext {
  available_variations: VariationAttribute[];
  selected: SelectedVariations;
  invalid_combinations?: VariationCombination[];
  on_select: (type: ProductVariationType, value: string) => void;
}

/**
 * Variation availability
 *
 * Tracks which variation combinations are available
 */
export interface VariationAvailability {
  combination_key: string;
  is_available: boolean;
  stock_quantity: number;
  supplier_ids: string[];
}

// ============================================================================
// VARIATION DISPLAY TYPES
// ============================================================================

/**
 * Variation display configuration
 *
 * Controls how variations are displayed in UI
 */
export interface VariationDisplayConfig {
  show_images?: boolean;
  show_swatches?: boolean;
  show_stock?: boolean;
  max_visible?: number;
  display_mode: 'dropdown' | 'buttons' | 'swatches' | 'chips';
}

/**
 * Variation option for UI display
 *
 * Enriched variation value with display metadata
 */
export interface VariationDisplayOption extends VariationValue {
  label: string;
  disabled?: boolean;
  image_url?: string;
  color_code?: string;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

// ============================================================================
// VARIATION VALIDATION TYPES
// ============================================================================

/**
 * Variation validation rule
 *
 * Defines constraints for variation values
 */
export interface VariationValidationRule {
  type: ProductVariationType;
  required?: boolean;
  allowed_values?: string[];
  min_length?: number;
  max_length?: number;
  pattern?: RegExp;
}

/**
 * Variation validation result
 *
 * Result of validating variation input
 */
export interface VariationValidationResult {
  is_valid: boolean;
  errors: Array<{
    type: ProductVariationType;
    message: string;
  }>;
  warnings: Array<{
    type: ProductVariationType;
    message: string;
  }>;
}

// ============================================================================
// VARIATION IMPORT/EXPORT TYPES
// ============================================================================

/**
 * Variation import row
 *
 * Variation data from import file
 */
export interface VariationImportRow {
  product_name: string;
  variation_type: ProductVariationType;
  variation_value: string;
  display_order?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Variation export format
 *
 * Structured format for exporting variations
 */
export interface VariationExportData {
  product_id: string;
  product_name: string;
  variations: Array<{
    type: ProductVariationType;
    value: string;
    display_order: number;
    metadata: Record<string, unknown> | null;
  }>;
}
