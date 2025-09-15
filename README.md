# 🚀 Advanced Modular MCP Server

A cutting-edge, modular Model Context Protocol (MCP) server built with Deno and TypeScript, featuring a comprehensive suite of development, DevOps, and productivity tools.

## ✨ Features

### 🏗️ **Modular Architecture**
- **Clean separation** of concerns with dedicated modules
- **Type-safe** TypeScript implementation
- **Extensible** plugin-ready design
- **Performance optimized** with caching and monitoring

### 🛠️ **Tool Categories**

#### 📁 **File System Operations** (9 tools)
- Read/write files with encoding support
- Directory operations with recursive options
- File watching and monitoring
- Copy, move, and permission management

#### 🔄 **Git Operations** (10 tools)
- Full git workflow support
- Branch management and merging
- Stash operations and log analysis
- Remote repository operations

#### 🐳 **Docker Management** (11 tools)
- Container lifecycle management
- Image operations and building
- Docker Compose integration
- Resource monitoring

#### 💰 **Cryptocurrency & Blockchain** (4 tools)
- Real-time price tracking
- Portfolio calculation
- Wallet generation
- Market analysis

#### 🌐 **WebSocket Communication** (6 tools)
- Real-time connections
- Message broadcasting
- Connection management
- Ping/pong handling

#### 🔍 **Code Analysis** (6 tools)
- JavaScript/TypeScript parsing
- Code metrics and complexity
- Code smell detection
- Import/function extraction

#### ⚡ **Performance Benchmarking** (6 tools)
- Function performance testing
- HTTP endpoint benchmarking
- Sorting algorithm comparisons
- Memory usage monitoring
- File I/O performance

#### 🔧 **System Utilities** (5 tools)
- HTTP client with full feature set
- Command execution
- Server caching operations

## 🏁 Quick Start

