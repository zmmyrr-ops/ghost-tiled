QtModule {
    qtModuleName: "Test"
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
    frameworksRelease: ["QtCore","DiskArbitration","UniformTypeIdentifiers","Security","AppKit","ApplicationServices","Foundation","IOKit"]
    frameworkPathsDebug: []
    frameworkPathsRelease: ["/opt/homebrew/lib"]
    libNameForLinkerDebug: "QtTest"
    libNameForLinkerRelease: "QtTest"
    libFilePathDebug: undefined
    libFilePathRelease: "/opt/homebrew/lib/QtTest.framework/QtTest"
    pluginTypes: []
    moduleConfig: ["shared","lib_bundle"]
    cpp.defines: ["QT_TESTLIB_LIB"]
    cpp.systemIncludePaths: ["/opt/homebrew/lib/QtTest.framework/Headers"]
    cpp.libraryPaths: []
    isFramework: true
}
