// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "CoreLLMKit",
    platforms: [
        .macOS(.v15),
        .iOS(.v18),
        .visionOS(.v2),
    ],
    products: [
        .library(name: "LLMCore", targets: ["LLMCore"]),
        .library(name: "CoreMLBackend", targets: ["CoreMLBackend"]),
    ],
    dependencies: [
        .package(url: "https://github.com/huggingface/swift-transformers", from: "1.0.0"),
    ],
    targets: [
        .target(name: "LLMCore"),
        .target(
            name: "CoreMLBackend",
            dependencies: [
                "LLMCore",
                .product(name: "Transformers", package: "swift-transformers"),
            ]
        ),
    ]
)
