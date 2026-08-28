#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeAIPlugin, "NativeAI",
    CAP_PLUGIN_METHOD(getHardwareTelemetry, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(ping, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(testTokenStream, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(cancelTestStream, CAPPluginReturnPromise);
)
