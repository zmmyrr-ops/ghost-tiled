QtModule {
    qtModuleName: "Svg"
    Depends { name: "Qt"; submodules: ["core","gui"]}

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
    frameworksRelease: ["QtGui","QtCore","IOKit","DiskArbitration","UniformTypeIdentifiers","AppKit","OpenGL","ImageIO","Metal"]
    frameworkPathsDebug: []
    frameworkPathsRelease: ["/opt/homebrew/lib"]
    libNameForLinkerDebug: "QtSvg"
    libNameForLinkerRelease: "QtSvg"
    libFilePathDebug: undefined
    libFilePathRelease: "/opt/homebrew/lib/QtSvg.framework/QtSvg"
    pluginTypes: []
    moduleConfig: ["shared","lib_bundle"]
    cpp.defines: ["QT_SVG_LIB"]
    cpp.systemIncludePaths: ["/opt/homebrew/lib/QtSvg.framework/Headers"]
    cpp.libraryPaths: []
    isFramework: true
    Group {
        files: "/opt/homebrew/share/qt/metatypes/qt6svg_metatypes.json"
        filesAreTargets: true
        fileTags: ["qt.core.metatypes"]
    }
}
