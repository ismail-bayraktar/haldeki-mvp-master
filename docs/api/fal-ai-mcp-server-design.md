# fal.ai MCP Server Design Document

## Executive Summary

This document outlines the design for a Model Context Protocol (MCP) server that integrates fal.ai image generation capabilities. The server will enable AI assistants (like Claude) to generate, batch process, and manage AI-generated images through standardized MCP tools.

**Version:** 1.0
**Status:** Design Phase
**Last Updated:** 2026-01-04

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Package Structure](#package-structure)
4. [Tool Specifications](#tool-specifications)
5. [TypeScript Types](#typescript-types)
6. [Configuration Management](#configuration-management)
7. [Error Handling](#error-handling)
8. [Cost Optimization](#cost-optimization)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Deployment](#deployment)

---

## Overview

### Purpose

The fal.ai MCP server provides a standardized interface for AI image generation using the Model Context Protocol. It enables:

- Text-to-image generation with multiple model options
- Batch generation for parallel processing
- Cost optimization through model selection and quality tiers
- Async result polling for long-running generations
- Aspect ratio and dimension presets

### Key Features

1. **Multi-Model Support**: FLUX.1-schnell, FLUX.1-dev, SDXL-lightning, Stable Diffusion
2. **Cost Optimization**: Fast/standard/high quality tiers with transparent pricing
3. **Batch Processing**: Generate multiple images in parallel
4. **Async Operations**: Poll-based result retrieval for long generations
5. **Flexible Configuration**: Environment-based configuration with defaults

### Technology Stack

- **Runtime**: Node.js 18+ / Deno compatibility
- **Language**: TypeScript 5.8+
- **Protocol**: Model Context Protocol (MCP) SDK
- **HTTP Client**: fetch API (native) or axios
- **Validation**: Zod (already in project dependencies)
- **Environment**: dotenv for configuration

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Assistant (Claude)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ MCP Protocol
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server (fal-ai)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Tool Handler Layer                       │   │
│  │  • generate_image                                     │   │
│  │  • batch_generate                                     │   │
│  │  • list_models                                        │   │
│  └───────────────────┬──────────────────────────────────┘   │
│                      │                                       │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │              Business Logic Layer                    │   │
│  │  • Request validation                                │   │
│  │  • Model selection                                   │   │
│  │  • Cost calculation                                  │   │
│  │  • Async polling                                     │   │
│  └───────────────────┬──────────────────────────────────┘   │
│                      │                                       │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │              fal.ai Client Layer                     │   │
│  │  • HTTP requests                                     │   │
│  │  • Response parsing                                  │   │
│  │  • Error handling                                    │   │
│  └───────────────────┬──────────────────────────────────┘   │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      fal.ai API                              │
│  • FLUX.1-schnell    • FLUX.1-dev                           │
│  • SDXL-lightning    • Stable Diffusion                     │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
1. AI Assistant → MCP Tool Call
   ↓
2. MCP Server: Validate Request (Zod schemas)
   ↓
3. Business Logic: Calculate cost, select model
   ↓
4. fal.ai Client: Submit generation request
   ↓
5. Async Polling: Check status (if async model)
   ↓
6. Result Processing: Format response
   ↓
7. MCP Server: Return result to AI Assistant
```

---

## Package Structure

### Directory Layout

```
mcp-fal-ai/
├── package.json
├── tsconfig.json
├── README.md
├── .env.example
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── server.ts                # MCP server configuration
│   ├── tools/                   # Tool implementations
│   │   ├── index.ts
│   │   ├── generate-image.ts
│   │   ├── batch-generate.ts
│   │   └── list-models.ts
│   ├── lib/                     # Core library code
│   │   ├── fal-client.ts        # fal.ai API client
│   │   ├── model-registry.ts    # Available models & pricing
│   │   ├── poller.ts            # Async result polling
│   │   └── cost-calculator.ts   # Cost estimation
│   ├── config/                  # Configuration
│   │   ├── index.ts
│   │   ├── models.ts            # Model configurations
│   │   └── presets.ts           # Aspect ratio presets
│   ├── types/                   # TypeScript types
│   │   ├── index.ts
│   │   ├── fal-api.ts           # fal.ai API types
│   │   ├── mcp.ts               # MCP protocol types
│   │   └── models.ts            # Model types
│   ├── utils/                   # Utilities
│   │   ├── validation.ts        # Zod schemas
│   │   ├── errors.ts            # Error classes
│   │   ├── logger.ts            # Logging utility
│   │   └── format.ts            # Response formatting
│   └── constants/               # Constants
│       ├── models.ts
│       ├── quality-tiers.ts
│       └── endpoints.ts
├── tests/                       # Test files
│   ├── unit/
│   │   ├── fal-client.test.ts
│   │   ├── cost-calculator.test.ts
│   │   └── validation.test.ts
│   ├── integration/
│   │   └── tools.test.ts
│   └── setup.ts
└── docs/
    ├── API.md                   # API documentation
    ├── MODELS.md                # Model catalog
    └── DEPLOYMENT.md            # Deployment guide
```

### Package.json Structure

```json
{
  "name": "@haldeki/mcp-fal-ai",
  "version": "1.0.0",
  "description": "MCP server for fal.ai image generation",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "mcp-fal-ai": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.8.0",
    "vitest": "^4.0.0",
    "eslint": "^9.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## Tool Specifications

### Tool 1: generate_image

**Purpose**: Generate a single image from text prompt using fal.ai models.

**Input Schema** (MCP Tool Schema):

```typescript
{
  name: "generate_image",
  description: "Generate an image from text prompt using fal.ai",
  inputSchema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Text description of the image to generate",
        minLength: 10,
        maxLength: 1000
      },
      model: {
        type: "string",
        description: "Model to use for generation",
        enum: ["flux-schnell", "flux-dev", "sdxl-lightning", "sd-3", "stable-diffusion"],
        default: "flux-schnell"
      },
      quality_tier: {
        type: "string",
        description: "Quality/performance tier",
        enum: ["fast", "standard", "high"],
        default: "fast"
      },
      aspect_ratio: {
        type: "string",
        description: "Predefined aspect ratio",
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "9:21"],
        default: "1:1"
      },
      width: {
        type: "number",
        description: "Custom width (overrides aspect_ratio if both provided)",
        minimum: 256,
        maximum: 2048,
        multipleOf: 64
      },
      height: {
        type: "number",
        description: "Custom height (overrides aspect_ratio if both provided)",
        minimum: 256,
        maximum: 2048,
        multipleOf: 64
      },
      num_inference_steps: {
        type: "number",
        description: "Number of denoising steps (higher = better quality but slower)",
        minimum: 1,
        maximum: 50,
        default: 4
      },
      seed: {
        type: "number",
        description: "Random seed for reproducibility (optional)",
        minimum: 0,
        maximum: 2147483647
      },
      enable_safety_checker: {
        type: "boolean",
        description: "Enable content safety filtering",
        default: true
      },
      sync_mode: {
        type: "boolean",
        description: "Use sync mode for faster results (may cost more)",
        default: false
      }
    },
    required: ["prompt"]
  }
}
```

**Output Schema**:

```typescript
{
  type: "object",
  properties: {
    success: {
      type: "boolean",
      description: "Whether generation succeeded"
    },
    image_url: {
      type: "string",
      description: "URL to generated image"
    },
    image_data: {
      type: "string",
      description: "Base64 encoded image data (optional)"
    },
    width: {
      type: "number",
      description: "Image width in pixels"
    },
    height: {
      type: "number",
      description: "Image height in pixels"
    },
    model: {
      type: "string",
      description: "Model used for generation"
    },
    generation_time: {
      type: "number",
      description: "Time taken in seconds"
    },
    cost_usd: {
      type: "number",
      description: "Estimated cost in USD"
    },
    request_id: {
      type: "string",
      description: "Unique request identifier"
    }
  }
}
```

**Example Usage**:

```json
{
  "prompt": "A serene mountain landscape at sunset with a lake reflection",
  "model": "flux-schnell",
  "quality_tier": "fast",
  "aspect_ratio": "16:9",
  "num_inference_steps": 4
}
```

---

### Tool 2: batch_generate

**Purpose**: Generate multiple images in parallel with batch optimization.

**Input Schema**:

```typescript
{
  name: "batch_generate",
  description: "Generate multiple images in parallel with cost optimization",
  inputSchema: {
    type: "object",
    properties: {
      prompts: {
        type: "array",
        description: "Array of text prompts for image generation",
        items: {
          type: "string",
          minLength: 10,
          maxLength: 1000
        },
        minItems: 2,
        maxItems: 10
      },
      model: {
        type: "string",
        description: "Model to use for all generations",
        enum: ["flux-schnell", "flux-dev", "sdxl-lightning", "sd-3", "stable-diffusion"],
        default: "flux-schnell"
      },
      quality_tier: {
        type: "string",
        enum: ["fast", "standard", "high"],
        default: "fast"
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "9:21"],
        default: "1:1"
      },
      max_concurrent: {
        type: "number",
        description: "Maximum concurrent requests",
        minimum: 1,
        maximum: 5,
        default: 3
      },
      timeout_seconds: {
        type: "number",
        description: "Maximum time to wait for all generations",
        minimum: 30,
        maximum: 300,
        default: 120
      },
      enable_safety_checker: {
        type: "boolean",
        default: true
      },
      aggregate_cost: {
        type: "boolean",
        description: "Return total cost estimate",
        default: true
      }
    },
    required: ["prompts"]
  }
}
```

**Output Schema**:

```typescript
{
  type: "object",
  properties: {
    success: {
      type: "boolean"
    },
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: {
            type: "number",
            description: "Index in original prompts array"
          },
          prompt: {
            type: "string"
          },
          success: {
            type: "boolean"
          },
          image_url: {
            type: "string"
          },
          error: {
            type: "string",
            description: "Error message if generation failed"
          },
          generation_time: {
            type: "number"
          }
        }
      }
    },
    total_cost_usd: {
      type: "number",
      description: "Total cost for all generations"
    },
    total_time_seconds: {
      type: "number",
      description: "Total time for batch completion"
    },
    success_count: {
      type: "number",
      description: "Number of successful generations"
    },
    failure_count: {
      type: "number",
      description: "Number of failed generations"
    }
  }
}
```

**Example Usage**:

```json
{
  "prompts": [
    "A futuristic cityscape at night",
    "A cozy cabin in snowy mountains",
    "An underwater coral reef scene"
  ],
  "model": "flux-schnell",
  "quality_tier": "fast",
  "aspect_ratio": "16:9",
  "max_concurrent": 3
}
```

---

### Tool 3: list_models

**Purpose**: List available fal.ai models with pricing information.

**Input Schema**:

```typescript
{
  name: "list_models",
  description: "List available fal.ai image generation models with pricing",
  inputSchema: {
    type: "object",
    properties: {
      filter_type: {
        type: "string",
        description: "Filter models by type",
        enum: ["all", "text-to-image", "image-to-image", "fast", "quality"],
        default: "all"
      },
      include_pricing: {
        type: "boolean",
        description: "Include pricing information",
        default: true
      },
      include_specs: {
        type: "boolean",
        description: "Include technical specifications",
        default: true
      }
    }
  }
}
```

**Output Schema**:

```typescript
{
  type: "object",
  properties: {
    models: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Model identifier"
          },
          name: {
            type: "string",
            description: "Human-readable model name"
          },
          type: {
            type: "string",
            enum: ["text-to-image", "image-to-image"]
          },
          description: {
            type: "string",
            description: "Model description"
          },
          pricing: {
            type: "object",
            properties: {
              cost_per_image_usd: {
                type: "number"
              },
              cost_per_1000_images_usd: {
                type: "number"
              },
              tier: {
                type: "string",
                enum: ["fast", "standard", "high"]
              }
            }
          },
          specs: {
            type: "object",
            properties: {
              max_resolution: {
                type: "string"
              },
              avg_generation_time: {
                type: "string"
              },
              quality_rating: {
                type: "number",
                minimum: 1,
                maximum: 10
              },
              features: {
                type: "array",
                items: {
                  type: "string"
                }
              }
            }
          },
          recommended_uses: {
            type: "array",
            items: {
              type: "string"
            }
          }
        }
      }
    },
    total_count: {
      type: "number"
    },
      filter_type: {
      type: "string"
    }
  }
}
```

---

## TypeScript Types

### Core Types

```typescript
// src/types/index.ts
export * from './fal-api';
export * from './mcp';
export * from './models';
```

### fal.ai API Types

```typescript
// src/types/fal-api.ts

/**
 * fal.ai model identifiers
 */
export type FalModelId =
  | 'flux-schnell'
  | 'flux-dev'
  | 'flux-pro'
  | 'sdxl-lightning'
  | 'sd-3'
  | 'stable-diffusion'
  | 'playground-v2-5';

/**
 * Quality tiers affecting performance and cost
 */
export type QualityTier = 'fast' | 'standard' | 'high';

/**
 * Aspect ratio presets
 */
export type AspectRatio =
  | '1:1'
  | '16:9'
  | '9:16'
  | '4:3'
  | '3:4'
  | '21:9'
  | '9:21';

/**
 * Image generation request payload
 */
export interface FalGenerateRequest {
  prompt: string;
  model_id: FalModelId;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  seed?: number;
  enable_safety_checker?: boolean;
  sync_mode?: boolean;
}

/**
 * fal.ai API response structure
 */
export interface FalGenerateResponse {
  images: FalImage[];
  request_id: string;
  model_id: string;
  timing?: FalTiming;
}

/**
 * Generated image information
 */
export interface FalImage {
  url: string;
  width: number;
  height: number;
  content_type?: string;
}

/**
 * Timing information from fal.ai
 */
export interface FalTiming {
  generation_time: number;
  queue_time: number;
  total_time: number;
}

/**
 * Async request submission response
 */
export interface FalAsyncRequest {
  request_id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  status_url: string;
}

/**
 * Status check response
 */
export interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  request_id: string;
  response?: FalGenerateResponse;
  error?: FalError;
}

/**
 * Error response from fal.ai
 */
export interface FalError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
```

### MCP Types

```typescript
// src/types/mcp.ts

/**
 * MCP tool definition
 */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * MCP tool call context
 */
export interface McpContext {
  requestId?: string;
  timestamp: number;
  userId?: string;
}

/**
 * MCP tool response
 */
export interface McpToolResponse<T = unknown> {
  content: T;
  isError?: boolean;
  metadata?: {
    requestId: string;
    duration: number;
    cost?: number;
  };
}

/**
 * MCP server configuration
 */
export interface McpServerConfig {
  name: string;
  version: string;
  tools: McpTool[];
  capabilities: {
    streaming?: boolean;
    progress?: boolean;
  };
}
```

### Model Types

```typescript
// src/types/models.ts

import { FalModelId, QualityTier } from './fal-api';

/**
 * Model configuration
 */
export interface ModelConfig {
  id: FalModelId;
  name: string;
  type: 'text-to-image' | 'image-to-image';
  description: string;
  pricing: ModelPricing;
  specs: ModelSpecs;
  supported_aspect_ratios: string[];
  recommended_uses: string[];
}

/**
 * Model pricing information
 */
export interface ModelPricing {
  cost_per_image_usd: number;
  cost_per_1000_images_usd: number;
  tier: QualityTier;
  currency: 'USD';
}

/**
 * Model technical specifications
 */
export interface ModelSpecs {
  max_resolution: string;
  avg_generation_time: string;
  quality_rating: number; // 1-10
  features: string[];
  requires_sync: boolean;
  max_steps: number;
  default_steps: number;
}

/**
 * Aspect ratio dimensions
 */
export interface AspectRatioDimensions {
  width: number;
  height: number;
}

/**
 * Generation options
 */
export interface GenerationOptions {
  model: FalModelId;
  quality_tier: QualityTier;
  aspect_ratio?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  seed?: number;
  enable_safety_checker?: boolean;
  sync_mode?: boolean;
}

/**
 * Batch generation options
 */
export interface BatchGenerationOptions extends GenerationOptions {
  max_concurrent?: number;
  timeout_seconds?: number;
  aggregate_cost?: boolean;
}

/**
 * Generation result
 */
export interface GenerationResult {
  success: boolean;
  image_url?: string;
  width?: number;
  height?: number;
  model: FalModelId;
  generation_time: number;
  cost_usd: number;
  request_id: string;
  error?: string;
}

/**
 * Batch generation result
 */
export interface BatchGenerationResult {
  success: boolean;
  results: Array<{
    index: number;
    prompt: string;
    success: boolean;
    image_url?: string;
    error?: string;
    generation_time: number;
  }>;
  total_cost_usd: number;
  total_time_seconds: number;
  success_count: number;
  failure_count: number;
}
```

---

## Configuration Management

### Environment Variables

```bash
# .env.example

# Required: fal.ai API key
FAL_AI_API_KEY=your_api_key_here

# Optional: Default model selection
FAL_AI_DEFAULT_MODEL=flux-schnell

# Optional: Default quality tier
FAL_AI_DEFAULT_QUALITY_TIER=fast

# Optional: API timeout (seconds)
FAL_API_TIMEOUT=120

# Optional: Max concurrent requests for batch operations
FAL_MAX_CONCURRENT=3

# Optional: Enable debug logging
FAL_DEBUG=false

# Optional: Custom API endpoint (for testing)
FAL_API_ENDPOINT=https://queue.fal.run
```

### Configuration Loader

```typescript
// src/config/index.ts

import dotenv from 'dotenv';

dotenv.config();

/**
 * Application configuration
 */
export const config = {
  // API credentials
  falApiKey: process.env.FAL_AI_API_KEY || '',

  // Default settings
  defaultModel: (process.env.FAL_AI_DEFAULT_MODEL as any) || 'flux-schnell',
  defaultQualityTier: (process.env.FAL_AI_DEFAULT_QUALITY_TIER as any) || 'fast',

  // API settings
  apiTimeout: parseInt(process.env.FAL_API_TIMEOUT || '120', 10),
  maxConcurrent: parseInt(process.env.FAL_MAX_CONCURRENT || '3', 10),

  // Debug mode
  debug: process.env.FAL_DEBUG === 'true',

  // API endpoint
  apiEndpoint: process.env.FAL_API_ENDPOINT || 'https://queue.fal.run',

  // Validate required config
  validate() {
    if (!this.falApiKey) {
      throw new Error('FAL_AI_API_KEY is required');
    }
    const validModels = ['flux-schnell', 'flux-dev', 'sdxl-lightning', 'sd-3', 'stable-diffusion'];
    if (!validModels.includes(this.defaultModel)) {
      throw new Error(`Invalid default model: ${this.defaultModel}`);
    }
  }
};

// Validate on load
config.validate();
```

### Model Registry

```typescript
// src/config/models.ts

import { ModelConfig } from '../types/models';

/**
 * Available model configurations
 */
export const modelRegistry: Record<string, ModelConfig> = {
  'flux-schnell': {
    id: 'flux-schnell',
    name: 'FLUX.1 Schnell',
    type: 'text-to-image',
    description: 'Fast, open-source text-to-image model with excellent quality',
    pricing: {
      cost_per_image_usd: 0.00025,
      cost_per_1000_images_usd: 0.25,
      tier: 'fast',
      currency: 'USD'
    },
    specs: {
      max_resolution: '1024x1024',
      avg_generation_time: '2-4s',
      quality_rating: 8,
      features: ['fast', 'high-quality', 'open-weights'],
      requires_sync: false,
      max_steps: 4,
      default_steps: 4
    },
    supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    recommended_uses: ['rapid-prototyping', 'bulk-generation', 'preview']
  },
  'flux-dev': {
    id: 'flux-dev',
    name: 'FLUX.1 Dev',
    type: 'text-to-image',
    description: 'Advanced version with better quality and detail',
    pricing: {
      cost_per_image_usd: 0.03,
      cost_per_1000_images_usd: 30,
      tier: 'standard',
      currency: 'USD'
    },
    specs: {
      max_resolution: '1024x1024',
      avg_generation_time: '8-15s',
      quality_rating: 9,
      features: ['high-detail', 'creative', 'non-commercial'],
      requires_sync: false,
      max_steps: 50,
      default_steps: 28
    },
    supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'],
    recommended_uses: ['creative-projects', 'artwork', 'high-quality']
  },
  'sdxl-lightning': {
    id: 'sdxl-lightning',
    name: 'SDXL Lightning',
    type: 'text-to-image',
    description: 'Ultra-fast SDXL variant with distilled inference',
    pricing: {
      cost_per_image_usd: 0.001,
      cost_per_1000_images_usd: 1,
      tier: 'fast',
      currency: 'USD'
    },
    specs: {
      max_resolution: '1024x1024',
      avg_generation_time: '1-2s',
      quality_rating: 7,
      features: ['ultra-fast', 'real-time', 'step-distilled'],
      requires_sync: false,
      max_steps: 8,
      default_steps: 4
    },
    supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    recommended_uses: ['real-time', 'batch-processing', 'quick-previews']
  },
  'sd-3': {
    id: 'sd-3',
    name: 'Stable Diffusion 3',
    type: 'text-to-image',
    description: 'Latest SD3 model with improved prompt adherence',
    pricing: {
      cost_per_image_usd: 0.035,
      cost_per_1000_images_usd: 35,
      tier: 'high',
      currency: 'USD'
    },
    specs: {
      max_resolution: '1024x1024',
      avg_generation_time: '10-20s',
      quality_rating: 9,
      features: ['latest', 'prompt-adherence', 'multi-aspect'],
      requires_sync: true,
      max_steps: 50,
      default_steps: 28
    },
    supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'],
    recommended_uses: ['production', 'print-ready', 'commercial']
  },
  'stable-diffusion': {
    id: 'stable-diffusion',
    name: 'Stable Diffusion XL',
    type: 'text-to-image',
    description: 'Classic SDXL with proven reliability',
    pricing: {
      cost_per_image_usd: 0.015,
      cost_per_1000_images_usd: 15,
      tier: 'standard',
      currency: 'USD'
    },
    specs: {
      max_resolution: '1024x1024',
      avg_generation_time: '5-10s',
      quality_rating: 8,
      features: ['reliable', 'consistent', 'widely-tested'],
      requires_sync: false,
      max_steps: 50,
      default_steps: 30
    },
    supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    recommended_uses: ['general-purpose', 'production', 'consistent-results']
  }
};

/**
 * Get model configuration
 */
export function getModelConfig(modelId: string): ModelConfig {
  const model = modelRegistry[modelId];
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }
  return model;
}

/**
 * Get all models filtered by type
 */
export function getModelsByType(type?: string): ModelConfig[] {
  const models = Object.values(modelRegistry);
  if (!type || type === 'all') return models;
  return models.filter(m => m.type === type);
}
```

### Aspect Ratio Presets

```typescript
// src/config/presets.ts

import { AspectRatioDimensions } from '../types/models';

/**
 * Aspect ratio dimension mappings
 */
export const aspectRatioPresets: Record<string, AspectRatioDimensions> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 },
  '3:4': { width: 896, height: 1152 },
  '21:9': { width: 1536, height: 640 },
  '9:21': { width: 640, height: 1536 }
};

/**
 * Get dimensions for aspect ratio
 */
export function getDimensions(
  aspectRatio: string,
  customWidth?: number,
  customHeight?: number
): AspectRatioDimensions {
  if (customWidth && customHeight) {
    return { width: customWidth, height: customHeight };
  }

  const dimensions = aspectRatioPresets[aspectRatio];
  if (!dimensions) {
    throw new Error(`Invalid aspect ratio: ${aspectRatio}`);
  }

  return dimensions;
}
```

---

## Error Handling

### Error Classes

```typescript
// src/utils/errors.ts

/**
 * Base error class for MCP server
 */
export class McpError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'McpError';
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends McpError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends McpError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * fal.ai API errors
 */
export class FalApiError extends McpError {
  constructor(
    message: string,
    public statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message, 'FAL_API_ERROR', details);
    this.name = 'FalApiError';
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends McpError {
  constructor(message: string, timeoutSeconds: number) {
    super(message, 'TIMEOUT_ERROR', { timeoutSeconds });
    this.name = 'TimeoutError';
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends McpError {
  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * Generation errors
 */
export class GenerationError extends McpError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'GENERATION_ERROR', details);
    this.name = 'GenerationError';
  }
}
```

### Error Handler

```typescript
// src/utils/errors-handler.ts

import {
  McpError,
  ValidationError,
  FalApiError,
  TimeoutError,
  ConfigurationError
} from './errors';

/**
 * Convert any error to MCP tool response
 */
export function handleError(error: unknown): {
  content: string;
  isError: true;
} {
  if (error instanceof McpError) {
    return {
      content: JSON.stringify({
        error: error.name,
        message: error.message,
        code: error.code,
        details: error.details
      }, null, 2),
      isError: true
    };
  }

  if (error instanceof Error) {
    return {
      content: JSON.stringify({
        error: 'UnexpectedError',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, null, 2),
      isError: true
    };
  }

  return {
    content: JSON.stringify({
      error: 'UnknownError',
      message: 'An unknown error occurred'
    }, null, 2),
    isError: true
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof FalApiError) {
    return [429, 500, 502, 503, 504].includes(error.statusCode);
  }
  if (error instanceof TimeoutError) {
    return true;
  }
  return false;
}
```

---

## Cost Optimization

### Cost Calculator

```typescript
// src/lib/cost-calculator.ts

import { getModelConfig } from '../config/models';
import { GenerationOptions } from '../types/models';

/**
 * Calculate cost for a single generation
 */
export function calculateCost(options: GenerationOptions): number {
  const model = getModelConfig(options.model);

  // Base cost per image
  let cost = model.pricing.cost_per_image_usd;

  // Quality tier multiplier
  const tierMultipliers: Record<string, number> = {
    fast: 1.0,
    standard: 1.0,
    high: 1.0
  };

  cost *= tierMultipliers[options.quality_tier] || 1.0;

  // Steps multiplier (more steps = slightly more expensive)
  if (options.num_inference_steps) {
    const defaultSteps = model.specs.default_steps;
    const stepsRatio = options.num_inference_steps / defaultSteps;
    cost *= Math.max(0.8, Math.min(2.0, stepsRatio));
  }

  // Sync mode surcharge (faster but more expensive)
  if (options.sync_mode) {
    cost *= 1.5;
  }

  return Math.round(cost * 10000) / 10000; // Round to 4 decimal places
}

/**
 * Calculate cost for batch generation
 */
export function calculateBatchCost(
  options: GenerationOptions,
  promptCount: number
): {
  totalCost: number;
  costPerImage: number;
  currency: string;
} {
  const costPerImage = calculateCost(options);
  const totalCost = costPerImage * promptCount;

  return {
    totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
    costPerImage,
    currency: 'USD'
  };
}

/**
 * Get cost estimate summary
 */
export function getCostSummary(options: GenerationOptions, count: number): {
  estimatedCost: number;
  costPerImage: number;
  currency: string;
  model: string;
  tier: string;
} {
  const { totalCost, costPerImage } = calculateBatchCost(options, count);

  return {
    estimatedCost: totalCost,
    costPerImage,
    currency: 'USD',
    model: options.model,
    tier: options.quality_tier
  };
}
```

### Quality Tier Optimization

```typescript
// src/lib/quality-optimizer.ts

import { FalModelId, QualityTier } from '../types/models';
import { getModelConfig } from '../config/models';

/**
 * Optimize quality tier based on requirements
 */
export function optimizeQualityTier(
  model: FalModelId,
  requirements: {
    speedPriority?: boolean;
    qualityPriority?: boolean;
    costPriority?: boolean;
  }
): QualityTier {
  const modelConfig = getModelConfig(model);

  // If speed is priority, use fast tier
  if (requirements.speedPriority) {
    return 'fast';
  }

  // If quality is priority, use high tier
  if (requirements.qualityPriority) {
    return modelConfig.pricing.tier === 'high' ? 'high' : 'standard';
  }

  // If cost is priority, use fast tier
  if (requirements.costPriority) {
    return 'fast';
  }

  // Default: use model's native tier
  return modelConfig.pricing.tier;
}

/**
 * Get recommended model for use case
 */
export function getRecommendedModel(useCase: string): {
  model: FalModelId;
  quality_tier: QualityTier;
  reason: string;
} {
  const recommendations: Record<string, any> = {
    'rapid-prototyping': {
      model: 'flux-schnell',
      quality_tier: 'fast',
      reason: 'Fastest generation with good quality for iterations'
    },
    'production': {
      model: 'sd-3',
      quality_tier: 'high',
      reason: 'Best quality for production use'
    },
    'bulk-generation': {
      model: 'sdxl-lightning',
      quality_tier: 'fast',
      reason: 'Ultra-fast for generating many images quickly'
    },
    'artwork': {
      model: 'flux-dev',
      quality_tier: 'standard',
      reason: 'Excellent quality for creative work'
    },
    'preview': {
      model: 'flux-schnell',
      quality_tier: 'fast',
      reason: 'Quick previews with minimal cost'
    }
  };

  return (
    recommendations[useCase] || {
      model: 'flux-schnell',
      quality_tier: 'fast',
      reason: 'Good balance of speed and quality'
    }
  );
}
```

---

## Security Considerations

### API Key Management

1. **Environment Variable**: API key must be stored in `FAL_AI_API_KEY` environment variable
2. **Never Log Secrets**: API key must never appear in logs or error messages
3. **Key Rotation**: Support for rotating keys without server restart
4. **Key Validation**: Validate key format on startup

### Input Validation

```typescript
// src/utils/validation.ts

import { z } from 'zod';

/**
 * Prompt validation schema
 */
export const promptSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(1000, 'Prompt must be less than 1000 characters')
    .refine(
      (val) => !/<script|javascript:|onerror=/i.test(val),
      'Prompt contains potentially malicious content'
    )
});

/**
 * Generation options validation
 */
export const generationOptionsSchema = z.object({
  model: z.enum(['flux-schnell', 'flux-dev', 'sdxl-lightning', 'sd-3', 'stable-diffusion']),
  quality_tier: z.enum(['fast', 'standard', 'high']).default('fast'),
  aspect_ratio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21']).default('1:1'),
  width: z.number().min(256).max(2048).multipleOf(64).optional(),
  height: z.number().min(256).max(2048).multipleOf(64).optional(),
  num_inference_steps: z.number().min(1).max(50).optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  enable_safety_checker: z.boolean().default(true),
  sync_mode: z.boolean().default(false)
});

/**
 * Batch generation validation
 */
export const batchGenerationSchema = z.object({
  prompts: z
    .array(z.string().min(10).max(1000))
    .min(2, 'At least 2 prompts required')
    .max(10, 'Maximum 10 prompts allowed'),
  model: z.enum(['flux-schnell', 'flux-dev', 'sdxl-lightning', 'sd-3', 'stable-diffusion']),
  quality_tier: z.enum(['fast', 'standard', 'high']).default('fast'),
  max_concurrent: z.number().min(1).max(5).default(3),
  timeout_seconds: z.number().min(30).max(300).default(120)
});

/**
 * Validate and sanitize inputs
 */
export function validateGenerationInput(input: unknown) {
  return promptSchema.merge(generationOptionsSchema).safeParse(input);
}

export function validateBatchInput(input: unknown) {
  return batchGenerationSchema.safeParse(input);
}
```

### Content Safety

1. **Safety Checker**: Enable by default for all generations
2. **Prompt Filtering**: Reject prompts with:
   - Malicious code patterns
   - PII (personally identifiable information)
   - Hate speech indicators
3. **Rate Limiting**: Implement per-user rate limits
4. **Cost Limits**: Maximum cost per request to prevent abuse

---

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/cost-calculator.test.ts

import { describe, it, expect } from 'vitest';
import { calculateCost, calculateBatchCost } from '../../src/lib/cost-calculator';

describe('Cost Calculator', () => {
  it('should calculate cost for flux-schnell', () => {
    const cost = calculateCost({
      model: 'flux-schnell',
      quality_tier: 'fast',
      num_inference_steps: 4
    });
    expect(cost).toBe(0.00025);
  });

  it('should apply sync mode surcharge', () => {
    const cost = calculateCost({
      model: 'flux-schnell',
      quality_tier: 'fast',
      sync_mode: true
    });
    expect(cost).toBe(0.000375); // 0.00025 * 1.5
  });

  it('should calculate batch cost correctly', () => {
    const result = calculateBatchCost(
      {
        model: 'flux-schnell',
        quality_tier: 'fast'
      },
      10
    );
    expect(result.totalCost).toBe(0.0025);
    expect(result.costPerImage).toBe(0.00025);
  });
});
```

### Integration Tests

```typescript
// tests/integration/tools.test.ts

import { describe, it, expect } from 'vitest';
import { generateImage, batchGenerate, listModels } from '../../src/tools';

describe('MCP Tools Integration', () => {
  it('should generate image successfully', async () => {
    const result = await generateImage({
      prompt: 'A beautiful sunset over mountains',
      model: 'flux-schnell',
      quality_tier: 'fast',
      aspect_ratio: '16:9'
    });

    expect(result.success).toBe(true);
    expect(result.image_url).toBeDefined();
    expect(result.cost_usd).toBeGreaterThan(0);
  });

  it('should handle invalid prompts', async () => {
    const result = await generateImage({
      prompt: 'short',
      model: 'flux-schnell'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should list models with pricing', async () => {
    const result = await listModels({
      include_pricing: true,
      include_specs: true
    });

    expect(result.models.length).toBeGreaterThan(0);
    expect(result.models[0].pricing).toBeDefined();
    expect(result.models[0].specs).toBeDefined();
  });
});
```

### Mock fal.ai Client

```typescript
// tests/mocks/fal-client.mock.ts

export const mockFalClient = {
  generate: vi.fn().mockResolvedValue({
    images: [{
      url: 'https://mock.fal.ai/image.png',
      width: 1024,
      height: 1024
    }],
    request_id: 'mock-request-id',
    timing: {
      generation_time: 2.5
    }
  }),

  submitAsync: vi.fn().mockResolvedValue({
    request_id: 'mock-async-id',
    status: 'IN_QUEUE'
  }),

  getStatus: vi.fn().mockResolvedValue({
    status: 'COMPLETED',
    response: {
      images: [{
        url: 'https://mock.fal.ai/image.png',
        width: 1024,
        height: 1024
      }]
    }
  })
};
```

---

## Deployment

### Installation as MCP Server

```bash
# Install globally
npm install -g @haldeki/mcp-fal-ai

# Or install as local dependency
npm install @haldeki/mcp-fal-ai
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "fal-ai": {
      "command": "node",
      "args": ["/path/to/mcp-fal-ai/dist/index.js"],
      "env": {
        "FAL_AI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

ENV FAL_AI_API_KEY=""

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  mcp-fal-ai:
    build: .
    environment:
      - FAL_AI_API_KEY=${FAL_AI_API_KEY}
      - FAL_DEBUG=false
    restart: unless-stopped
```

### Health Check Endpoint

```typescript
// src/health.ts

export async function healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    config: {
      defaultModel: config.defaultModel,
      apiEndpoint: config.apiEndpoint,
      apiKeyPresent: !!config.falApiKey
    }
  };
}
```

---

## Appendix

### Model Comparison Table

| Model | Cost/Image | Quality | Speed | Best For |
|-------|-----------|---------|-------|----------|
| FLUX.1 Schnell | $0.00025 | 8/10 | 2-4s | Fast iteration, bulk |
| FLUX.1 Dev | $0.03 | 9/10 | 8-15s | Creative work |
| SDXL Lightning | $0.001 | 7/10 | 1-2s | Real-time, previews |
| SD-3 | $0.035 | 9/10 | 10-20s | Production, print |
| SDXL | $0.015 | 8/10 | 5-10s | General purpose |

### Aspect Ratio Guide

| Ratio | Dimensions | Use Case |
|-------|-----------|----------|
| 1:1 | 1024x1024 | Social media, icons |
| 16:9 | 1344x768 | Video thumbnails, presentations |
| 9:16 | 768x1344 | Mobile stories, posters |
| 4:3 | 1152x896 | Traditional displays |
| 21:9 | 1536x640 | Cinematic, wallpapers |
| 9:21 | 640x1536 | Mobile banners |

### API Rate Limits

- **Free Tier**: 100 requests/day
- **Paid Tier**: Based on usage
- **Rate Limit**: 10 requests/second
- **Batch Max**: 10 images per request

---

## Conclusion

This design document provides a comprehensive blueprint for implementing a production-ready MCP server for fal.ai image generation. The architecture prioritizes:

1. **Modularity**: Clear separation of concerns
2. **Type Safety**: Comprehensive TypeScript types
3. **Cost Optimization**: Transparent pricing calculation
4. **Error Handling**: Robust error management
5. **Security**: Input validation and API key protection
6. **Extensibility**: Easy to add new models and features

The server can be deployed as a standalone MCP server or integrated into existing Claude workflows.

---

**Next Steps**:

1. Review and approve design
2. Set up project structure
3. Implement core functionality
4. Write comprehensive tests
5. Deploy and monitor
6. Iterate based on feedback
