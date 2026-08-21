package com.sasyam.app;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SasyamServer {
    private static final Path PROJECT_ROOT = Paths.get("").toAbsolutePath();
    private static final Path WEB_ROOT = PROJECT_ROOT.resolve("web").normalize();
    private static final Path PYTHON_SCRIPT = PROJECT_ROOT.resolve("python").resolve("predict.py").normalize();
    
    private static final Path LOCAL_MODEL_DIR = PROJECT_ROOT.resolve("models").normalize();
    private static final String DEFAULT_MODEL_DIR = System.getenv().getOrDefault("SASYAM_MODEL_DIR", LOCAL_MODEL_DIR.toString());
    private static final Path PROJECT_PYTHON = Paths.get(System.getenv().getOrDefault("SASYAM_PYTHON", "python")).normalize();

    private static final String DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
    private static final String DEFAULT_GEMINI_MODEL = "gemini-1.5-flash-latest";
    
    private static final Path PROJECT_SECRETS_FILE = PROJECT_ROOT.resolve("secrets.toml").normalize();
    private static final Path LEGACY_SECRETS_FILE = LOCAL_MODEL_DIR.resolve(".streamlit").resolve("secrets.toml");

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", System.getenv().getOrDefault("SASYAM_PORT", "8080")));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/options", SasyamServer::handleOptions);
        server.createContext("/api/predict", SasyamServer::handlePredict);
        server.createContext("/api/chat", SasyamServer::handleChat);
        server.createContext("/api/save-profile", SasyamServer::handleSaveProfile);
        server.createContext("/", SasyamServer::handleStatic);
        server.setExecutor(Executors.newFixedThreadPool(8));
        server.start();
        System.out.println("SASYAM Java Full Stack App running on port: " + port);
        System.out.println("Model directory: " + DEFAULT_MODEL_DIR);
        System.out.println("Python runtime check: " + PROJECT_PYTHON);
    }

    private static void handleOptions(HttpExchange exchange) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, "{\"ok\":false,\"error\":\"Method not allowed\"}");
            return;
        }
        PythonResult result = runPython("options", "");
        sendJson(exchange, result.exitCode == 0 ? 200 : 500, result.output);
    }

    private static void handlePredict(HttpExchange exchange) throws IOException {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, "{\"ok\":false,\"error\":\"Method not allowed\"}");
            return;
        }
        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        PythonResult result = runPython("predict", body);
        sendJson(exchange, result.exitCode == 0 ? 200 : 500, result.output);
    }

    private static void handleChat(HttpExchange exchange) throws IOException {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, "{\"ok\":false,\"error\":\"Method not allowed\"}");
            return;
        }
        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        sendJson(exchange, 200, chatWithAi(body));
    }

    private static void handleSaveProfile(HttpExchange exchange) throws IOException {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, "{\"ok\":false,\"error\":\"Method not allowed\"}");
            return;
        }
        
        try (InputStream is = exchange.getRequestBody()) {
            String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            sendJson(exchange, 200, "{\"ok\":true}");
        } catch (Exception ex) {
            ex.printStackTrace();
            sendJson(exchange, 500, "{\"ok\":false,\"error\":\"" + escapeJson(ex.getMessage()) + "\"}");
        }
    }

    private static String chatWithAi(String requestJson) {
        String message = jsonString(requestJson, "message", "");
        String lang = jsonString(requestJson, "lang", "en");
        if (message.isBlank()) {
            return "{\"ok\":true,\"reply\":\"Please ask about yield, profit, fertilizer, rainfall, cost, or crop risk.\"}";
        }

        String targetLang = languageName(lang);
        String crop = jsonString(requestJson, "crop", "the crop");
        String state = jsonString(requestJson, "state", "your region");
        String variety = jsonString(requestJson, "variety", "selected variety");
        String season = jsonString(requestJson, "season", "selected season");
        String cropGroup = jsonString(requestJson, "cropGroup", "model group");
        String label = jsonString(requestJson, "label", "Performance status");
        String note = jsonString(requestJson, "note", "");
        double yield = jsonNumber(requestJson, "yield", 0);
        double profit = jsonNumber(requestJson, "profit", 0);
        double revenue = jsonNumber(requestJson, "revenue", 0);
        double cost = jsonNumber(requestJson, "cost", 0);
        double roi = jsonNumber(requestJson, "roi", 0);
        double rainfall = jsonNumber(requestJson, "rainfall", 0);
        double fertilizer = jsonNumber(requestJson, "fertilizer", 0);
        double climateStress = jsonNumber(requestJson, "climateStress", 0);
        double soilNutrient = jsonNumber(requestJson, "soilNutrient", 0);

        String systemRules = """
                ROLE: You are the SASYAM Intelligence Core v3.1, developed by Souvik Chakraborty.
                DOMAIN: Yield, Profit, and Crop Analytics.
                LANGUAGE: CRITICAL. Respond strictly in %s in a natural conversational tone.

                FERTILIZER PROTOCOL:
                - Analyze nutrient efficiency, rainfall, and cost together.
                - If rainfall is low, warn that extra fertilizer can reduce profit due to poor uptake.
                - Give concise, practical, farmer-facing advice.

                PROBABILITY PROTOCOL:
                - Use crop group, model status, ROI, yield, revenue, cost, and profit to explain likely success.
                - Stay inside yield/profit/crop analytics. Do not output raw JSON or system logs.
                """.formatted(targetLang);

        String userPrompt = """
                ANALYSIS DATA:
                - Crop/State: %s in %s
                - Variety/Season: %s / %s
                - Crop group: %s
                - Yield: %.2f Q/Ha
                - Revenue: Rs. %.0f
                - Cost: Rs. %.0f
                - Profit: Rs. %.0f
                - ROI: %.1f%%
                - Rainfall: %.0f mm
                - Fertilizer: %.1f kg/ha
                - Climate Stress Index: %.1f
                - Soil Nutrient Index: %.2f
                - Status: %s
                - Engine note: %s

                USER QUERY: %s
                """.formatted(crop, state, variety, season, cropGroup, yield, revenue, cost, profit, roi, rainfall, fertilizer, climateStress, soilNutrient, label, note, message);

        String groqKey = secret("GROQ_API_KEY");
        if (!groqKey.isBlank()) {
            try {
                String reply = callGroq(groqKey, systemRules, userPrompt);
                if (!reply.isBlank()) return "{\"ok\":true,\"reply\":\"" + escapeJson(reply) + "\"}";
            } catch (Exception e) {
                System.err.println("Groq API error: " + e.getMessage());
            }
        }

        String geminiKey = secret("GEMINI_API_KEY");
        if (geminiKey.isBlank()) geminiKey = secret("GOOGLE_API_KEY");
        if (!geminiKey.isBlank()) {
            try {
                String reply = callGemini(geminiKey, systemRules, userPrompt);
                if (!reply.isBlank()) return "{\"ok\":true,\"reply\":\"" + escapeJson(reply) + "\"}";
            } catch (Exception e) {
                System.err.println("Gemini API error: " + e.getMessage());
            }
        }

        // FIX 3: If APIs fail, this fallback now speaks in natural language dialogue!
        String fallback = localizedFallback(lang, crop, state, yield, profit, roi, label, note);
        return "{\"ok\":true,\"reply\":\"" + escapeJson(fallback) + "\"}";
    }

    private static String localizedFallback(String lang, String crop, String state, double yield, double profit, double roi, String label, String note) {
        String yStr = String.format("%.2f", yield);
        String pStr = String.format("%.0f", profit);
        String rStr = String.format("%.1f", roi);

        return switch (lang) {
            case "hi" -> "नमस्ते! " + state + " में " + crop + " के लिए अनुमानित उपज " + yStr + " Q/Ha है। इससे Rs. " + pStr + " का लाभ (" + rStr + "% ROI) हो सकता है। स्थिति: " + label + "। " + note;
            case "bn" -> "নমস্কার! " + state + " তে " + crop + " এর জন্য আনুমানিক ফলন " + yStr + " Q/Ha। এতে Rs. " + pStr + " লাভ (" + rStr + "% ROI) হতে পারে। অবস্থা: " + label + "। " + note;
            case "te" -> "నమస్కారం! " + state + " లో " + crop + " అంచనా దిగుబడి " + yStr + " Q/Ha. నికర లాభం Rs. " + pStr + " (" + rStr + "% ROI). స్థితి: " + label + ". " + note;
            case "ta" -> "வணக்கம்! " + state + " மாநிலத்தின் " + crop + " மகசூல் " + yStr + " Q/Ha. லாபம் Rs. " + pStr + " (" + rStr + "% ROI). நிலை: " + label + ". " + note;
            case "mr" -> "नमस्कार! " + state + " मध्ये " + crop + " चे अंदाजित उत्पादन " + yStr + " Q/Ha आहे. निव्वळ नफा Rs. " + pStr + " (" + rStr + "% ROI). स्थिती: " + label + ". " + note;
            case "gu" -> "નમસ્તે! " + state + " માં " + crop + " ની ઉપજ " + yStr + " Q/Ha છે. નફો Rs. " + pStr + " (" + rStr + "% ROI). સ્થિતિ: " + label + ". " + note;
            case "kn" -> "ನಮಸ್ಕಾರ! " + state + " ನಲ್ಲಿ " + crop + " ಇಳುವರಿ " + yStr + " Q/Ha. ಲಾಭ Rs. " + pStr + " (" + rStr + "% ROI). ಸ್ಥಿತಿ: " + label + ". " + note;
            case "ml" -> "നമസ്കാരം! " + state + " ൽ " + crop + " വിളവ് " + yStr + " Q/Ha. ലാഭം Rs. " + pStr + " (" + rStr + "% ROI). നില: " + label + ". " + note;
            case "pa" -> "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! " + state + " ਵਿੱਚ " + crop + " ਦੀ ਪੈਦਾਵਾਰ " + yStr + " Q/Ha ਹੈ। ਮੁਨਾਫਾ Rs. " + pStr + " (" + rStr + "% ROI)। ਸਥਿਤੀ: " + label + ". " + note;
            case "ne" -> "नमस्ते! " + state + " मा " + crop + " को उपज " + yStr + " Q/Ha छ। नाफा Rs. " + pStr + " (" + rStr + "% ROI)। स्थिति: " + label + "। " + note;
            default -> "Hello! The predicted yield for " + crop + " in " + state + " is " + yStr + " Q/Ha. This generates a net profit of Rs. " + pStr + " (" + rStr + "% ROI). Status: " + label + ". " + note;
        };
    }

    private static String callGroq(String apiKey, String systemRules, String userPrompt) throws IOException, InterruptedException {
        String model = System.getenv().getOrDefault("SASYAM_GROQ_MODEL", DEFAULT_GROQ_MODEL);
        String payload = """
                {
                  "model": "%s",
                  "messages": [
                    {"role": "system", "content": "%s"},
                    {"role": "user", "content": "%s"}
                  ],
                  "temperature": 0.4,
                  "max_tokens": 700
                }
                """.formatted(escapeJson(model), escapeJson(systemRules), escapeJson(userPrompt));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                .timeout(Duration.ofSeconds(45))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                .build();
        HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() >= 300) {
            throw new IOException("Groq API error: " + response.body());
        }
        
        // FIX 2: Bulletproof JSON extraction for Groq
        // Using a more restrictive pattern to handle escaped quotes better
        String responseBody = response.body();
        Matcher matcher = Pattern.compile("\"content\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"").matcher(responseBody);
        if (matcher.find()) return unescapeJson(matcher.group(1));
        return "";
    }

    private static String callGemini(String apiKey, String systemRules, String userPrompt) throws IOException, InterruptedException {
        String model = System.getenv().getOrDefault("SASYAM_GEMINI_MODEL", DEFAULT_GEMINI_MODEL);
        String payload = """
                {
                  "system_instruction": {"parts": [{"text": "%s"}]},
                  "contents": [{"parts": [{"text": "%s"}]}],
                  "generationConfig": {"temperature": 0.4, "maxOutputTokens": 700}
                }
                """.formatted(escapeJson(systemRules), escapeJson(userPrompt));
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
        
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(45))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                .build();
        HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() >= 300) throw new IOException(response.body());
        
        Matcher matcher = Pattern.compile("\"text\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"").matcher(response.body());
        if (matcher.find()) return unescapeJson(matcher.group(1));
        return "";
    }

    private static String secret(String name) {
        String projectSecret = readSecretFile(PROJECT_SECRETS_FILE, name);
        if (!projectSecret.isBlank()) return projectSecret;
        String env = System.getenv(name);
        if (env != null && !env.isBlank()) return env.trim();
        return readSecretFile(LEGACY_SECRETS_FILE, name);
    }

    private static String readSecretFile(Path path, String name) {
        try {
            if (!Files.exists(path)) return "";
            String content = Files.readString(path, StandardCharsets.UTF_8);
            Matcher matcher = Pattern.compile("(?m)^\\s*" + Pattern.quote(name) + "\\s*=\\s*[\"']([^\"']+)[\"']").matcher(content);
            if (matcher.find()) return matcher.group(1).trim();
        } catch (IOException e) {
            // silent fail
        }
        return "";
    }

    private static String languageName(String code) {
        return switch (code) {
            case "hi" -> "Hindi";
            case "bn" -> "Bengali";
            case "te" -> "Telugu";
            case "ta" -> "Tamil";
            case "mr" -> "Marathi";
            case "gu" -> "Gujarati";
            case "kn" -> "Kannada";
            case "ml" -> "Malayalam";
            case "pa" -> "Punjabi";
            case "ne" -> "Nepali";
            default -> "English";
        };
    }

    private static void handleStatic(HttpExchange exchange) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendText(exchange, 405, "Method not allowed", "text/plain; charset=utf-8");
            return;
        }

        String rawPath = URLDecoder.decode(exchange.getRequestURI().getPath(), StandardCharsets.UTF_8);
        if (rawPath.equals("/")) rawPath = "/index.html";

        Path requested = WEB_ROOT.resolve(rawPath.substring(1)).normalize();
        if (!requested.startsWith(WEB_ROOT) || !Files.exists(requested) || Files.isDirectory(requested)) {
            sendText(exchange, 404, "Not found", "text/plain; charset=utf-8");
            return;
        }

        byte[] bytes = Files.readAllBytes(requested);
        exchange.getResponseHeaders().set("Content-Type", mimeType(requested));
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static PythonResult runPython(String mode, String inputJson) {
        List<List<String>> candidates = new ArrayList<>();
        String configuredPython = System.getenv("SASYAM_PYTHON");
        if (configuredPython != null && !configuredPython.isBlank()) candidates.add(List.of(configuredPython));
        candidates.add(List.of(PROJECT_PYTHON.toString()));
        candidates.add(List.of("python"));

        StringBuilder failures = new StringBuilder();
        for (List<String> candidate : candidates) {
            try {
                if (candidate.size() == 1 && candidate.get(0).contains("\\") && !Files.exists(Paths.get(candidate.get(0)))) {
                    continue;
                }

                List<String> command = new ArrayList<>(candidate);
                command.add(PYTHON_SCRIPT.toString());
                command.add(mode);

                ProcessBuilder pb = new ProcessBuilder(command);
                pb.directory(PROJECT_ROOT.toFile());
                Map<String, String> env = pb.environment();
                
                // FIX: Explicitly mapping environmental keys into Python builder
                env.put("SASYAM_MODEL_DIR", DEFAULT_MODEL_DIR);
                env.put("PYTHONIOENCODING", "utf-8");
                if (System.getenv("GROQ_API_KEY") != null) env.put("GROQ_API_KEY", System.getenv("GROQ_API_KEY"));
                if (System.getenv("GEMINI_API_KEY") != null) env.put("GEMINI_API_KEY", System.getenv("GEMINI_API_KEY"));

                Process process = pb.start();
                try (OutputStream stdin = process.getOutputStream()) {
                    stdin.write(inputJson.getBytes(StandardCharsets.UTF_8));
                }

                CompletableFuture<String> stdoutFuture = CompletableFuture.supplyAsync(() -> readStream(process.getInputStream()));
                CompletableFuture<String> stderrFuture = CompletableFuture.supplyAsync(() -> readStream(process.getErrorStream()));

                boolean finished = process.waitFor(90, java.util.concurrent.TimeUnit.SECONDS);
                if (!finished) {
                    process.destroyForcibly();
                    return new PythonResult(500, "{\"ok\":false,\"error\":\"Python inference timed out\"}");
                }

                String out = stdoutFuture.join().trim();
                String err = stderrFuture.join().trim();
                if (process.exitValue() == 0 && !out.isBlank()) return new PythonResult(0, out);
                if (!err.isBlank()) failures.append("Python stderr: ").append(err).append(" ");
            } catch (Exception ex) {
                failures.append("Failed: ").append(ex.getMessage()).append(" ");
            }
        }
        return new PythonResult(500, "{\"ok\":false,\"error\":\"Python runtime is not ready.\"}");
    }

    private static String readStream(InputStream stream) {
        try {
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "";
        }
    }

    private static void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void sendText(HttpExchange exchange, int status, String text, String contentType) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", contentType);
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String mimeType(Path path) {
        String name = path.getFileName().toString().toLowerCase();
        if (name.endsWith(".html")) return "text/html; charset=utf-8";
        if (name.endsWith(".css")) return "text/css; charset=utf-8";
        if (name.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    private static String jsonString(String json, String key, String fallback) {
        Matcher matcher = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"((?:\\\\.|[^\"])*)\"").matcher(json);
        if (!matcher.find()) return fallback;
        return unescapeJson(matcher.group(1));
    }

    private static double jsonNumber(String json, String key, double fallback) {
        Matcher matcher = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)").matcher(json);
        if (!matcher.find()) return fallback;
        try {
            return Double.parseDouble(matcher.group(1));
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static String unescapeJson(String value) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c != '\\' || i + 1 >= value.length()) {
                out.append(c);
                continue;
            }
            char next = value.charAt(++i);
            switch (next) {
                case '"' -> out.append('"');
                case '\\' -> out.append('\\');
                case '/' -> out.append('/');
                case 'n' -> out.append('\n');
                case 'r' -> out.append('\r');
                case 't' -> out.append('\t');
                case 'b' -> out.append('\b');
                case 'f' -> out.append('\f');
                case 'u' -> {
                    if (i + 4 < value.length()) {
                        String hex = value.substring(i + 1, i + 5);
                        try {
                            out.append((char) Integer.parseInt(hex, 16));
                            i += 4;
                        } catch (NumberFormatException ex) {
                            out.append("\\u").append(hex);
                            i += 4;
                        }
                    } else {
                        out.append("\\u");
                    }
                }
                default -> out.append(next);
            }
        }
        return out.toString();
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }

    private record PythonResult(int exitCode, String output) {}
}
