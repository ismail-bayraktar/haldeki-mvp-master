# fal.ai MCP Server - Architecture & Implementation Guide

## Architecture Diagrams

### 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Claude Desktop                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Claude AI Assistant                    │  │
│  │  - Natural language processing                            │  │
│  │  - Tool invocation                                        │  │
│  │  - Response generation                                    │  │
│  └───────────────────────┬──────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │ MCP Protocol (stdio)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Server: fal-ai                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Server Layer                           │  │
│  │  - MCP protocol implementation                            │  │
│  │  - Tool registration                                      │  │
│  │  - Request/response routing                               │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │                    Tool Handlers                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │generate_image│  │batch_generate│  │ list_models  │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │                   Business Logic                          │  │
│  │  - Input validation (Zod)                                 │  │
│  │  - Cost calculation                                       │  │
│  │  - Model selection optimization                           │  │
│  │  - Quality tier management                                │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │                  fal.ai Client                            │  │
│  │  - HTTP request management                                │  │
│  │  - Async polling                                          │  │
│  │  - Response parsing                                       │  │
│  │  - Error handling                                         │  │
│  └───────────────────────┬──────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTPS (REST API)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        fal.ai Platform                           │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │FLUX.1     │ │SDXL       │ │SD-3       │ │Stable     │       │
│  │Schnell    │ │Lightning  │ │           │ │Diffusion  │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│                                                                   │
│  Queue Management • Async Processing • Result Storage           │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Request Flow Detail

```
User Request
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  "Generate an image of a mountain sunset at 16:9 ratio"      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Claude: Identify Intent → Call generate_image Tool         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  MCP Server: Receive Tool Call                               │
│  - Parse input parameters                                     │
│  - Validate schema                                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Validation Layer (Zod)                                      │
│  ✓ Prompt length: 10-1000 chars                              │
│  ✓ Model: flux-schnell                                       │
│  ✓ Aspect ratio: 16:9 → 1344x768                             │
│  ✓ Safety checker: enabled                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Cost Calculator                                             │
│  - Model: flux-schnell ($0.00025/image)                     │
│  - Quality tier: fast (1.0x multiplier)                      │
│  - Steps: 4 (default)                                        │
│  - Total cost: $0.00025                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  fal.ai Client: Prepare Request                              │
│  POST https://queue.fal.run/fal-ai/flux-schnell             │
│  Headers:                                                    │
│    - Authorization: Key <FAL_AI_API_KEY>                     │
│    - Content-Type: application/json                         │
│  Body:                                                       │
│    {                                                         │
│      "prompt": "mountain sunset",                            │
│      "width": 1344,                                          │
│      "height": 768,                                          │
│      "num_inference_steps": 4                                │
│    }                                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  fal.ai Platform                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Queue       │ -> │  Process     │ -> │  Complete    │  │
│  │  (0.5s)      │    │  (2-4s)      │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Response Processing                                         │
│  {                                                           │
│    "images": [{                                              │
│      "url": "https://fal.media/...",                         │
│      "width": 1344,                                          │
│      "height": 768                                           │
│    }],                                                        │
│    "request_id": "uuid-123",                                 │
│    "timing": { "generation_time": 2.5 }                      │
│  }                                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  MCP Server: Format Response                                 │
│  {                                                           │
│    "content": {                                              │
│      "success": true,                                        │
│      "image_url": "https://...",                             │
│      "width": 1344,                                          │
│      "height": 768,                                          │
│      "model": "flux-schnell",                                │
│      "generation_time": 2.5,                                 │
│      "cost_usd": 0.00025,                                    │
│      "request_id": "uuid-123"                                │
│    }                                                         │
│  }                                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Claude: Present Result to User                              │
│  "I've generated your mountain sunset image. It took 2.5     │
│   seconds and cost $0.00025. The image is 1344x768 pixels.   │
│   Here's your image: [image URL]"                            │
└─────────────────────────────────────────────────────────────┘
```

### 3. Batch Generation Flow

