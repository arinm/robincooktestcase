// resolves after the given time... used to simulate latency of the imaginary backend
export const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
