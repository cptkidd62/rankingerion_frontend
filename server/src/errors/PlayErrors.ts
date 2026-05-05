export class PlayTaskError extends Error {
  agentIndex?: number;
}

export class CompilationError extends PlayTaskError {}

export class PlaytimeError extends PlayTaskError {
  message: string;
}
