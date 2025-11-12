export type ToolType = 'timer' | 'calculator' | 'formula';

export interface ToolBinding {
  id: string;
  type: ToolType;
  config?: Record<string, unknown>;
}

export interface Step {
  id: string;
  title: string;
  content: string;
  toolBindings: ToolBinding[];
  groupId?: string;
  todos?: StepTodo[];
}

export interface Manual {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  steps: Step[];
}

export interface RunState {
  currentStepIndex: number;
  toolStates: Record<string, unknown>;
  confirmations?: Record<string, boolean>;
}

export interface StepTodo {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  toolBindings?: ToolBinding[];
}
