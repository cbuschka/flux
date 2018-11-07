export class EventEmitter {

    constructor() {
        this.listeners = {};
    }

    addListener(event, listener) {

        if (typeof listener !== 'function') {
            return;
        }

        const listeners = this.listeners[event] = this.listeners[event] || [];

        const listenerIndex = listeners.indexOf(listener);
        if (listenerIndex !== -1) {
            return;
        }

        listeners.push(listener);
    }

    removeListener(event, listener) {
        const listeners = this.listeners[event];
        if (!listeners) {
            return;
        }

        const listenerIndex = listeners.indexOf(listener);
        if (listenerIndex === -1) {
            return;
        }

        listeners.splice(listenerIndex, 1);
    }

    listenerCount(event) {
        const listeners = this.listeners[event];
        return !listeners ? 0 : listeners.length;
    }

    emit(event, data) {
        const listeners = this.listeners[event];
        if (!listeners) {
            return;
        }

        for (let i = 0; i < listeners.length; ++i) {
            listeners[i](data);
        }
    }
}
