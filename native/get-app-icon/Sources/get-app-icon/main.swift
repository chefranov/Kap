import Quartz

struct CLI {
    final class StandardErrorTextStream: TextOutputStream {
        func write(_ string: String) {
            FileHandle.standardError.write(string.data(using: .utf8)!)
        }
    }

    static let stdout = FileHandle.standardOutput
    static let stderr = FileHandle.standardError

    private static var _stderr = StandardErrorTextStream()
    static func printErr<T>(_ item: T) {
        Swift.print(item, to: &_stderr)
    }
}

extension NSBitmapImageRep {
    func png() -> Data? {
        return representation(using: .png, properties: [:])
    }
}

extension Data {
    var bitmap: NSBitmapImageRep? {
        return NSBitmapImageRep(data: self)
    }
}

extension NSImage {
    func png() -> Data? {
        return tiffRepresentation?.bitmap?.png()
    }

    func resized(to size: Int) -> NSImage {
        let newSize = CGSize(width: size, height: size)

        let image = NSImage(size: newSize)
        image.lockFocus()
        NSGraphicsContext.current?.imageInterpolation = .high

        draw(
            in: CGRect(origin: .zero, size: newSize),
            from: .zero,
            operation: .copy,
            fraction: 1
        )

        image.unlockFocus()
        return image
    }
}

func getIcon(pid: Int, size: Int) -> Data? {
    return NSRunningApplication(processIdentifier: pid_t(pid))?.icon?.resized(to: size).png()
}

func stringify(data: Data) -> String {
    return "data:image/png;base64,\(data.base64EncodedString())"
}

// Usage: get-app-icon <pid> [--size <px>] [--encoding base64|buffer]
var arguments = Array(CommandLine.arguments.dropFirst())

guard !arguments.isEmpty, let pid = Int(arguments.removeFirst()) else {
    CLI.printErr("Usage: get-app-icon <pid> [--size <px>] [--encoding base64|buffer]")
    exit(1)
}

var size = 32
var encoding = "base64"

while !arguments.isEmpty {
    let flag = arguments.removeFirst()
    let value = arguments.isEmpty ? nil : arguments.removeFirst()

    switch flag {
    case "--size":
        size = value.flatMap(Int.init) ?? size
    case "--encoding":
        encoding = value ?? encoding
    default:
        CLI.printErr("Unknown option \(flag)")
        exit(1)
    }
}

guard let icon = getIcon(pid: pid, size: size) else {
    CLI.printErr("Could not find app with PID \(pid)")
    exit(1)
}

if encoding == "buffer" {
    CLI.stdout.write(icon)
} else {
    print(stringify(data: icon))
}
