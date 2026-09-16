// swift-tools-version:5.1
import PackageDescription

let package = Package(
	name: "get-app-icon",
	platforms: [
		.macOS(.v10_12)
	],
	targets: [
		.target(
			name: "get-app-icon"
		)
	]
)
