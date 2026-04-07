---
title: Observability
description: How Tentacular collects and presents traces, metrics, and logs using OpenTelemetry
---

Tentacular uses OpenTelemetry (OTel) as its telemetry standard. When the observability stack is deployed, every workflow pod emits traces, metrics, and logs automatically. LLM API calls are enriched with token usage metadata. All telemetry flows through a single well-known collector endpoint, making it straightforward to swap backends without changing any workflow code.

## Architecture

```
Enclave Namespace (each)              tentacular-observability NS
+------------------------+            +---------------------------+
| Engine (Deno)          |  OTLP/HTTP | OTel Collector            |
|   OTEL_DENO=true       |----------->|   (gateway mode)          |
|   + GenAI fetch wrapper|            |   - k8s metadata enricher |
| Sidecar(s)             |            |   - enclave attribution   |
+------------------------+            +-------+-------+-----------+
                                              |       |
tentacular-system NS                          v       v
+------------------------+            +---------------------------+
| MCP Server (Go)        |  OTLP/gRPC| SigNoz                    |
|   + OTel SDK           |---------->|  ClickHouse storage       |
+------------------------+            |  Built-in dashboards      |
                                      |  Google OAuth SSO         |
thekraken NS                          +-------------+-------------+
+------------------------+                          |
| Kraken (Node.js)       |  OTLP/gRPC              v
|   + OTel SDK           |---------->    Dashboard Views
+------------------------+            - Admin: cross-enclave
                                      - Enclave: team-filtered
```

All telemetry routes to one endpoint: `otel-collector.tentacular-observability.svc.cluster.local:4318` (OTLP/HTTP). This well-known DNS name is injected into every workflow pod by the builder. The convention holds regardless of which backend is behind the collector -- bundled SigNoz, a BYO collector, or an external endpoint.

## Automatic Instrumentation

The Deno engine (2.4+) has built-in OpenTelemetry support. Setting `OTEL_DENO=true` enables zero-code instrumentation with no SDK dependencies:

| Signal | What Is Captured |
|--------|------------------|
| Traces | `Deno.serve` incoming request spans |
| Traces | `fetch()` outgoing request spans (LLM calls, sidecar calls, external APIs) |
| Traces | W3C Trace Context propagation across services |
| Logs | `console.*` calls become OTel log records, correlated with the active span |
| Metrics | HTTP server request duration, active requests, request/response body sizes |

On top of auto-instrumentation, the engine adds custom spans for workflow structure:

| Span | Purpose |
|------|---------|
| `invoke_workflow` | Root span covering the entire workflow execution |
| `execute_node` | Child span for each DAG node execution |

The result is a full trace hierarchy from HTTP trigger through DAG execution to outbound API calls, with no instrumentation code in workflow nodes.

### Existing Health Endpoint

The `BasicSink` in-memory ring buffer and `/health?detail=1` endpoint continue unchanged. They are independent of OTel and serve the `wf_health` MCP tools. OTel runs in parallel.

## GenAI Telemetry

The engine includes a GenAI fetch wrapper that detects calls to known LLM API endpoints (Anthropic, OpenAI) and enriches the auto-created `fetch()` span with token usage attributes following the [OTel GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/).

### What Is Captured

Data is extracted from the API response `usage` object:

| Attribute | Description |
|-----------|-------------|
| `gen_ai.usage.input_tokens` | Input tokens consumed |
| `gen_ai.usage.output_tokens` | Output tokens generated |
| `gen_ai.usage.cache_creation.input_tokens` | Tokens used to create cache entries |
| `gen_ai.usage.cache_read.input_tokens` | Tokens served from cache |
| `gen_ai.system` | Provider (`anthropic`, `openai`) detected from endpoint URL |
| `gen_ai.request.model` | Model name from the request |
| `gen_ai.response.model` | Model name from the response |
| `gen_ai.response.finish_reasons` | Stop reason |
| `gen_ai.operation.name` | Operation type (`chat`, `embeddings`) |

### What Is NOT Captured

Prompt and completion content are **not captured by default**. This is a deliberate privacy decision. Content capture can be enabled per-enclave by setting:

```
OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true
```

Leave this off unless the enclave explicitly requires it for debugging or compliance.

### Span Hierarchy

A typical LLM workflow produces this trace structure:

```
invoke_workflow "my-tentacle"
  execute_node "fetch-data"
    fetch api.github.com/repos/...           (auto: Deno OTel)
  execute_node "analyze"
    chat claude-sonnet-4-20250514                   (GenAI span with token attributes)
  execute_node "notify"
    fetch hooks.slack.com/services/...       (auto: Deno OTel)
```

## Enclave-Scoped Soft Tenancy

All telemetry carries resource attributes for filtering:

| Attribute | Source | Spoofable? |
|-----------|--------|------------|
| `tentacular.enclave` | `OTEL_RESOURCE_ATTRIBUTES` env var (injected by builder) | Pod-level only |
| `k8s.namespace.name` | OTel Collector `k8s_attributes` processor | No (server-side enrichment) |
| `service.name` | `OTEL_SERVICE_NAME` env var (workflow name) | Pod-level only |

This is **soft tenancy**: all enclaves share one ClickHouse instance. SigNoz dashboards use `tentacular.enclave` as a filter variable. There is no hard data isolation between enclaves. This is acceptable for single-enterprise deployments.

If per-enclave enforcement becomes necessary in the future, Grafana can be added as a frontend with OIDC-backed team folders while SigNoz remains the storage backend.

## Dashboard Views

### Admin Dashboard (Cross-Enclave)

Platform operators see everything:

- Kubernetes cluster health (node CPU/memory, pod counts, unhealthy nodes)
- Namespace resource consumption by enclave (CPU, memory, storage vs quota)
- Workflow execution success/failure rates across all enclaves
- LLM token usage aggregated by enclave and model
- Error rate trends and top failing workflows
- Active enclaves and deployment activity

The admin dashboard pulls Kubernetes infrastructure metrics from the collector's `kubeletstats` and `k8s_cluster` receivers.

### Enclave Dashboard (Filtered)

Team members see their enclave's data:

- Workflow health (per-tentacle success rate, latency, errors)
- LLM usage (token counts, model breakdown, latency distribution)
- Recent executions with links to full traces
- Error details with span drill-down

### The Kraken Integration

For simple queries (health checks, error summaries), The Kraken responds inline in Slack by querying the SigNoz API scoped to the channel's enclave. For deeper analysis, it posts deep-links to SigNoz UI filtered to the enclave. Users click through, authenticate via Google OAuth, and land on a scoped dashboard.

## Graceful Degradation

If the collector is unreachable, Deno OTel drops exports silently. Workflows continue executing normally with no errors, retries, or backpressure. Telemetry is best-effort -- workflow correctness never depends on it.

## Sensitive Data Handling

The observability system uses defense-in-depth:

1. **Architecture prevents leaks** -- the GenAI wrapper captures metadata only, never prompt or completion content by default
2. **Content capture is opt-in** -- controlled per-enclave via environment variable
3. **Collector redaction** -- the OTel Collector runs a `transform` processor that pattern-matches common secret shapes (Bearer tokens, API keys, JWTs) and redacts them
4. **Node code risk** -- `console.log("key: " + secret)` would leak via OTel log records, same as any logging system. Agents building tentacles know not to do this.