### Prerequisites
- [Deno](https://deno.land/) v1.40+ installed
- Git (for git operations)
- Docker (for container management)

### Installation & Running

```bash
# Clone the repository
git clone <repository-url>
cd hello-mcp

# Development mode with hot reload
deno task dev

# Production mode
deno task start

# Build binary locally
deno task build
./bin/advanced-mcp-server
```

## 📋 Available Tasks

```bash
deno task dev          # Development with hot reload
deno task start        # Production server
deno task build        # Build executable binary
deno task test         # Run test suite
deno task fmt          # Format code
deno task lint         # Lint code
deno task check        # Type check main
deno task type-check   # Type check all files
deno task clean        # Clean build artifacts
```

## 🔧 Configuration

The server is highly configurable through environment variables:

```bash
# Server settings
MCP_SERVER_NAME="advanced-mcp-server"
MCP_SERVER_VERSION="3.0.0"

# Performance settings
CACHE_TTL=3600              # Default cache TTL in seconds
MAX_LOG_ENTRIES=1000        # Maximum log entries to keep
METRICS_INTERVAL=30000      # Metrics collection interval in ms

# Security settings
ENABLE_SHELL_COMMANDS=true  # Allow shell command execution
MAX_REQUEST_SIZE=10485760   # Max request size in bytes
```

## 🛠️ Tool Usage Examples

### File System Operations
```javascript
// Read a file
{
  "name": "fs_read_file",
  "arguments": {
    "path": "/path/to/file.txt",
    "encoding": "utf8"
  }
}

// Watch directory for changes
{
  "name": "fs_watch",
  "arguments": {
    "path": "/project",
    "recursive": true,
    "duration": 60
  }
}
```

### Git Operations
```javascript
// Get repository status
{
  "name": "git_status",
  "arguments": {
    "path": "/project"
  }
}

// Create commit
{
  "name": "git_commit",
  "arguments": {
    "message": "feat: add new feature",
    "author": "Developer <dev@example.com>"
  }
}
```

### Docker Management
```javascript
// List containers
{
  "name": "docker_list_containers",
  "arguments": {
    "all": true
  }
}

// Run container
{
  "name": "docker_run",
  "arguments": {
    "image": "nginx:latest",
    "name": "my-nginx",
    "ports": ["8080:80"],
    "detach": true
  }
}
```

### Cryptocurrency Tools
```javascript
// Get crypto prices
{
  "name": "crypto_get_price",
  "arguments": {
    "symbol": "BTC",
    "currency": "USD"
  }
}

// Calculate portfolio
{
  "name": "crypto_portfolio",
  "arguments": {
    "holdings": [
      {"symbol": "BTC", "amount": 0.5},
      {"symbol": "ETH", "amount": 2.0}
    ]
  }
}
```

### WebSocket Operations
```javascript
// Connect to WebSocket
{
  "name": "ws_connect",
  "arguments": {
    "url": "wss://echo.websocket.org",
    "timeout": 10000
  }
}

// Send message
{
  "name": "ws_send",
  "arguments": {
    "connectionId": "ws_1",
    "message": "Hello WebSocket!"
  }
}
```

### Code Analysis
```javascript
// Analyze JavaScript code
{
  "name": "analyze_javascript",
  "arguments": {
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript",
    "includeMetrics": true
  }
}

// Detect code smells
{
  "name": "detect_code_smells",
  "arguments": {
    "code": "var x = 123; console.log(x);",
    "language": "javascript",
    "severity": "medium"
  }
}
```

### Benchmarking
```javascript
// Benchmark function performance
{
  "name": "benchmark_function",
  "arguments": {
    "code": "(n) => n * n",
    "iterations": 10000,
    "args": [42]
  }
}

// HTTP endpoint performance
{
  "name": "benchmark_http_endpoint",
  "arguments": {
    "url": "https://api.example.com/health",
    "requests": 100,
    "concurrency": 10
  }
}
```

## 📊 Resources & Monitoring

The server provides several resources for monitoring:

- **`logs://recent`** - Recent server logs with filtering
- **`metrics://system`** - Real-time system metrics (CPU, memory, disk)
- **`cache://status`** - Cache statistics and performance
- **`config://server`** - Server configuration and capabilities
- **`tools://summary`** - Complete tool inventory by category

## 🎯 Prompt Templates

Pre-built intelligent prompts for common development tasks:

- **`code_review`** - Comprehensive code analysis and suggestions
- **`debug_analysis`** - Error analysis and debugging strategies
- **`performance_optimization`** - Performance improvement recommendations
- **`security_audit`** - Security vulnerability assessment

## 🏗️ Architecture

```
src/
├── server.ts           # Main server orchestrator
├── types.ts           # TypeScript type definitions
├── utils/
│   ├── logger.ts      # Logging system
│   └── cache.ts       # Memory cache implementation
└── tools/
    ├── filesystem.ts  # File system operations
    ├── git.ts         # Git version control
    ├── docker.ts      # Container management
    ├── crypto.ts      # Cryptocurrency tools
    ├── websocket.ts   # WebSocket communications
    ├── codeanalysis.ts# Code analysis and parsing
    └── benchmark.ts   # Performance benchmarking
```

## 🧪 Testing

Comprehensive test suite covering all major functionality:

```bash
# Run all tests
deno task test

# Run specific test file
deno test tests/server.test.ts --allow-all

# Run tests with coverage
deno test --coverage=coverage tests/

# Generate coverage report
deno coverage coverage --html
```

## 🚀 Performance

- **⚡ Fast startup** - Modular loading reduces initialization time
- **🔄 Efficient caching** - Built-in memory cache with TTL support
- **📊 Real-time monitoring** - System metrics collection every 30s
- **🎯 Resource optimization** - Automatic cleanup and memory management
- **🔀 Concurrent operations** - Async/await throughout for maximum throughput

## 🛡️ Security

- **🔒 Input validation** - All tool parameters are validated
- **🚫 Sandboxed execution** - Commands run with appropriate permissions
- **📝 Audit logging** - All operations logged with context
- **⏱️ Timeout protection** - All operations have timeout limits
- **🔐 No credential storage** - No sensitive data persistence

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-tool`)
3. Make your changes with tests
4. Run the test suite (`deno task test`)
5. Format and lint (`deno task fmt && deno task lint`)
6. Commit your changes (`git commit -am 'Add amazing tool'`)
7. Push to the branch (`git push origin feature/amazing-tool`)
8. Create a Pull Request

## 📈 Roadmap

### 🚧 In Progress
- [ ] Image processing and computer vision tools
- [ ] Plugin system for third-party extensions
- [ ] Advanced AI/ML integrations

### 🎯 Planned
- [ ] Database ORM integrations (PostgreSQL, MySQL, MongoDB)
- [ ] Cloud provider APIs (AWS, GCP, Azure)
- [ ] Monitoring and alerting integrations
- [ ] GraphQL schema analysis tools
- [ ] API documentation generation
- [ ] Load testing and chaos engineering tools

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/md-adil/advanced-mcp-server/issues)
- 💬 [Discussions](https://github.com/md-adil/advanced-mcp-server/discussions)
- 📧 Email: support@yourorg.com

---

**Built with ❤️ using Deno and TypeScript**

*Making development workflows smarter, faster, and more enjoyable.*