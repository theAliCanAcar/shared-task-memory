# Shared Task Memory

JSON task memory for decisions and prior attempts. Never store secrets.

Standalone ES module. No npm install required. Works in **Node.js 20+** and modern browsers (serve over HTTP for browser demos).

## Install / import

Copy the files into your project, or clone this repository:

```js
import { createMemory } from './shared-task-memory.js';
const data=new Map();
const storage={getItem:key=>data.get(key)??null,
 setItem:(key,value)=>data.set(key,value)};
createMemory({storage}).set('lastAttempt',{total:41,decision:'Repair total'});
console.log(createMemory({storage}).get('lastAttempt'));
```

## Use cases

### 1. Remember why the last attempt failed

- **Scenario:** A replacement agent joins after an invoice check fails.
- **Outcome:** Restore the prior attempt and repair decision without relying on chat history.

### 2. Keep constraints across local sessions

- **Scenario:** A long task is resumed the next day.
- **Outcome:** Reload JSON decisions and task state from a persistence adapter.

## Exports

- `createMemory`

## Notes

- Keep API keys and secrets out of this module and out of browser storage.
- Treat verification callbacks, ledger writers, and permission checks as trusted application code.
- This library is intentional local reliability plumbing, not a claim of cryptographic attestation unless stated in the source comments.

## License

MIT
