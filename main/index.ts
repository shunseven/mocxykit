/**
 * Created by seven on 16/3/18.
 */
/// <reference path="./types/global.d.ts" />
import proxyMockMiddleware from "./middleware/proxyMockMiddleWare";
import viteProxyMockPlugin from "./middleware/viteProxyMockPlugin";
import WebpackProxyMockPlugin from "./middleware/WebpackProxyMockPlugin";
import { EventEmitter } from './mockProxy/common/event';

export const envUpdateEmitter = new EventEmitter();
envUpdateEmitter.setMaxListeners(20);

export { proxyMockMiddleware, viteProxyMockPlugin, WebpackProxyMockPlugin };

export default WebpackProxyMockPlugin;