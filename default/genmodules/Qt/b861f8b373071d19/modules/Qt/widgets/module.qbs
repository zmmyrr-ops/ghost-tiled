QtModule {
    qtModuleName: "Widgets"
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
    libNameForLinkerDebug: "QtWidgets"
    libNameForLinkerRelease: "QtWidgets"
    libFilePathDebug: undefined
    libFilePathRelease: "/opt/homebrew/lib/QtWidgets.framework/QtWidgets"
    pluginTypes: ["styles"]
    moduleConfig: ["shared","lib_bundle"]
    cpp.defines: ["QT_WIDGETS_LIB"]
    cpp.systemIncludePaths: ["/opt/homebrew/lib/QtWidgets.framework/Headers"]
    cpp.libraryPaths: []
    isFramework: true
    Group {
        files: "/opt/homebrew/share/qt/metatypes/qt6widgets_metatypes.json"
        filesAreTargets: true
        fileTags: ["qt.core.metatypes"]
    }
}
