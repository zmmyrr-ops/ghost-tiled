QtModule {
    qtModuleName: "Concurrent"
    Depends { name: "Qt"; submodules: ["core"]}

    version: "6.11.2"
    architectures: ["arm64"]
    targetPlatform: "macos"
    hasLibrary: true
    staticLibsDebug: []
    staticLibsRelease: []
    dynamicLibsDebug: []
    dynamicLibsRelease: []
    linkerFlagsDebug: []
    linkerFlagsRelease: []
    frameworksDebug: []
    frameworksRelease: ["QtCore","IOKit","DiskArbitration","UniformTypeIdentifiers"]
    frameworkPathsDebug: []
    frameworkPathsRelease: ["/opt/homebrew/lib"]
    libNameForLinkerDebug: "QtConcurrent"
    libNameForLinkerRelease: "QtConcurrent"
    libFilePathDebug: undefined
    libFilePathRelease: "/opt/homebrew/lib/QtConcurrent.framework/QtConcurrent"
    pluginTypes: []
    moduleConfig: ["shared","lib_bundle"]
    cpp.defines: ["QT_CONCURRENT_LIB"]
    cpp.systemIncludePaths: ["/opt/homebrew/lib/QtConcurrent.framework/Headers"]
    cpp.libraryPaths: []
    isFramework: true
    Group {
        files: "/opt/homebrew/share/qt/metatypes/qt6concurrent_metatypes.json"
        filesAreTargets: true
        fileTags: ["qt.core.metatypes"]
    }
}
