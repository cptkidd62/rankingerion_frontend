export class PlayTaskError extends Error {
  agentIndex?: number;
  agentName?: string;

  constructor(agentIndex?: number, agentName?: string) {
    super();
    this.agentIndex = agentIndex;
    this.agentName = agentName;
  }
}

export class CompilationError extends PlayTaskError {}

export class PlaytimeError extends PlayTaskError {
  message: string;

  constructor(message: string, agentIndex?: number, agentName?: string) {
    super(agentIndex, agentName);
    this.message = message;
  }
}