```
User Request
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  "Generate 3 images: a cityscape, a forest, a beach"         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  MCP Server: batch_generate Tool                             │
│  Input:                                                       │
│    prompts: ["cityscape", "forest", "beach"]                 │
│    model: flux-schnell                                        │
│    max_concurrent: 3                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Batch Controller                                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
│  │Request 1│  │Request 2│  │Request 3│   (Concurrent)        │
│  └────┬────┘  └────┬────┘  └────┬────┘                       │
│       │            │            │                            │
│       ▼            ▼            ▼                            │
│  ┌─────────────────────────────────────────┐                │
│  │         fal.ai Platform                  │                │
│  │  (Processes 3 requests in parallel)     │                │
│  └─────────────────────────────────────────┘                │
│       │            │            │                            │
│       ▼            ▼            ▼                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
│  │Result 1 │  │Result 2 │  │Result 3 │                       │
│  └─────────┘  └─────────┘  └─────────┘                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Aggregate Results                                           │
│  {                                                           │
│    "success": true,                                          │
│    "results": [                                              │
│      {"index": 0, "success": true, "image_url": "..."},      │
│      {"index": 1, "success": true, "image_url": "..."},      │
│      {"index": 2, "success": true, "image_url": "..."}       │
│    ],                                                         │
│    "total_cost_usd": 0.00075,                                │
│    "success_count": 3,                                       │
│    "failure_count": 0                                        │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### 4. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Error Detection                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Error Classification                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Validation    │  │fal.ai API   │  │Timeout       │      │
│  │Error         │  │Error         │  │Error         │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
    ┌─────────┐        ┌─────────┐        ┌─────────┐
    │400/422  │        │429/500  │        │408      │
    │Response │        │Response │        │Response │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Error Response Format                                       │
│  {                                                           │
│    "content": {                                              │
│      "error": "ValidationError",                             │
│      "message": "Prompt must be at least 10 characters",    │
│      "code": "VALIDATION_ERROR",                             │
│      "details": {                                            │
│        "field": "prompt",                                    │
│        "constraint": "min_length",                           │
│        "value": 5                                            │
│      }                                                       │
│    },                                                        │
│    "isError": true                                           │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### 5. Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      index.ts                                │
│                 (Server Entry Point)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - MCP server initialization                          │  │
│  │  - Tool registration                                  │  │
│  │  - Configuration loading                             │  │
│  └───────────────────────┬──────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ├──────────────────────────────────┐
                           │                                  │
                           ▼                                  ▼
┌─────────────────────────────────────────┐  ┌────────────────┐
│           tools/                        │  │    config/     │
│  ┌──────────────────────────────────┐  │  │  - Models      │
│  │  generate-image.ts               │  │  │  - Presets     │
│  │  - Input validation              │──┼──┼──>             │
│  │  - Business logic orchestration  │  │  │  - Constants   │
│  │  - Response formatting           │  │  └────────────────┘
│  └────────────┬─────────────────────┘  │
│               │                         │
│  ┌────────────▼─────────────────────┐  │
│  │  batch-generate.ts               │  │
│  │  - Concurrent request management │  │
│  │  - Result aggregation            │  │
│  └────────────┬─────────────────────┘  │
│               │                         │
│  ┌────────────▼─────────────────────┐  │
│  │  list-models.ts                  │  │
│  │  - Model registry query          │  │
│  │  - Pricing information           │  │
│  └──────────────────────────────────┘  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      lib/                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  fal-client.ts                                        │  │
│  │  - HTTP request handling                              │  │
│  │  - Authentication                                     │  │
│  │  - Response parsing                                   │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │  poller.ts                                            │  │
│  │  - Async status checking                              │  │
│  │  - Retry logic                                        │  │
│  │  - Timeout management                                 │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │  cost-calculator.ts                                   │  │
│  │  - Per-image cost calculation                         │  │
│  │  - Batch cost estimation                              │  │
│  │  - Tier multipliers                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     utils/                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  validation.ts                                        │  │
│  │  - Zod schemas                                        │  │
│  │  - Input sanitization                                 │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │  errors.ts                                            │  │
│  │  - Error classes                                      │  │
│  │  - Error handlers                                     │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │  logger.ts                                            │  │
│  │  - Structured logging                                 │  │
│  │  - Debug mode support                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 6. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Input: Claude Request                                      │
│  {                                                           │
│    "prompt": "A serene mountain landscape",                 │
│    "model": "flux-schnell",                                 │
│    "aspect_ratio": "16:9"                                   │
│  }                                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Tool Handler (generate-image.ts)                  │
│  - Receive MCP request                                       │
│  - Extract parameters                                        │
│  - Call business logic                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Validation (utils/validation.ts)                  │
│  - Zod schema validation                                     │
│  ✓ Prompt length OK                                          │
│  ✓ Model enum OK                                             │
│  ✓ Aspect ratio OK                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Cost Calculator (lib/cost-calculator.ts)          │
│  - Lookup model pricing                                      │
│  - Calculate: $0.00025 * 1.0 (fast tier) = $0.00025         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Config Resolver (config/presets.ts)                │
│  - aspect_ratio: "16:9"                                      │
│  - Dimensions: { width: 1344, height: 768 }                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: fal.ai Client (lib/fal-client.ts)                  │
│  - Build HTTP request                                        │
│  - Add authentication header                                 │
│  - POST to fal.ai API                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  External: fal.ai API                                        │
│  - Process request                                           │
│  - Generate image                                            │
│  - Return result                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: Response Parsing (lib/fal-client.ts)              │
│  - Parse JSON response                                       │
│  - Extract image URL                                         │
│  - Extract timing data                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Response Formatting (tools/generate-image.ts)      │
│  - Build MCP response format                                 │
│  - Add metadata (cost, time, model)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Output: MCP Response                                        │
│  {                                                           │
│    "content": {                                              │
│      "success": true,                                        │
│      "image_url": "https://fal.media/...",                   │
│      "width": 1344,                                          │
│      "height": 768,                                          │
│      "cost_usd": 0.00025,                                    │
│      "generation_time": 2.5                                  │
│    }                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### 7. State Management

```
┌─────────────────────────────────────────────────────────────┐
│  Stateless Components (Mostly)                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ✓ Tool Handlers (stateless)                          │  │
│  │  ✓ Validation (stateless)                             │  │
│  │  ✓ Cost Calculator (stateless)                        │  │
│  │  ✓ Config (immutable after load)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Stateful Components (Minimal)                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Poller (transient state)                             │  │
│  │    - Active request IDs                               │  │
│  │    - Retry counts                                     │  │
│  │    - Timeout timers                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Batch Controller (transient state)                   │  │
│  │    - Active concurrent requests                       │  │
│  │    - Completion tracking                              │  │
│  │    - Result aggregation                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 8. Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Input Validation                                   │
│  - Zod schema validation                                     │
│  - Prompt sanitization (XSS prevention)                      │
│  - Type checking                                             │
│  - Range validation (dimensions, steps, etc.)               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Configuration Security                              │
│  - API key from environment variable only                    │
│  - No hardcoded credentials                                  │
│  - Key validation on startup                                 │
│  - Secure defaults (safety checker ON)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: HTTP Security                                       │
│  - HTTPS only                                                │
│  - Authorization header (Bearer token)                       │
│  - No sensitive data in URL params                           │
│  - Request timeout limits                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Output Security                                     │
│  - No API keys in responses                                  │
│  - Sanitized error messages                                  │
│  - URL validation (prevent SSRF)                             │
│  - Content safety checker enabled by default                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)

