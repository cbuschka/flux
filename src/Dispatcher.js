import {EventEmitter} from "./EventEmitter";

function upperFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function handlerNameFor(eventType) {
    return 'on' + upperFirst(eventType);
}

// a small dispatcher that delegates actions to handlers/stores;
// for action Abc implement handleAbc(action) in handler/store class
// after dispatching, the dispatcher aggregates view data via calls to appendDataTo(date)
export class Dispatcher {
    constructor() {
        this.count = 0;
        this.handlers = [];
        this.handlerCache = {};
        this.eventEmitter = new EventEmitter();
        this.logger = console;
    }

    setLogger(logger) {
        this.logger = logger;
    }

    addHandler(...handlers) {
        let handlerAdded = false;
        for (let i = 0; i < handlers.length; ++i) {
            const handler = handlers[i];
            const handlerIndex = this.handlers.indexOf(handler);
            if (handlerIndex !== -1) {
                continue;
            }
            this.handlers.push(handler);
            handlerAdded = true;
        }

        if (handlerAdded) {
            this.handlerCache = {};
        }
    }

    removeHandler(...handlers) {
        let handlerRemoved = false;
        for (let i = 0; i < handlers.length; ++i) {
            const handler = handlers[i];
            const handlerIndex = this.handlers.indexOf(handler);
            if (handlerIndex !== -1) {
                this.handlers.splice(handlerIndex, 1);
                handlerRemoved = true;
            }
        }

        if (handlerRemoved) {
            this.handlerCache = {};
        }
    }

    dispatch(...actions) {
        return new Promise((resolve, reject) => {
            try {
                if (this.logger) {
                    this.logger.debug('start %o Dispatching actions %o...', this.count, [...actions].map((a) => a.type));
                }

                for (let i = 0; i < actions.length; ++i) {
                    const action = actions[i];
                    if (this.logger) {
                        this.logger.debug('%o Dispatching action=%o (%o)...', this.count, action.type, action);
                    }
                    this._dispatchAction(action);
                }

                this._fireChanged();

                if (this.logger) {
                    this.logger.debug('end %o', this.count++);
                }

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    _dispatchAction(action) {
        if (this.logger) {
            if (!action['type']) {
                this.logger.error('Action without type: %o', action);
                return;
            }
        }

        const handlerName = handlerNameFor(action.type);
        const handlers = this._getHandlersHandling(handlerName);
        if (this.logger) {
            this.logger.debug('%o Dispatching action result=%o to %d handler(s)...', this.count, action, handlers.length);
        }
        handlers.forEach((handler) => handler(action));
    }

    _getHandlersHandling(handlerName) {
        if (!this.handlerCache[handlerName]) {
            const handlers = this.handlers
                .map((handler) => {
                    const handlerFunc = handler[handlerName];
                    if (handlerFunc) {
                        return handlerFunc.bind(handler);
                    }
                })
                .filter((handler) => !!handler);
            this.handlerCache[handlerName] = {handlers};
        }

        return this.handlerCache[handlerName].handlers;
    }

    subscribe(l) {
        this.eventEmitter.addListener(l);
        this._fireChanged();
    }

    unsubscribe(l) {
        this.eventEmitter.removeListener(l);
    }

    _fireChanged() {
        const data = this._collectData('appendDataTo');
        if (this.logger) {
            this.logger.debug('Updating view data=%o to %o listeners...', data, this.eventEmitter.listenerCount());
        }
        this.eventEmitter.emit({type: 'change', data});
    }

    save() {
        return this._collectData("save");
    }

    load(data) {
        const handlers = this._getHandlersHandling("load");
        for (let i = 0; i < handlers.length; ++i) {
            handlers[i](data);
        }
    }

    _collectData(methodName) {
        const data = {};
        const handlers = this._getHandlersHandling(methodName);
        for (let i = 0; i < handlers.length; ++i) {
            handlers[i](data);
        }
        return data;
    }
}

export const dispatcher = new Dispatcher();
