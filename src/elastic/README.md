# Elastic APM Tools

This module provides tools for interacting with Elasticsearch and Kibana for APM (Application Performance Monitoring) data.

## Environment Variables

Configure the following environment variables for Elastic connectivity:

```bash
# Required
ELASTIC_HOST=http://localhost:9200              # Elasticsearch host URL
KIBANA_HOST=http://localhost:5601               # Kibana host URL

# Authentication (choose one method)
# Method 1: API Key (recommended)
ELASTIC_API_KEY=your_api_key_here

# Method 2: Username/Password
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=your_password_here
```

## Available Tools

### 1. `elastic_get_dashboards`
Get list of Kibana dashboards related to APM.

### 2. `elastic_get_metrics`
Retrieve APM metrics for services including:
- Average response time
- Throughput
- Error rates

### 3. `elastic_get_logs`
Get application logs from Elasticsearch with filtering options:
- Service name
- Log level (DEBUG, INFO, WARN, ERROR, FATAL)
- Time range

### 4. `elastic_get_traces`
Retrieve APM traces and spans with options to filter by:
- Service name
- Trace ID
- Transaction name

### 5. `elastic_get_errors`
Get APM error data including:
- Error types
- Error messages
- Stack traces

### 6. `elastic_get_services`
List all services in APM with their:
- Environments
- Programming languages
- Versions

### 7. `elastic_search_logs`
Search logs using custom Elasticsearch query strings.

### 8. `elastic_health_check`
Check Elasticsearch cluster health and get basic cluster information.

## Usage Examples

All tools support time range filtering using formats like:
- `15m` - 15 minutes
- `1h` - 1 hour
- `1d` - 1 day

### Get recent errors for a specific service:
```json
{
  "name": "elastic_get_errors",
  "arguments": {
    "service_name": "my-api-service",
    "time_range": "1h",
    "size": 20
  }
}
```

### Search logs with custom query:
```json
{
  "name": "elastic_search_logs",
  "arguments": {
    "query": "ERROR AND service.name:my-service",
    "time_range": "30m"
  }
}
```

## Security

- Use API keys instead of username/password when possible
- Ensure your Elasticsearch cluster has proper authentication configured
- Restrict API key permissions to only necessary indices and operations