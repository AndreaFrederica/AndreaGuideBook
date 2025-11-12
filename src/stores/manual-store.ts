import { defineStore, acceptHMRUpdate } from 'pinia';
import { loadManuals, saveManuals } from 'src/utils/storage';
import type { Manual, Step, ToolBinding, ToolType, StepTodo } from 'src/models/manual';
const presetModules = import.meta.glob<string>('../presets/*.json', { eager: true, query: '?raw', import: 'default' });
const FILE_PRESETS: Manual[] = Object.values(presetModules)
  .map((txt) => {
    try {
      return JSON.parse(txt) as Manual;
    } catch {
      return null;
    }
  })
  .filter((m): m is Manual => !!m);

export const useManualStore = defineStore('manual', {
  state: () => ({
    manuals: [] as Manual[],
    loaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.manuals.find((m) => m.id === id),
  },
  actions: {
    load() {
      if (this.loaded) return;
      const data = loadManuals<Manual[]>();
      if (data && Array.isArray(data)) this.manuals = data;
      for (const m of FILE_PRESETS) {
        const exist = this.manuals.find((x) => x.id === m.id);
        if (!exist) this.manuals.push(structuredClone(m));
      }
      this.loaded = true;
    },
    save() {
      saveManuals(this.manuals);
    },
    createManual(partial?: Partial<Manual>) {
      const m: Manual = {
        id: uid(),
        name: partial?.name || '未命名说明书',
        description: partial?.description || '',
        tags: partial?.tags || [],
        steps: partial?.steps || [],
      };
      this.manuals.push(m);
      this.save();
      return m.id;
    },
    updateManual(id: string, updater: (m: Manual) => void) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      updater(m);
      this.save();
    },
    removeManual(id: string) {
      const target = this.manuals.find((m) => m.id === id);
      if (target && target.tags.includes('preset')) return;
      this.manuals = this.manuals.filter((m) => m.id !== id);
      this.save();
    },
    addStep(id: string, step?: Partial<Step>) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      const s: Step = {
        id: uid(),
        title: step?.title || '未命名步骤',
        content: step?.content || '',
        toolBindings: step?.toolBindings || [],
        todos: step?.todos || [],
      };
      if (step?.groupId) s.groupId = step.groupId;
      m.steps.push(s);
      this.save();
      return s.id;
    },
    updateStep(id: string, stepId: string, updater: (s: Step) => void) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      const s = m.steps.find((x) => x.id === stepId);
      if (!s) return;
      updater(s);
      this.save();
    },
    removeStep(id: string, stepId: string) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      m.steps = m.steps.filter((s) => s.id !== stepId);
      this.save();
    },
    addToolBinding(id: string, stepId: string, binding: Partial<ToolBinding>) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      const s = m.steps.find((x) => x.id === stepId);
      if (!s) return;
      const type: ToolType =
        binding.type === 'timer' || binding.type === 'calculator'
          ? binding.type
          : binding.type === 'formula'
            ? 'formula'
            : 'timer';
      const tb: ToolBinding = {
        id: uid(),
        type,
        config:
          binding.config ||
          (type === 'timer'
            ? { mode: 'stopwatch', seconds: 60 }
            : type === 'formula'
              ? { expression: 'a*b', params: ['a', 'b'] }
              : {}),
      };
      s.toolBindings.push(tb);
      this.save();
      return tb.id;
    },
    updateToolBinding(id: string, stepId: string, bindingId: string, updater: (t: ToolBinding) => void) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      const s = m.steps.find((x) => x.id === stepId);
      if (!s) return;
      const b = s.toolBindings.find((x) => x.id === bindingId);
      if (!b) return;
      updater(b);
      this.save();
    },
    addTodo(id: string, stepId: string, content: string) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      const s = m.steps.find((x) => x.id === stepId);
      if (!s) return;
      const t: StepTodo = { id: uid(), title: content, description: '', done: false, toolBindings: [] };
      s.todos = s.todos || [];
      s.todos.push(t);
      this.save();
      return t.id;
    },
    toggleTodo(id: string, stepId: string, todoId: string, done: boolean) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      const s = m.steps.find((x) => x.id === stepId);
      if (!s || !s.todos) return;
      const t = s.todos.find((x) => x.id === todoId);
      if (!t) return;
      t.done = done;
      this.save();
    },
    removeTodo(id: string, stepId: string, todoId: string) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      const s = m.steps.find((x) => x.id === stepId);
      if (!s || !s.todos) return;
      s.todos = s.todos.filter((x) => x.id !== todoId);
      this.save();
    },
    updateTodo(id: string, stepId: string, todoId: string, updater: (t: StepTodo) => void) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      const s = m.steps.find((x) => x.id === stepId);
      if (!s || !s.todos) return;
      const t = s.todos.find((x) => x.id === todoId);
      if (!t) return;
      updater(t);
      this.save();
    },
    addTodoToolBinding(id: string, stepId: string, todoId: string, binding: Partial<ToolBinding>) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      const s = m.steps.find((x) => x.id === stepId);
      if (!s || !s.todos) return;
      const t = s.todos.find((x) => x.id === todoId);
      if (!t) return;
      const type: ToolType =
        binding.type === 'timer' || binding.type === 'calculator' || binding.type === 'formula'
          ? binding.type
          : 'timer';
      const tb: ToolBinding = {
        id: uid(),
        type,
        config:
          binding.config ||
          (type === 'timer'
            ? { mode: 'stopwatch', seconds: 60 }
            : type === 'formula'
              ? { expression: 'a*b', params: ['a', 'b'] }
              : {}),
      };
      t.toolBindings = t.toolBindings || [];
      t.toolBindings.push(tb);
      this.save();
      return tb.id;
    },
    removeTodoToolBinding(id: string, stepId: string, todoId: string, bindingId: string) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      const s = m.steps.find((x) => x.id === stepId);
      if (!s || !s.todos) return;
      const t = s.todos.find((x) => x.id === todoId);
      if (!t || !t.toolBindings) return;
      t.toolBindings = t.toolBindings.filter((x) => x.id !== bindingId);
      this.save();
    },
    updateTodoToolBinding(id: string, stepId: string, todoId: string, bindingId: string, updater: (t: ToolBinding) => void) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      const s = m.steps.find((x) => x.id === stepId);
      if (!s || !s.todos) return;
      const td = s.todos.find((x) => x.id === todoId);
      if (!td || !td.toolBindings) return;
      const b = td.toolBindings.find((x) => x.id === bindingId);
      if (!b) return;
      updater(b);
      this.save();
    },
    removeToolBinding(id: string, stepId: string, bindingId: string) {
      const m = this.manuals.find((x) => x.id === id);
      if (!m) return;
      const s = m.steps.find((x) => x.id === stepId);
      if (!s) return;
      s.toolBindings = s.toolBindings.filter((t) => t.id !== bindingId);
      this.save();
    },
    exportAll(): string {
      return JSON.stringify(this.manuals, null, 2);
    },
    exportById(id: string): string | null {
      const m = this.manuals.find((x) => x.id === id);
      return m ? JSON.stringify(m, null, 2) : null;
    },
    importAll(data: unknown) {
      if (Array.isArray(data)) {
        const incoming = data as Manual[];
        this.manuals = incoming.map((m) => ({
          id: m.id || uid(),
          name: m.name || '未命名说明书',
          description: m.description || '',
          tags: Array.isArray(m.tags) ? m.tags : [],
          steps: Array.isArray(m.steps) ? m.steps : [],
        }));
        this.save();
        return;
      }
      if (data && typeof data === 'object') {
        const m = data as Manual;
        const manual: Manual = {
          id: m.id || uid(),
          name: m.name || '未命名说明书',
          description: m.description || '',
          tags: Array.isArray(m.tags) ? m.tags : [],
          steps: Array.isArray(m.steps) ? m.steps : [],
        };
        this.manuals.push(manual);
        this.save();
      }
    },
  },
});

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useManualStore, import.meta.hot));
}
