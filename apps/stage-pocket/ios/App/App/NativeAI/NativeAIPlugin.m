#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeAIPlugin, "NativeAI",
    CAP_PLUGIN_METHOD(getHardwareTelemetry, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(ping, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(downloadModel, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(loadModel, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(unloadModel, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(listCachedModels, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(deleteCachedModel, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(generateStream, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(cancelGeneration, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(testTokenStream, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(cancelTestStream, CAPPluginReturnPromise);
)

