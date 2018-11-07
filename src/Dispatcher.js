import {EventEmitter} from './EventEmitter';

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
                if (__DEV__) {
                    console.debug('start %o Dispatching actions %o...', this.count, [...actions].map((a) => a.type));
                }

                this._loadData();

                for (let i = 0; i < actions.length; ++i) {
                    const action = actions[i];
                    if (__DEV__) {
                        console.debug('%o Dispatching action=%o (%o)...', this.count, action.type, action);
                    }
                    this._dispatchAction(action);
                }

                this._storeData();

                this._fireChanged();

                if (__DEV__) {
                    console.debug('end %o', this.count++);
                }

                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }

    _dispatchAction(action) {
        if (__DEV__) {
            if (!action['type']) {
                console.error('Action without type: %o', action);
                return;
            }
        }

        const handlerName = handlerNameFor(action.type);
        const handlers = this._getHandlersHandling(handlerName);
        if (__DEV__) {
            console.debug('%o Dispatching action result=%o to %d handler(s)...', this.count, action, handlers.length);
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
        this.eventEmitter.addListener('changed', l);
        this._loadData();
        this._fireChanged();
        this._storeData();
    }

    unsubscribe(l) {
        this.eventEmitter.removeListener('changed', l);
    }

    _fireChanged() {
        const data = this._collectData();
        if (__DEV__) {
            console.debug('Updating view data=%o to %o listeners...', data, this.eventEmitter.listenerCount('changed'));
        }
        this.eventEmitter.emit('changed', {type: 'change', data});
    }

    _loadData() {
        const handlers = this._getHandlersHandling('loadData');
        handlers.forEach((handler) => handler());
    }

    _storeData() {
        const handlers = this._getHandlersHandling('storeData');
        handlers.forEach((handler) => handler());
    }

    _collectData() {
        const data = {};
        const handlers = this._getHandlersHandling('appendDataTo');
        handlers.forEach((handler) => handler(data));
        return data;
    }
}

export const dispatcher = new Dispatcher();
