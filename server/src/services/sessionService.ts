export interface NotImplementedResult {
  error: "Not implemented";
}

export function sessionNotImplemented(): NotImplementedResult {
  return { error: "Not implemented" };
}

