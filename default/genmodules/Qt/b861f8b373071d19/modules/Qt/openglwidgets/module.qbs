QtModule {
    qtModuleName: "OpenGLWidgets"
    Depends { name: "Qt"; submodules: ["opengl","widgets"]}

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
    frameworksRelease: ["QtOpenGL","QtWidgets","QtGui","QtCore","IOKit","DiskArbitration","UniformTypeIdentifiers","AppKit","OpenGL","ImageIO","Metal"]
    frameworkPathsDebug: []
    frameworkPathsRelease: ["/opt/homebrew/lib"]
    libNameForLinkerDebug: "QtOpenGLWidgets"
    libNameForLinkerRelease: "QtOpenGLWidgets"
    libFilePathDebug: undefined
    libFilePathRelease: "/opt/homebrew/lib/QtOpenGLWidgets.framework/QtOpenGLWidgets"
    pluginTypes: []
    moduleConfig: ["shared","lib_bundle"]
    cpp.defines: ["QT_OPENGLWIDGETS_LIB"]
    cpp.systemIncludePaths: ["/opt/homebrew/lib/QtOpenGLWidgets.framework/Headers"]
    cpp.libraryPaths: []
    isFramework: true
    Group {
        files: "/opt/homebrew/share/qt/metatypes/qt6openglwidgets_metatypes.json"
        filesAreTargets: true
        fileTags: ["qt.core.metatypes"]
    }
}
