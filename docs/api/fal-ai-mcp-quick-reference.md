# fal.ai MCP Server - Quick Reference

## Overview

This document provides a quick reference guide for the fal.ai MCP (Model Context Protocol) server design.

## Files Created

1. **`fal-ai-mcp-server-design.md`** - Complete design specification
2. **`fal-ai-mcp-architecture.md`** - Architecture diagrams and implementation guide
3. **`fal-ai-mcp-quick-reference.md`** - This quick reference guide

## Key Components

### MCP Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `generate_image` | Single image generation | prompt, model, aspect_ratio, quality_tier |
| `batch_generate` | Multiple images in parallel | prompts[], max_concurrent, timeout |
| `list_models` | List available models | filter_type, include_pricing, include_specs |

### Supported Models

| Model | Cost | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| flux-schnell | $0.00025 | 2-4s | 8/10 | Fast iteration, bulk |
| flux-dev | $0.03 | 8-15s | 9/10 | Creative work |
| sdxl-lightning | $0.001 | 1-2s | 7/10 | Real-time, previews |
| sd-3 | $0.035 | 10-20s | 9/10 | Production, print |
| stable-diffusion | $0.015 | 5-10s | 8/10 | General purpose |

### Quality Tiers

- **fast**: Lowest cost, fastest generation (default)
- **standard**: Balanced quality and cost
- **high**: Best quality, higher cost

### Aspect Ratios

- `1:1` → 1024x1024 (Social media)
- `16:9` → 1344x768 (Video thumbnails)
- `9:16` → 768x1344 (Mobile stories)
- `4:3` → 1152x896 (Traditional displays)
- `3:4` → 896x1152 (Portrait)
- `21:9` → 1536x640 (Cinematic)
- `9:21` → 640x1536 (Mobile banners)

## Package Structure

```
mcp-fal-ai/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── server.ts                # MCP server configuration
│   ├── tools/                   # Tool implementations
│   │   ├── generate-image.ts
│   │   ├── batch-generate.ts
│   │   └── list-models.ts
│   ├── lib/                     # Core library code
│   │   ├── fal-client.ts        # fal.ai API client
│   │   ├── model-registry.ts    # Available models
│   │   ├── poller.ts            # Async result polling
│   │   └── cost-calculator.ts   # Cost estimation
│   ├── config/                  # Configuration
│   │   ├── index.ts
│   │   ├── models.ts
│   │   └── presets.ts
│   ├── types/                   # TypeScript types
│   │   ├── fal-api.ts
│   │   ├── mcp.ts
│   │   └── models.ts
│   └── utils/                   # Utilities
│       ├── validation.ts        # Zod schemas
│       ├── errors.ts            # Error classes
│       └── logger.ts            # Logging
├── tests/                       # Test files
└── docs/                        # Documentation
```

## Environment Variables

```bash
# Required
FAL_AI_API_KEY=your_api_key_here

# Optional
FAL_AI_DEFAULT_MODEL=flux-schnell
FAL_AI_DEFAULT_QUALITY_TIER=fast
FAL_API_TIMEOUT=120
FAL_MAX_CONCURRENT=3
FAL_DEBUG=false
FAL_API_ENDPOINT=https://queue.fal.run
```

## Usage Examples

### Generate Single Image

```typescript
const result = await generateImage({
  prompt: "A serene mountain landscape at sunset with a lake reflection",
  model: "flux-schnell",
  quality_tier: "fast",
  aspect_ratio: "16:9",
  num_inference_steps: 4,
  enable_safety_checker: true
});

// Response
{
  success: true,
  image_url: "https://fal.media/...",
  width: 1344,
  height: 768,
  model: "flux-schnell",
  generation_time: 2.5,
  cost_usd: 0.00025,
  request_id: "uuid-123"
}
```

### Batch Generate

```typescript
const result = await batchGenerate({
  prompts: [
    "A futuristic cityscape at night",
    "A cozy cabin in snowy mountains",
    "An underwater coral reef scene"
  ],
  model: "flux-schnell",
  quality_tier: "fast",
  aspect_ratio: "16:9",
  max_concurrent: 3,
  timeout_seconds: 120
});

// Response
{
  success: true,
  results: [
    { index: 0, success: true, image_url: "..." },
    { index: 1, success: true, image_url: "..." },
    { index: 2, success: true, image_url: "..." }
  ],
  total_cost_usd: 0.00075,
  total_time_seconds: 8.5,
  success_count: 3,
  failure_count: 0
}
```

