const es = require('eventsource');
console.log('Type of exports:', typeof es);
console.log('Is constructor?', typeof es === 'function' && /^\s*class\s+/.test(es.toString()));
console.log('Keys:', Object.keys(es));
console.log('es.default:', es.default);
console.log('es.EventSource:', es.EventSource);
