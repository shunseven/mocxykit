/**
 * Created by seven on 16/3/18.
 */
/// <reference path="./types/global.d.ts" />
import {  NextFunction, Request, Response } from 'express';
import clientEntry from './clientEntry';
import entry from './mockProxy/entry';
import events from 'events';
import viewRequest from './mockProxy/viewRequest';

events.EventEmitter.defaultMaxListeners = 20;

const defaultConfig: ProxyMockOptions = {
  apiRule: '/api/*',
  https: true,
  cacheRequestHistoryMaxLen: 30,
  configPath: '/config',
}

export function proxyMockMiddleware(options: ProxyMockOptions = defaultConfig) {
  const entryMiddleware = entry(options);
  const clientMiddleware = clientEntry(options);
  return function (req: Request, res: Response, next: NextFunction) {
    clientMiddleware(req, res)
    viewRequest(req, res);
    entryMiddleware(req, res, next);
  }
}

export default proxyMockMiddleware;