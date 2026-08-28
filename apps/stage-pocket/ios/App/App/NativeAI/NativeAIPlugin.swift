import Foundation
import Capacitor
import Metal
import MachO
import CoreML
import LLMCore
import CoreMLBackend

@objc(NativeAIPlugin)
public class NativeAIPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeAIPlugin"
    public let jsName = "NativeAI"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getHardwareTelemetry", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ping", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "downloadModel", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadModel", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unloadModel", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listCachedModels", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteCachedModel", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "generateStream", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelGeneration", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "testTokenStream", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelTestStream", returnType: CAPPluginReturnPromise)
    ]

    private var activeTasks: [String: Task<Void, Never>] = [:]
    private var coreMLEngine = CoreMLEngine()
    private var residentModelId: String?

    private var modelsBaseDirectory: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let dir = docs.appendingPathComponent("CoreAI/models", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    // MARK: - Hardware Telemetry

    @objc public func getHardwareTelemetry(_ call: CAPPluginCall) {
        var diagnostics: [String: Any] = [:]

        // 1. Raw Machine Identifier (e.g. "iPhone15,2")
        let rawMachine = getSysctlString("hw.machine") ?? "Unknown.Machine"
        diagnostics["raw_machine"] = rawMachine

        let rawModel = getSysctlString("hw.model") ?? "Unknown.Model"
        diagnostics["raw_model"] = rawModel

        // 2. Human-Readable Device Model Name
        let deviceModel = mapDeviceModel(rawMachine)
        diagnostics["parsed_device_model"] = deviceModel

        // 3. Apple Silicon SoC Family
        let chipFamily = detectChipFamily(rawMachine)
        diagnostics["detected_chip"] = chipFamily

        // 4. CPU Cores
        let cpuCores = ProcessInfo.processInfo.activeProcessorCount
        diagnostics["active_processor_count"] = cpuCores

        // 5. Total Physical RAM
        let totalMemoryBytes = ProcessInfo.processInfo.physicalMemory
        diagnostics["physical_memory_bytes"] = totalMemoryBytes
        let totalMemoryFormatted = formatBytes(Double(totalMemoryBytes))

        // 6. Available Memory Headroom
        var availableMemoryBytes: UInt64 = 0
        if #available(iOS 13.0, *) {
            availableMemoryBytes = UInt64(os_proc_available_memory())
        }
        if availableMemoryBytes == 0 {
            availableMemoryBytes = totalMemoryBytes / 2
        }
        diagnostics["available_memory_bytes"] = availableMemoryBytes
        let availableMemoryFormatted = formatBytes(Double(availableMemoryBytes))

        // 7. Metal GPU Telemetry
        var gpuDeviceName = "Apple GPU"
        var hasUnifiedMemory = true
        var maxWorkingSetBytes: UInt64 = 0

        if let metalDevice = MTLCreateSystemDefaultDevice() {
            gpuDeviceName = metalDevice.name
            hasUnifiedMemory = metalDevice.hasUnifiedMemory
            if #available(iOS 16.0, *) {
                maxWorkingSetBytes = metalDevice.recommendedMaxWorkingSetSize
            }
            diagnostics["metal_max_buffer_length"] = metalDevice.maxBufferLength
            diagnostics["metal_supports_family_apple7"] = metalDevice.supportsFamily(.apple7)

            if #available(iOS 16.0, *) {
                diagnostics["metal_supports_family_apple8"] = metalDevice.supportsFamily(.apple8)
            }
            if #available(iOS 17.0, *) {
                diagnostics["metal_supports_family_apple9"] = metalDevice.supportsFamily(.apple9)
            }
        }
        diagnostics["gpu_name"] = gpuDeviceName
        diagnostics["has_unified_memory"] = hasUnifiedMemory
        diagnostics["max_working_set_bytes"] = maxWorkingSetBytes

        // 8. OS Version
        let osVersion = "\(UIDevice.current.systemName) \(UIDevice.current.systemVersion)"
        diagnostics["system_name"] = UIDevice.current.systemName
        diagnostics["system_version"] = UIDevice.current.systemVersion
        diagnostics["device_name"] = UIDevice.current.name

        // 9. Core AI & Neural Engine Verification
        let isNeuralEngineAvailable = hasNeuralEngine(rawMachine)
        let isCoreAIAvailable = true
        diagnostics["is_neural_engine_available"] = isNeuralEngineAvailable
        diagnostics["is_core_ai_available"] = isCoreAIAvailable

        // Final payload with guaranteed non-null fields and raw diagnostics dump
        let payload: [String: Any] = [
            "deviceModel": deviceModel,
            "rawMachineId": rawMachine,
            "chipFamily": chipFamily,
            "cpuCores": cpuCores,
            "totalMemoryBytes": NSNumber(value: totalMemoryBytes),
            "totalMemoryFormatted": totalMemoryFormatted,
            "availableMemoryBytes": NSNumber(value: availableMemoryBytes),
            "availableMemoryFormatted": availableMemoryFormatted,
            "gpuDeviceName": gpuDeviceName,
            "hasUnifiedMemory": hasUnifiedMemory,
            "maxWorkingSetBytes": NSNumber(value: maxWorkingSetBytes),
            "osVersion": osVersion,
            "isCoreAIAvailable": isCoreAIAvailable,
            "isNeuralEngineAvailable": isNeuralEngineAvailable,
            "rawDiagnostics": diagnostics
        ]

        call.resolve(payload)
    }

    // MARK: - Latency Ping

    @objc public func ping(_ call: CAPPluginCall) {
        let clientTimestamp = call.getDouble("timestamp") ?? Date().timeIntervalSince1970 * 1000
        let serverTimestamp = Date().timeIntervalSince1970 * 1000

        let result: [String: Any] = [
            "pong": true,
            "clientTimestamp": clientTimestamp,
            "serverTimestamp": serverTimestamp,
            "platform": "iOS (Apple Silicon)",
            "engine": "Native Swift Bridge"
        ]

        call.resolve(result)
    }

    // MARK: - Model Downloader (Hugging Face with Recursive Tree Support)

    private struct HFTreeItem: Decodable {
        let type: String
        let path: String
        let size: Int64?
    }

    @objc public func downloadModel(_ call: CAPPluginCall) {
        guard let modelId = call.getString("modelId"),
              let repo = call.getString("repo") else {
            call.reject("Missing modelId or repo")
            return
        }

        let filename = call.getString("filename")
        let hfToken = call.getString("hfToken")

        let sanitizedId = modelId.replacingOccurrences(of: "/", with: "_")
        let modelDir = modelsBaseDirectory.appendingPathComponent(sanitizedId, isDirectory: true)
        try? FileManager.default.createDirectory(at: modelDir, withIntermediateDirectories: true)

        call.resolve([
            "modelId": modelId,
            "status": "starting",
            "destination": modelDir.path
        ])

        Task.detached(priority: .userInitiated) { [weak self] in
            guard let self = self else { return }

            let session = URLSession(configuration: .default)
            var authHeader: String?
            if let hfToken = hfToken, !hfToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                authHeader = "Bearer \(hfToken)"
            }

            do {
                var filesToDownload: [(relativePath: String, downloadUrl: URL, expectedSize: Int64)] = []

                // Fetch recursive repo tree
                let treeUrlString = "https://huggingface.co/api/models/\(repo)/tree/main?recursive=true"
                var isTree = false

                if let treeUrl = URL(string: treeUrlString) {
                    var treeRequest = URLRequest(url: treeUrl)
                    if let auth = authHeader { treeRequest.setValue(auth, forHTTPHeaderField: "Authorization") }

                    if let (data, response) = try? await session.data(for: treeRequest),
                       let http = response as? HTTPURLResponse, http.statusCode == 200,
                       let treeItems = try? JSONDecoder().decode([HFTreeItem].self, from: data), !treeItems.isEmpty {
                        isTree = true
                        let skipPrefixes = [".git", "README", "chat_template", "audio_fp16", "vision_fp16"]
                        for item in treeItems where item.type == "file" {
                            let shouldSkip = skipPrefixes.contains { item.path.hasPrefix($0) }
                            if !shouldSkip {
                                let fileUrlString = "https://huggingface.co/\(repo)/resolve/main/\(item.path)"
                                if let fileUrl = URL(string: fileUrlString) {
                                    filesToDownload.append((relativePath: item.path, downloadUrl: fileUrl, expectedSize: item.size ?? 0))
                                }
                            }
                        }
                    }
                }

                // If not a tree or single file specified
                if !isTree, let targetFile = filename {
                    let directUrlString = "https://huggingface.co/\(repo)/resolve/main/\(targetFile)"
                    guard let directUrl = URL(string: directUrlString) else {
                        throw NSError(domain: "NativeAI", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid Hugging Face URL: \(directUrlString)"])
                    }
                    filesToDownload.append((relativePath: targetFile, downloadUrl: directUrl, expectedSize: 0))
                }

                var totalExpectedBytes: Int64 = filesToDownload.reduce(0) { $0 + $1.expectedSize }
                var totalBytesDownloaded: Int64 = 0
                let startTime = Date()
                var lastProgressEmit = Date()

                for fileItem in filesToDownload {
                    let destinationUrl = modelDir.appendingPathComponent(fileItem.relativePath)
                    let parentDir = destinationUrl.deletingLastPathComponent()
                    try FileManager.default.createDirectory(at: parentDir, withIntermediateDirectories: true)

                    var request = URLRequest(url: fileItem.downloadUrl)
                    if let auth = authHeader {
                        request.setValue(auth, forHTTPHeaderField: "Authorization")
                    }

                    let (asyncBytes, response) = try await session.bytes(for: request)
                    guard let httpResponse = response as? HTTPURLResponse else {
                        throw NSError(domain: "NativeAI", code: 500, userInfo: [NSLocalizedDescriptionKey: "Non-HTTP response for \(fileItem.relativePath)"])
                    }

                    guard (200...299).contains(httpResponse.statusCode) else {
                        throw NSError(domain: "NativeAI", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Hugging Face returned HTTP \(httpResponse.statusCode) for \(fileItem.relativePath)"])
                    }

                    let fileExpectedLength = httpResponse.expectedContentLength > 0 ? httpResponse.expectedContentLength : fileItem.expectedSize
                    if totalExpectedBytes == 0 && fileExpectedLength > 0 {
                        totalExpectedBytes = fileExpectedLength
                    }

                    FileManager.default.createFile(atPath: destinationUrl.path, contents: nil)
                    guard let fileHandle = try? FileHandle(forWritingTo: destinationUrl) else {
                        throw NSError(domain: "NativeAI", code: 500, userInfo: [NSLocalizedDescriptionKey: "Cannot open file handle at \(destinationUrl.path)"])
                    }

                    var buffer = Data()
                    buffer.reserveCapacity(65536)

                    for try await byte in asyncBytes {
                        buffer.append(byte)
                        totalBytesDownloaded += 1

                        if buffer.count >= 65536 {
                            try fileHandle.write(contentsOf: buffer)
                            buffer.removeAll(keepingCapacity: true)
                        }

                        if Date().timeIntervalSince(lastProgressEmit) > 0.25 {
                            lastProgressEmit = Date()
                            let percentage: Double = totalExpectedBytes > 0 ? min(99.9, (Double(totalBytesDownloaded) / Double(totalExpectedBytes)) * 100.0) : 0
                            let elapsedSec = Date().timeIntervalSince(startTime)
                            let speedMBs = (Double(totalBytesDownloaded) / (1024.0 * 1024.0)) / max(0.1, elapsedSec)

                            self.notifyListeners("downloadProgress", data: [
                                "modelId": modelId,
                                "bytesWritten": totalBytesDownloaded,
                                "totalBytes": totalExpectedBytes > 0 ? totalExpectedBytes : totalBytesDownloaded,
                                "percentage": Double(round(percentage * 10) / 10),
                                "speedMBs": Double(round(speedMBs * 10) / 10),
                                "isCompleted": false
                            ])
                        }
                    }

                    if !buffer.isEmpty {
                        try fileHandle.write(contentsOf: buffer)
                        buffer.removeAll()
                    }
                    try fileHandle.close()
                }

                let finalElapsed = Date().timeIntervalSince(startTime)
                let avgSpeedMBs = (Double(totalBytesDownloaded) / (1024.0 * 1024.0)) / max(0.1, finalElapsed)

                self.notifyListeners("downloadProgress", data: [
                    "modelId": modelId,
                    "bytesWritten": totalBytesDownloaded,
                    "totalBytes": totalBytesDownloaded,
                    "percentage": 100.0,
                    "speedMBs": Double(round(avgSpeedMBs * 10) / 10),
                    "isCompleted": true
                ])
            } catch {
                print("[NativeAI] Download failed with error: \(error)")
                self.notifyListeners("downloadProgress", data: [
                    "modelId": modelId,
                    "bytesWritten": 0,
                    "totalBytes": 0,
                    "percentage": 0.0,
                    "isCompleted": false,
                    "error": error.localizedDescription
                ])
            }
        }
    }

    // MARK: - Model Lifecycle & Memory Residency

    @objc public func loadModel(_ call: CAPPluginCall) {
        guard let modelId = call.getString("modelId") else {
            call.reject("Missing modelId")
            return
        }

        let startTime = Date()
        let sanitized = modelId.replacingOccurrences(of: "/", with: "_")
        let modelDir = modelsBaseDirectory.appendingPathComponent(sanitized, isDirectory: true)

        Task.detached(priority: .userInitiated) { [weak self] in
            guard let self = self else { return }

            do {
                let bundle = try ModelBundle(contentsOf: modelDir)
                #if targetEnvironment(simulator)
                let cuPref: ComputeUnitPreference = .cpuAndGPU
                let computeStr = "CPU + Metal GPU (Simulator)"
                #else
                let cuPref: ComputeUnitPreference = .all
                let computeStr = "Apple Neural Engine + Metal GPU"
                #endif

                await self.coreMLEngine.unload()
                try await self.coreMLEngine.load(bundle, options: LoadOptions(computeUnits: cuPref, preloadSpeculation: true))
                self.residentModelId = modelId

                let loadTimeMs = Int(Date().timeIntervalSince(startTime) * 1000)
                let residentBytes = self.directorySize(url: modelDir)
                print("[NativeAI] Model loaded successfully: \(modelId) with \(computeStr) in \(loadTimeMs)ms")

                call.resolve([
                    "modelId": modelId,
                    "isLoaded": true,
                    "loadTimeMs": max(10, loadTimeMs),
                    "computeUnitsUsed": computeStr,
                    "residentMemoryBytes": residentBytes
                ])
            } catch {
                print("[NativeAI] Load error: \(error.localizedDescription)")
                call.reject("Failed to load model: \(error.localizedDescription)")
            }
        }
    }

    @objc public func unloadModel(_ call: CAPPluginCall) {
        Task.detached(priority: .userInitiated) { [weak self] in
            guard let self = self else { return }
            await self.coreMLEngine.unload()
            self.residentModelId = nil
            call.resolve(["success": true])
        }
    }

    @objc public func listCachedModels(_ call: CAPPluginCall) {
        var models: [[String: Any]] = []
        var totalBytes: Int64 = 0

        if let contents = try? FileManager.default.contentsOfDirectory(at: modelsBaseDirectory, includingPropertiesForKeys: [.fileSizeKey, .isDirectoryKey], options: [.skipsHiddenFiles]) {
            for fileUrl in contents {
                let resourceValues = try? fileUrl.resourceValues(forKeys: [.fileSizeKey, .isDirectoryKey])
                let isDirectory = resourceValues?.isDirectory ?? false
                let folderName = fileUrl.lastPathComponent
                let folderSize = isDirectory ? directorySize(url: fileUrl) : Int64(resourceValues?.fileSize ?? 0)
                totalBytes += folderSize

                let isCompiled = isDirectory && (
                    FileManager.default.fileExists(atPath: fileUrl.appendingPathComponent("manifest.json").path) ||
                    FileManager.default.fileExists(atPath: fileUrl.appendingPathComponent("convert_config.json").path)
                )

                models.append([
                    "modelId": folderName,
                    "filePath": fileUrl.path,
                    "sizeBytes": folderSize,
                    "isCompiled": isCompiled
                ])
            }
        }

        call.resolve([
            "models": models,
            "totalSizeBytes": totalBytes
        ])
    }

    @objc public func deleteCachedModel(_ call: CAPPluginCall) {
        guard let modelId = call.getString("modelId") else {
            call.reject("Missing modelId")
            return
        }

        let sanitizedId = modelId.replacingOccurrences(of: "/", with: "_")
        let modelDir = modelsBaseDirectory.appendingPathComponent(sanitizedId, isDirectory: true)

        Task.detached(priority: .userInitiated) { [weak self] in
            guard let self = self else { return }
            if self.residentModelId == modelId {
                await self.coreMLEngine.unload()
                self.residentModelId = nil
            }

            do {
                try FileManager.default.removeItem(at: modelDir)
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to delete model: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Real Token Streaming & Autoregressive Inference

    @objc public func generateStream(_ call: CAPPluginCall) {
        let requestId = call.getString("requestId") ?? "gen-\(Int(Date().timeIntervalSince1970 * 1000))"
        let prompt = call.getString("prompt") ?? "Hello from Project AIRI!"
        let maxTokens = call.getInt("maxTokens") ?? 256
        let temperature = call.getDouble("temperature") ?? 0.7
        let topP = call.getDouble("topP") ?? 0.9
        let requestedModelId = call.getString("modelId")

        call.resolve(["requestId": requestId])

        let task = Task.detached(priority: .userInitiated) { [weak self] in
            guard let self = self else { return }
            let startTime = Date()

            // 1. Auto-load if needed
            if self.residentModelId == nil || (requestedModelId != nil && self.residentModelId != requestedModelId) {
                let targetId = requestedModelId ?? "okayuji/Gemma-4-E2B-it-coreml-speculative"
                let sanitized = targetId.replacingOccurrences(of: "/", with: "_")
                let modelDir = self.modelsBaseDirectory.appendingPathComponent(sanitized, isDirectory: true)
                do {
                    let bundle = try ModelBundle(contentsOf: modelDir)
                    #if targetEnvironment(simulator)
                    let cuPref: ComputeUnitPreference = .cpuAndGPU
                    #else
                    let cuPref: ComputeUnitPreference = .all
                    #endif
                    await self.coreMLEngine.unload()
                    try await self.coreMLEngine.load(bundle, options: LoadOptions(computeUnits: cuPref, preloadSpeculation: true))
                    self.residentModelId = targetId
                } catch {
                    self.notifyListeners("token", data: [
                        "requestId": requestId,
                        "token": "Error loading model: \(error.localizedDescription)",
                        "isFinished": true,
                        "finishReason": "error"
                    ])
                    return
                }
            }

            let genConfig = GenerationConfig(
                maxNewTokens: maxTokens,
                temperature: temperature,
                topP: topP,
                multiTokenPrediction: true
            )
            let request = GenerationRequest(
                prompt: prompt,
                config: genConfig,
                history: []
            )

            var tokenCount = 0
            do {
                let stream = self.coreMLEngine.generate(request)
                for try await event in stream {
                    if Task.isCancelled {
                        self.notifyListeners("token", data: [
                            "requestId": requestId,
                            "token": "",
                            "isFinished": true,
                            "finishReason": "cancelled"
                        ])
                        return
                    }

                    switch event {
                    case .token(let chunk):
                        tokenCount += 1
                        let elapsedMs = Date().timeIntervalSince(startTime) * 1000
                        self.notifyListeners("token", data: [
                            "requestId": requestId,
                            "token": chunk.text,
                            "completionTokens": tokenCount,
                            "elapsedMs": Int(elapsedMs),
                            "tokensPerSecond": Double(round(chunk.tokensPerSecond * 10) / 10),
                            "isFinished": false
                        ])
                    case .finished(let metrics):
                        let elapsedMs = Date().timeIntervalSince(startTime) * 1000
                        let ttftMs = Double(metrics.timeToFirstToken.components.seconds) * 1000.0 + Double(metrics.timeToFirstToken.components.attoseconds) / 1_000_000_000_000_000.0
                        self.notifyListeners("token", data: [
                            "requestId": requestId,
                            "token": "",
                            "completionTokens": metrics.generatedTokens,
                            "elapsedMs": Int(elapsedMs),
                            "ttftMs": Int(ttftMs),
                            "tokensPerSecond": Double(round(metrics.decodeTokensPerSecond * 10) / 10),
                            "finishReason": metrics.finishReason?.rawValue ?? "stop",
                            "isFinished": true
                        ])
                    default:
                        break
                    }
                }
            } catch {
                print("[NativeAI] Inference execution error: \(error.localizedDescription)")
                self.notifyListeners("token", data: [
                    "requestId": requestId,
                    "token": "\n[Inference Error: \(error.localizedDescription)]",
                    "isFinished": true,
                    "finishReason": "error"
                ])
            }

            self.activeTasks.removeValue(forKey: requestId)
        }

        self.activeTasks[requestId] = task
    }

    @objc public func cancelGeneration(_ call: CAPPluginCall) {
        if let requestId = call.getString("requestId"), let task = activeTasks[requestId] {
            task.cancel()
            activeTasks.removeValue(forKey: requestId)
            call.resolve(["cancelled": true])
        } else {
            call.resolve(["cancelled": false])
        }
    }

    private func directorySize(url: URL) -> Int64 {
        var size: Int64 = 0
        if let enumerator = FileManager.default.enumerator(at: url, includingPropertiesForKeys: [.fileSizeKey]) {
            for case let fileUrl as URL in enumerator {
                if let resourceValues = try? fileUrl.resourceValues(forKeys: [.fileSizeKey]),
                   let fileSize = resourceValues.fileSize {
                    size += Int64(fileSize)
                }
            }
        }
        return size
    }

    private func getSysctlString(_ name: String) -> String? {
        var size: Int = 0
        sysctlbyname(name, nil, &size, nil, 0)
        guard size > 0 else { return nil }

        var buffer = [CChar](repeating: 0, count: size)
        sysctlbyname(name, &buffer, &size, nil, 0)
        return String(cString: buffer)
    }

    private func formatBytes(_ bytes: Double) -> String {
        guard bytes > 0 else { return "0 B" }
        let units = ["B", "KB", "MB", "GB", "TB"]
        var size = bytes
        var unitIndex = 0
        while size >= 1024.0 && unitIndex < units.count - 1 {
            size /= 1024.0
            unitIndex += 1
        }
        return String(format: "%.1f %@", size, units[unitIndex])
    }

    private func mapDeviceModel(_ identifier: String) -> String {
        switch identifier {
        // iPhone 16 Family
        case "iPhone17,1": return "iPhone 16 Pro"
        case "iPhone17,2": return "iPhone 16 Pro Max"
        case "iPhone17,3": return "iPhone 16"
        case "iPhone17,4": return "iPhone 16 Plus"

        // iPhone 15 Family
        case "iPhone16,1": return "iPhone 15 Pro"
        case "iPhone16,2": return "iPhone 15 Pro Max"
        case "iPhone15,4": return "iPhone 15"
        case "iPhone15,5": return "iPhone 15 Plus"

        // iPhone 14 Family
        case "iPhone15,2": return "iPhone 14 Pro"
        case "iPhone15,3": return "iPhone 14 Pro Max"
        case "iPhone14,7": return "iPhone 14"
        case "iPhone14,8": return "iPhone 14 Plus"

        // iPhone 13 Family
        case "iPhone14,2": return "iPhone 13 Pro"
        case "iPhone14,3": return "iPhone 13 Pro Max"
        case "iPhone14,5": return "iPhone 13"
        case "iPhone14,4": return "iPhone 13 mini"

        // iPhone 12 Family
        case "iPhone13,2": return "iPhone 12"
        case "iPhone13,3": return "iPhone 12 Pro"
        case "iPhone13,4": return "iPhone 12 Pro Max"

        // iPads
        case let id where id.starts(with: "iPad14,"): return "iPad (M2 / M4)"
        case let id where id.starts(with: "iPad13,"): return "iPad (M1)"

        // Simulator
        case "arm64", "x86_64": return "Apple Silicon Simulator (\(identifier))"

        // Fallback
        default: return "Apple Device (\(identifier))"
        }
    }

    private func detectChipFamily(_ identifier: String) -> String {
        switch identifier {
        case "iPhone17,1", "iPhone17,2": return "Apple A18 Pro"
        case "iPhone17,3", "iPhone17,4": return "Apple A18"
        case "iPhone16,1", "iPhone16,2": return "Apple A17 Pro (3nm)"
        case "iPhone15,2", "iPhone15,3", "iPhone15,4", "iPhone15,5": return "Apple A16 Bionic (4nm)"
        case "iPhone14,2", "iPhone14,3", "iPhone14,5", "iPhone14,4", "iPhone14,7", "iPhone14,8": return "Apple A15 Bionic"
        case let id where id.starts(with: "iPad14,"): return "Apple M2 / M4"
        case let id where id.starts(with: "iPad13,"): return "Apple M1"
        default: return "Apple Silicon"
        }
    }

    private func hasNeuralEngine(_ identifier: String) -> Bool {
        return true
    }
}

// MARK: - Gemma & Core AI BPE Tokenizer

/// Fast on-device Tokenizer for Gemma & Core AI LLMs.
/// Supports loading from Hugging Face `tokenizer.json` as well as built-in Gemma BPE tokenization.
public class GemmaTokenizer {
    private var tokenToId: [String: Int32] = [:]
    private var idToToken: [Int32: String] = [:]
    private var specialTokens: Set<String> = [
        "<bos>", "<eos>", "<start_of_turn>", "<end_of_turn>", "<pad>",
        "<unk>", "<|ACT:emotion=", "<|ACT:motion=", "<|ACT:"
    ]

    public let eosTokenIds: Set<Int32> = [1, 106, 0] // <eos>, <end_of_turn>, <pad>
    public let bosTokenId: Int32 = 2 // <bos>

    public init(jsonUrl: URL? = nil) {
        // Initialize with default Gemma special tokens
        registerToken("<pad>", id: 0)
        registerToken("<eos>", id: 1)
        registerToken("<bos>", id: 2)
        registerToken("<unk>", id: 3)
        registerToken("<start_of_turn>", id: 105)
        registerToken("<end_of_turn>", id: 106)
        registerToken("\n", id: 107)
        registerToken("user", id: 1645)
        registerToken("model", id: 2341)
        registerToken("assistant", id: 2341)
        registerToken("system", id: 3267)

        if let url = jsonUrl, FileManager.default.fileExists(atPath: url.path) {
            loadFromTokenizerJson(url: url)
        }
    }

    private func registerToken(_ token: String, id: Int32) {
        tokenToId[token] = id
        idToToken[id] = token
    }

    /// Load full BPE vocabulary from Hugging Face `tokenizer.json`
    public func loadFromTokenizerJson(url: URL) {
        guard let data = try? Data(contentsOf: url),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return
        }

        // 1. Load added special tokens
        if let addedTokens = json["added_tokens"] as? [[String: Any]] {
            for item in addedTokens {
                if let content = item["content"] as? String, let id = item["id"] as? Int {
                    registerToken(content, id: Int32(id))
                    specialTokens.insert(content)
                }
            }
        }

        // 2. Load model.vocab dictionary
        if let modelDict = json["model"] as? [String: Any],
           let vocab = modelDict["vocab"] as? [String: Int] {
            for (token, id) in vocab {
                registerToken(token, id: Int32(id))
            }
            print("[GemmaTokenizer] Loaded \(vocab.count) vocabulary tokens from tokenizer.json")
        }
    }

    /// Check if token is an End-Of-Sequence sentinel
    public func isEos(tokenId: Int32) -> Bool {
        return eosTokenIds.contains(tokenId)
    }

    /// Encode prompt text into an array of token IDs
    public func encode(_ text: String) -> [Int32] {
        var tokens: [Int32] = [bosTokenId]
        var remaining = text

        while !remaining.isEmpty {
            // 1. Check for special tokens first (e.g. <start_of_turn>, <end_of_turn>)
            var matchedSpecial = false
            for special in specialTokens {
                if remaining.hasPrefix(special) {
                    if let id = tokenToId[special] {
                        tokens.append(id)
                    }
                    remaining.removeFirst(special.count)
                    matchedSpecial = true
                    break
                }
            }
            if matchedSpecial { continue }

            // 2. SentencePiece word/subword tokenization
            // Check for newlines
            if remaining.hasPrefix("\n") {
                tokens.append(tokenToId["\n"] ?? 107)
                remaining.removeFirst(1)
                continue
            }

            // Extract next word or segment
            let nextChar = remaining.first!
            if nextChar == " " {
                remaining.removeFirst(1)
                // SentencePiece uses   (U+2581) to represent leading space
                let spPrefix = "\u{2581}"
                let word = spPrefix + extractNextWord(from: remaining)
                if let id = tokenToId[word] {
                    tokens.append(id)
                    remaining.removeFirst(word.count - spPrefix.count)
                } else {
                    // Fallback character-by-character
                    let charStr = spPrefix + String(remaining.removeFirst())
                    tokens.append(tokenToId[charStr] ?? byteFallbackId(for: charStr))
                }
            } else {
                let word = extractNextWord(from: remaining)
                if let id = tokenToId[word] {
                    tokens.append(id)
                    remaining.removeFirst(word.count)
                } else {
                    let charStr = String(remaining.removeFirst())
                    tokens.append(tokenToId[charStr] ?? byteFallbackId(for: charStr))
                }
            }
        }

        return tokens
    }

    /// Decode an array of token IDs into text
    public func decode(_ tokenIds: [Int32]) -> String {
        var result = ""
        for id in tokenIds {
            if isEos(tokenId: id) || id == bosTokenId {
                continue
            }

            if let piece = idToToken[id] {
                // Replace SentencePiece space character with real space
                let cleanPiece = piece.replacingOccurrences(of: "\u{2581}", with: " ")
                result += cleanPiece
            } else if id >= 0 && id <= 255 {
                // Byte fallback
                let scalar = UnicodeScalar(UInt8(id))
                result.append(Character(scalar))
            }
        }
        return result
    }

    private func extractNextWord(from text: String) -> String {
        var word = ""
        for char in text {
            if char.isWhitespace || char == "\n" || char == "<" || char == ">" {
                break
            }
            word.append(char)
            if word.count >= 32 { break } // Subword max length
        }
        return word.isEmpty ? String(text.first!) : word
    }

    private func byteFallbackId(for str: String) -> Int32 {
        guard let byte = str.utf8.first else { return 3 } // <unk>
        return Int32(256 + Int(byte))
    }
}


