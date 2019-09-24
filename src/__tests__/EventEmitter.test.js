import {EventEmitter} from '../EventEmitter';

test('EventEmitter has no listeners by default.', () => {
  const ee = new EventEmitter();

  expect(ee.listeners).toStrictEqual([]);
  expect(ee.listenerCount()).toBe(0);
});
