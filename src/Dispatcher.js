import {EventEmitter} from 'events';

function copyObject(o) {
  return JSON.parse(JSON.stringify(o));
}

function upperFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// a small dispatcher that delegates actions to handlers/stores;
// for action Abc implement handleAbc(action) in handler/store class
// after dispatching, the dispatcher aggregates view data via calls to appendDataTo(date)
export class Dispatcher {
  constructor() {
    this.count = 0;
    this.handlers = [];
    this.eventEmitter = new EventEmitter();
  }

  addHandler(...handlers) {
    for (let i = 0; i < handlers.length; ++i) {
      this.handlers.push(handlers[i]);
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
      console.debug('%o Dispatching action result=%o to %d handler(s)...', this.count, action, this.handlers.length);
    }

    const handlerName = 'on' + upperFirst(action.type);
    this.handlers.forEach(function (handler) {
      const handlerFunc = handler[handlerName];
      if (handlerFunc) {
        handlerFunc.call(handler, action);
      }
    });
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
    const data = copyObject(this._collectData());
    if (__DEV__) {
      console.debug('Updating view data=%o...', data);
    }
    this.eventEmitter.emit('changed', {type: 'change', data});
  }

  _loadData() {
    this.handlers.forEach(function (handler) {
      const func = handler['loadData'];
      if (func) {
        func.call(handler);
      }
    });
  }

  _storeData() {
    this.handlers.forEach(function (handler) {
      const func = handler['storeData'];
      if (func) {
        func.call(handler);
      }
    });
  }

  _collectData() {
    const data = {};
    this.handlers.forEach(function (handler) {
      const appendDataToFunc = handler['appendDataTo'];
      if (appendDataToFunc) {
        appendDataToFunc.call(handler, data);
      }
    });
    return data;
  }
}

export const dispatcher = new Dispatcher();
