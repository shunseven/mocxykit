type Listener = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, Listener[]>;
  private maxListeners: number;

  constructor() {
    this.events = new Map();
    this.maxListeners = 10;
  }

  setMaxListeners(n: number): void {
    this.maxListeners = n;
  }

  on(event: string, listener: Listener): void {
    const listeners = this.events.get(event) || [];
    if (listeners.length >= this.maxListeners) {
      console.warn(`警告: ${event} 事件的监听器数量超过最大限制 ${this.maxListeners}`);
    }
    listeners.push(listener);
    this.events.set(event, listeners);
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (!listeners) return false;
    
    listeners.forEach(listener => listener(...args));
    return true;
  }

  removeListener(event: string, listener: Listener): void {
    const listeners = this.events.get(event);
    if (!listeners) return;
    
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        this.events.delete(event);
      } else {
        this.events.set(event, listeners);          
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}
