// Jest global setup. Keep it tiny — anything heavier belongs in the test file
// itself so unrelated suites don't pay the cost.

// Silence console.error/warn during tests unless a test explicitly wants to
// assert on them. Most of the noise comes from expected error paths.
const originalError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    // Surface unexpected React/Node errors; suppress our own intentional ones.
    const msg = String(args[0] ?? '');
    if (msg.includes('Test entitlement error')) return;
    originalError(...args);
  });
});
