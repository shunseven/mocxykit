function firstUpperCase(str) {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

export function parseUrlToKey(url) {
  const cleanUrl = url.split('?')[0];
  return cleanUrl.split('/').map(item => firstUpperCase(item)).join('');
}

export class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(type, callback, scope, ...args) {
    if (typeof this.listeners[type] !== "undefined") {
      this.listeners[type].push({ scope, callback, args });
    } else {
      this.listeners[type] = [{ scope, callback, args }];
    }
  }

  off(type, callback, scope) {
    if (typeof this.listeners[type] !== "undefined") {
      this.listeners[type] = this.listeners[type].filter(
        listener => listener.scope !== scope || listener.callback !== callback
      );
    }
  }

  hasEventListener(type, callback, scope) {
    if (typeof this.listeners[type] !== "undefined") {
      if (callback === undefined && scope === undefined) {
        return this.listeners[type].length > 0;
      }
      return this.listeners[type].some(
        listener => (scope ? listener.scope === scope : true) && listener.callback === callback
      );
    }
    return false;
  }

  emit(type, target, ...args) {
    const event = { type, target };
    const eventArgs = [event, ...args];

    if (typeof this.listeners[type] !== "undefined") {
      const listeners = this.listeners[type].slice();
      listeners.forEach(listener => {
        if (listener && listener.callback) {
          listener.callback.apply(listener.scope, [...eventArgs, ...listener.args]);
        }
      });
    }
  }

  getEvents() {
    let str = "";
    for (const type in this.listeners) {
      this.listeners[type].forEach(listener => {
        str += listener.scope && listener.scope.className ? listener.scope.className : "anonymous";
        str += ` listen for '${type}'\n`;
      });
    }
    return str;
  }
}
