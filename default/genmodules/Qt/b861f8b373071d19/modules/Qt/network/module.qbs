QtModule {
    qtModuleName: "Network"
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
    libNameForLinkerDebug: "QtNetwork"
    libNameForLinkerRelease: "QtNetwork"
    libFilePathDebug: undefined
    libFilePathRelease: "/opt/homebrew/lib/QtNetwork.framework/QtNetwork"
    pluginTypes: ["networkaccess","networkinformation","tls"]
    moduleConfig: ["shared","lib_bundle"]
    cpp.defines: ["QT_NETWORK_LIB"]
    cpp.systemIncludePaths: ["/opt/homebrew/lib/QtNetwork.framework/Headers"]
    cpp.libraryPaths: []
    isFramework: true
    Group {
        files: "/opt/homebrew/share/qt/metatypes/qt6network_metatypes.json"
        filesAreTargets: true
        fileTags: ["qt.core.metatypes"]
    }
}