### List Models

```typescript
const result = await listModels({
  filter_type: "all",
  include_pricing: true,
  include_specs: true
});

// Response
{
  models: [
    {
      id: "flux-schnell",
      name: "FLUX.1 Schnell",
      type: "text-to-image",
      pricing: {
        cost_per_image_usd: 0.00025,
        tier: "fast"
      },
      specs: {
        max_resolution: "1024x1024",
        avg_generation_time: "2-4s",
        quality_rating: 8
      }
    },
    // ... more models
  ],
  total_count: 5
}
```

## TypeScript Types

### Core Types

```typescript
type FalModelId = 'flux-schnell' | 'flux-dev' | 'sdxl-lightning' | 'sd-3' | 'stable-diffusion';
type QualityTier = 'fast' | 'standard' | 'high';
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21';

interface GenerationOptions {
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

interface GenerationResult {
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
```

## Error Handling

### Error Types

- **ValidationError**: Invalid input parameters
- **FalApiError**: fal.ai API errors (4xx, 5xx)
- **TimeoutError**: Request timeout
- **RateLimitError**: Rate limit exceeded
- **GenerationError**: Generation failure

### Error Response Format

```typescript
{
  content: {
    error: "ValidationError",
    message: "Prompt must be at least 10 characters",
    code: "VALIDATION_ERROR",
    details: {
      field: "prompt",
      constraint: "min_length",
      value: 5
    }
  },
  isError: true
}
```

## Cost Calculation

### Formula

```
base_cost = model.cost_per_image
tier_multiplier = 1.0 (fast) | 1.0 (standard) | 1.0 (high)
steps_multiplier = steps / default_steps
sync_surcharge = 1.5 if sync_mode else 1.0

total_cost = base_cost × tier_multiplier × steps_multiplier × sync_surcharge
```

### Examples

| Model | Tier | Steps | Sync | Cost |
|-------|------|-------|------|------|
| flux-schnell | fast | 4 | No | $0.00025 |
| flux-schnell | fast | 4 | Yes | $0.000375 |
| flux-dev | standard | 28 | No | $0.03 |
| sd-3 | high | 50 | Yes | $0.0525 |

## Validation Rules

### Prompt Validation

- Minimum length: 10 characters
- Maximum length: 1000 characters
- No script tags or JavaScript
- No error handlers

### Dimension Validation

- Width: 256-2048 pixels, multiple of 64
- Height: 256-2048 pixels, multiple of 64

### Steps Validation

- Range: 1-50 steps
- Model-specific maximums apply

## Deployment

### Installation

```bash
npm install -g @haldeki/mcp-fal-ai
```

### Claude Desktop Config

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

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Coverage

```bash
npm run test:coverage
```

## Performance Benchmarks

| Operation | Target | Max |
|-----------|--------|-----|
| Single image (fast) | 2-4s | 10s |
| Single image (standard) | 8-15s | 30s |
| Single image (high) | 10-20s | 45s |
| Batch (3 images) | 5-10s | 60s |
| Batch (10 images) | 15-30s | 180s |
| List models | <100ms | 500ms |

## Security Considerations

1. **API Key**: Never log or expose in error messages
2. **Input Validation**: All inputs validated with Zod
3. **HTTPS Only**: All API communication over HTTPS
4. **Safety Checker**: Enabled by default
5. **Rate Limiting**: Per-user limits to prevent abuse
6. **Cost Limits**: Maximum cost per request

## Troubleshooting

### Common Issues

**Issue**: `FAL_AI_API_KEY is required`
- **Solution**: Set the FAL_AI_API_KEY environment variable

**Issue**: `Prompt must be at least 10 characters`
- **Solution**: Provide a more detailed prompt

**Issue**: Request timeout
- **Solution**: Increase FAL_API_TIMEOUT or use async mode

**Issue**: Rate limit exceeded
- **Solution**: Wait before retrying or reduce concurrent requests

## Next Steps

1. Review the full design document: `fal-ai-mcp-server-design.md`
2. Study the architecture: `fal-ai-mcp-architecture.md`
3. Set up development environment
4. Implement core functionality
5. Write comprehensive tests
6. Deploy and monitor

## Additional Resources

- [fal.ai Documentation](https://docs.fal.ai/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Zod Validation](https://zod.dev/)

---

**Version**: 1.0
**Last Updated**: 2026-01-04
**Status**: Design Phase
