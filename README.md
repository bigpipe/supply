# Supply

## Installation

```
npm install --save supply
```

## Usage

```js
'use strict';

var supply = require('supply');
```

### Middleware

```js
supply.middleware(Foo);
```

```js
supply.middleware(Foo, {
  add: 'use',
  remove: 'remove'
});
```

### Plugin

```js
supply.plugin(Bar);
```

```js
supply.plugin(Bar, {
  add: 'use',
  remove: 'plugout'
});
```

## License

MIT