- [ ] Set up project structure
- [ ] Configure TypeScript and build tools
- [ ] Define TypeScript types
- [ ] Set up Zod validation schemas
- [ ] Configure environment variables

### Phase 2: Core Functionality (Week 2)

- [ ] Implement fal.ai client
- [ ] Create cost calculator
- [ ] Build model registry
- [ ] Implement async polling
- [ ] Add error handling

### Phase 3: MCP Tools (Week 3)

- [ ] Implement generate_image tool
- [ ] Implement batch_generate tool
- [ ] Implement list_models tool
- [ ] Create MCP server setup
- [ ] Add tool registration

### Phase 4: Testing (Week 4)

- [ ] Unit tests for all components
- [ ] Integration tests for tools
- [ ] Mock fal.ai client for testing
- [ ] Error handling tests
- [ ] Cost calculation tests

### Phase 5: Deployment (Week 5)

- [ ] Create package.json scripts
- [ ] Write documentation
- [ ] Set up CI/CD
- [ ] Create Docker image
- [ ] Deploy and monitor

---

## Performance Considerations

### Optimization Strategies

1. **Connection Pooling**: Reuse HTTP connections for batch requests
2. **Request Batching**: Combine multiple requests efficiently
3. **Caching**: Cache model registry and pricing data
4. **Async Processing**: Use non-blocking I/O for all HTTP requests
5. **Timeout Management**: Proper timeout configuration to prevent hanging

### Benchmarks (Expected)

| Operation | Target Time | Max Time |
|-----------|-------------|----------|
| Single image (fast) | 2-4s | 10s |
| Single image (standard) | 8-15s | 30s |
| Single image (high) | 10-20s | 45s |
| Batch (3 images) | 5-10s | 60s |
| Batch (10 images) | 15-30s | 180s |
| List models | <100ms | 500ms |

---

## Monitoring & Observability

### Metrics to Track

1. **Request Metrics**
   - Total requests per model
   - Request success rate
   - Average response time
   - P50, P95, P99 latencies

2. **Cost Metrics**
   - Total spend per day/week/month
   - Cost per model
   - Cost per quality tier
   - Batch vs single generation costs

3. **Error Metrics**
   - Error rate by type
   - Validation failure rate
   - API error rate
   - Timeout rate

### Logging Strategy

```typescript
// Structured logging example
logger.info('image_generation_started', {
  request_id: requestId,
  model: options.model,
  quality_tier: options.quality_tier,
  estimated_cost: cost
});

logger.info('image_generation_completed', {
  request_id: requestId,
  success: true,
  actual_cost: finalCost,
  duration: durationMs,
  image_url: result.url
});

logger.error('image_generation_failed', {
  request_id: requestId,
  error: error.message,
  error_code: error.code,
  duration: durationMs
});
```

---

## Future Enhancements

### Potential Features

1. **Advanced Models**
   - Image-to-image transformation
   - Image editing (inpainting, outpainting)
   - Image upscaling
   - Style transfer

2. **Workflow Features**
   - Generation history
   - Favorite prompts
   - Prompt templates
   - Generation chains

3. **Optimization Features**
   - Intelligent model selection
   - Cost prediction
   - Quality tier auto-selection
   - Adaptive batch sizing

4. **Integration Features**
   - Webhook support for long jobs
   - Direct storage integration (S3, Cloudflare R2)
   - CDN caching
   - Preview generation

---

This architecture document provides the visual and technical foundation for implementing the fal.ai MCP server.
