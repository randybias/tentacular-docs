---
title: Bring Your Own Observability
description: Route Tentacular telemetry to your existing observability backend instead of the bundled SigNoz stack
---

Tentacular's observability is built on OpenTelemetry, which means telemetry is backend-agnostic. If your organization already runs Datadog, Grafana Cloud, Splunk, New Relic, or any OTLP-compatible backend, you can route all Tentacular telemetry there instead of deploying SigNoz.

## When to Use BYO vs Bundled

| Situation | Recommendation |
|-----------|----------------|
| No existing observability stack | Use the bundled SigNoz stack |
| Existing OTLP-compatible backend in-cluster | BYO with ExternalName Service |
| Existing backend outside the cluster | BYO with manual Endpoints |
| Want to evaluate Tentacular quickly | Use the bundled stack, migrate later |
| Corporate policy requires a specific vendor | BYO from the start |

The key advantage of BYO: workflow pods never change. All telemetry routes through the well-known DNS name `otel-collector.tentacular-observability.svc.cluster.local:4318`. You control what sits behind that name.

## Prerequisites

- The `tentacular-observability` namespace must exist (created by the Helm chart even when the bundled collector is disabled)
- Your backend must accept OTLP/HTTP on port 4318 (or you remap via the Service definition)
- NetworkPolicy in `tentacular-observability` must allow ingress from enclave namespaces and `tentacular-system`

## Option A: ExternalName Service (In-Cluster Collector)

Use this when your observability collector is already running in the cluster, just in a different namespace.

Create an `ExternalName` Service that aliases the well-known DNS name to your collector:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: otel-collector
  namespace: tentacular-observability
spec:
  type: ExternalName
  externalName: my-collector.monitoring.svc.cluster.local
```

Replace `my-collector.monitoring.svc.cluster.local` with the FQDN of your existing collector Service.

**Requirements:**
- Your collector must accept OTLP/HTTP on port 4318
- If your collector uses a different port, use Option B instead (ExternalName does not support port remapping)

## Option B: Manual Endpoints (External Collector)

Use this when your collector is outside the cluster (a SaaS endpoint, a VM, or a different cluster).

Create a headless Service with explicit Endpoints pointing to your collector's IP:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: otel-collector
  namespace: tentacular-observability
spec:
  type: ClusterIP
  ports:
    - name: otlp-http
      port: 4318
      targetPort: 4318
---
apiVersion: v1
kind: Endpoints
metadata:
  name: otel-collector
  namespace: tentacular-observability
subsets:
  - addresses:
      - ip: 10.0.50.100
    ports:
      - name: otlp-http
        port: 4318
```

Replace `10.0.50.100` with your collector's IP address. If your collector runs on a different port, set `targetPort` accordingly while keeping `port: 4318` (this is what workflow pods connect to).

**For SaaS backends** (Datadog, Grafana Cloud, etc.), you typically need an in-cluster OTel Collector that forwards to the SaaS endpoint with appropriate authentication headers. Point the ExternalName or Endpoints at your forwarding collector, not directly at the SaaS API.

## Disabling the Bundled Collector

When installing or upgrading the `tentacular-observability` Helm chart, set:

```bash
helm install tentacular-observability charts/tentacular-observability \
  --set observability.collector.create=false
```

Or in your values file:

```yaml
observability:
  collector:
    create: false
```

This tells the chart to skip creating the collector Deployment and its default Service, leaving the `otel-collector` DNS name available for your own Service definition. The namespace and NetworkPolicy resources are still created.

## Verifying Telemetry Routes to Your Backend

After setting up the Service, verify the pipeline end-to-end:

1. **Check DNS resolution** from a pod in an enclave namespace:
   ```bash
   kubectl run dns-test --rm -it --image=busybox --restart=Never -- \
     nslookup otel-collector.tentacular-observability.svc.cluster.local
   ```

2. **Check OTLP endpoint** responds:
   ```bash
   kubectl run otlp-test --rm -it --image=curlimages/curl --restart=Never -- \
     curl -s -o /dev/null -w "%{http_code}" \
     http://otel-collector.tentacular-observability.svc.cluster.local:4318/v1/traces
   ```
   A 200 or 405 response means the endpoint is reachable and speaking OTLP.

3. **Deploy a test workflow** and run it. Check your backend for traces with `service.name` matching the workflow name and `tentacular.enclave` matching the enclave.

4. **Check for GenAI spans** if the workflow makes LLM calls. Look for `gen_ai.system` and `gen_ai.usage.input_tokens` attributes on `fetch()` spans.

## Troubleshooting

### No telemetry arriving at backend

- Confirm the Service exists in `tentacular-observability` with name `otel-collector`
- Confirm NetworkPolicy allows ingress on port 4318 from enclave namespaces
- Check that your collector accepts OTLP/HTTP (not just gRPC) on port 4318
- Workflow pods export via HTTP protobuf (`OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`)

### ExternalName not resolving

- ExternalName requires the target to be a valid DNS name, not an IP address
- If your collector uses an IP, use Option B (manual Endpoints) instead
- Verify the target Service exists and is resolvable from the `tentacular-observability` namespace

### Partial telemetry (traces but no metrics or logs)

- Confirm your collector pipeline has receivers for all three signal types on port 4318
- Some backends require separate endpoints for traces, metrics, and logs -- configure your collector to fan out accordingly

### Latency or dropped spans

- Deno OTel uses HTTP export which may be slower than gRPC for high-volume workloads
- If your collector supports gRPC on port 4317, the MCP server and Kraken (Go and Node.js) will use it, but the Deno engine always uses HTTP on 4318
- Consider running a local forwarding collector in `tentacular-observability` that accepts HTTP and forwards via gRPC to your backend
