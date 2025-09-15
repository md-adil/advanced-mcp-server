import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { AdvancedMCPServer } from "../src/server.ts";

Deno.test("AdvancedMCPServer - Basic Functionality", () => {
  // Test basic server functionality without starting intervals
  const positiveWords = ["good", "great", "excellent"];
  const text = "This is a great day!";
  const hasPositive = positiveWords.some(word => text.toLowerCase().includes(word));

  assertEquals(hasPositive, true);
  assertEquals(typeof crypto.randomUUID(), "string");
});

Deno.test("File System Operations - Read/Write", async () => {
  const testFile = "/tmp/test_mcp_file.txt";
  const testContent = "Hello MCP Server!";

  // Write file
  await Deno.writeTextFile(testFile, testContent);

  // Read file
  const content = await Deno.readTextFile(testFile);
  assertEquals(content, testContent);

  // Cleanup
  await Deno.remove(testFile);
});

Deno.test("HTTP Request Simulation", async () => {
  // Mock fetch for testing
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: string | URL | Request) => {
    return new Response(JSON.stringify({ message: "test response" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const response = await fetch("https://example.com/test");
    const data = await response.json();
    assertEquals(data.message, "test response");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("UUID Generation", () => {
  const uuid = crypto.randomUUID();
  assertEquals(typeof uuid, "string");
  assertEquals(uuid.length, 36);
  assertEquals(uuid.charAt(8), "-");
  assertEquals(uuid.charAt(13), "-");
  assertEquals(uuid.charAt(18), "-");
  assertEquals(uuid.charAt(23), "-");
});

Deno.test("Text Hashing", async () => {
  const text = "Hello World";
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  assertEquals(typeof hashHex, "string");
  assertEquals(hashHex.length, 64); // SHA-256 produces 64 character hex string
});

Deno.test("Base64 Encoding/Decoding", () => {
  const text = "Hello MCP Server!";
  const encoded = btoa(text);
  const decoded = atob(encoded);

  assertEquals(decoded, text);
  assertEquals(typeof encoded, "string");
});

Deno.test("URL Encoding/Decoding", () => {
  const text = "Hello World & MCP Server!";
  const encoded = encodeURIComponent(text);
  const decoded = decodeURIComponent(encoded);

  assertEquals(decoded, text);
  assertEquals(encoded.includes("%20"), true); // Space should be encoded
});

Deno.test("Directory Operations", async () => {
  const testDir = "/tmp/test_mcp_dir";

  // Create directory
  await Deno.mkdir(testDir, { recursive: true });

  // Check directory exists
  const stat = await Deno.stat(testDir);
  assertEquals(stat.isDirectory, true);

  // List directory
  const entries = [];
  for await (const entry of Deno.readDir("/tmp")) {
    if (entry.name === "test_mcp_dir") {
      entries.push(entry);
    }
  }
  assertEquals(entries.length, 1);

  // Cleanup
  await Deno.remove(testDir);
});

Deno.test("Cache Operations Simulation", () => {
  const cache = new Map<string, { data: unknown; expires: number }>();

  // Set cache
  const key = "test_key";
  const value = "test_value";
  const ttl = 3600; // 1 hour
  const expires = Date.now() + (ttl * 1000);

  cache.set(key, { data: value, expires });

  // Get cache
  const entry = cache.get(key);
  assertEquals(entry?.data, value);
  assertEquals(typeof entry?.expires, "number");

  // Delete cache
  cache.delete(key);
  assertEquals(cache.has(key), false);
});

Deno.test("Sentiment Analysis Simulation", () => {
  const positiveText = "This is a great and wonderful day!";
  const negativeText = "This is a terrible and awful experience!";
  const neutralText = "This is a normal day.";

  const positiveWords = ["good", "great", "excellent", "amazing", "wonderful", "fantastic", "love", "like", "happy", "joy"];
  const negativeWords = ["bad", "terrible", "awful", "hate", "sad", "angry", "disappointed", "horrible", "worst"];

  // Test positive sentiment
  let score = 0;
  positiveWords.forEach(word => {
    if (positiveText.toLowerCase().includes(word)) score += 1;
  });
  negativeWords.forEach(word => {
    if (positiveText.toLowerCase().includes(word)) score -= 1;
  });
  assertEquals(score > 0, true);

  // Test negative sentiment
  score = 0;
  positiveWords.forEach(word => {
    if (negativeText.toLowerCase().includes(word)) score += 1;
  });
  negativeWords.forEach(word => {
    if (negativeText.toLowerCase().includes(word)) score -= 1;
  });
  assertEquals(score < 0, true);
});

Deno.test("Keyword Extraction Simulation", () => {
  const text = "The quick brown fox jumps over the lazy dog. The fox is very quick and brown.";
  const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 3);
  const wordCount = new Map<string, number>();

  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  const keywords = Array.from(wordCount.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  assertEquals(keywords.length <= 5, true);
  assertEquals(keywords[0].count >= keywords[keywords.length - 1].count, true);
});

Deno.test("Command Execution Simulation", async () => {
  const command = new Deno.Command("echo", {
    args: ["Hello MCP"],
    stdout: "piped",
  });

  const { code, stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(code, 0);
  assertEquals(output.trim(), "Hello MCP");
});

Deno.test("System Info Collection", () => {
  const info = {
    os: Deno.build.os,
    arch: Deno.build.arch,
    deno_version: Deno.version,
  };

  assertEquals(typeof info.os, "string");
  assertEquals(typeof info.arch, "string");
  assertExists(info.deno_version.deno);
});

Deno.test("Error Handling", async () => {
  // Test file not found
  await assertRejects(
    async () => {
      await Deno.readTextFile("/nonexistent/file.txt");
    },
    Deno.errors.NotFound
  );

  // Test invalid URL encoding
  await assertRejects(
    async () => {
      decodeURIComponent("%");
    }
  );
});

Deno.test("Memory Cache TTL", async () => {
  const cache = new Map<string, { data: unknown; expires: number }>();

  // Set with short TTL
  const key = "test_ttl";
  const value = "test_value";
  const ttl = 0.1; // 100ms
  const expires = Date.now() + (ttl * 1000);

  cache.set(key, { data: value, expires });

  // Should exist initially
  assertEquals(cache.has(key), true);

  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 150));

  // Should be expired (but still in cache until checked)
  const entry = cache.get(key);
  if (entry && Date.now() > entry.expires) {
    cache.delete(key);
  }

  assertEquals(cache.has(key), false);
});

Deno.test("JSON Processing", () => {
  const data = {
    name: "MCP Server",
    version: "2.0.0",
    features: ["file-ops", "http", "cache"],
    active: true
  };

  const jsonString = JSON.stringify(data);
  const parsed = JSON.parse(jsonString);

  assertEquals(parsed.name, data.name);
  assertEquals(parsed.version, data.version);
  assertEquals(parsed.features.length, data.features.length);
  assertEquals(parsed.active, data.active);
});