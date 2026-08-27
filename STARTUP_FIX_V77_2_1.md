# Circle XI v77.2.1 Startup Fix

## Fixed
- Fixed `ReferenceError: Cannot access 'CXI_V76_CAREER_VERSION' before initialization` when an existing/legacy career is loaded during startup.
- Moved the V76 career constants used by early save migration to the top of `game.js` before any migration can execute.
- Moved `V76_REPUTATION_LEVELS` and `V76_SQUAD_LADDER` with the version constant because the same early migration path uses them.
- Updated `game.js` and `styles.css` cache query from `77.2.0` to `77.2.1`.

## Verification
- `node --check game.js` passes.
- Declaration-order check confirms all V76 constants required by `ensureV76CareerSystems()` are now initialized before the first possible `ensureCareerIdentity()` call.
