// Disable console logs in production
if (process.env.NODE_ENV === 'production') {
  // Store original console methods
  const originalConsole = { ...console };
  
  // Override console methods
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.trace = () => {};
  
  // Keep errors for debugging
  // console.error = originalConsole.error;
}