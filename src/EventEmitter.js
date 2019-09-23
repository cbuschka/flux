export class EventEmitter {
    constructor() {
        this.listeners = [];
    }

    removeListener(l) {
        const index = this.listeners.indexOf(l);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }

    listenerCount() {
        return this.listeners.length;
    }

    addListener(l) {
        this.listeners.push(l);
    }

    emit(ev) {
        this.listeners.forEach((l) => {
            l(ev);
        });
    }
}
