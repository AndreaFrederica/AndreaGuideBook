import { defineStore, acceptHMRUpdate } from 'pinia';
import { useManualStore } from './manual-store';
import type { Manual, Step } from 'src/models/manual';

export const useRunStore = defineStore('run', {
  state: () => ({
    manualId: '' as string,
    currentStepIndex: 0,
    toolStates: {} as Record<string, unknown>,
    confirmations: {} as Record<string, boolean>,
  }),
  getters: {
    manual(state): Manual | undefined {
      const ms = useManualStore();
      return ms.byId(state.manualId);
    },
    steps(state): Step[] {
      const ms = useManualStore();
      const m = ms.byId(state.manualId);
      return m?.steps || [];
    },
    currentStep(state): Step | undefined {
      const ms = useManualStore();
      const m = ms.byId(state.manualId);
      return m?.steps[state.currentStepIndex];
    },
    progress(): { index: number; total: number } {
      const blocks = this.blocks;
      const total = blocks.length || 1;
      const idx = this.currentBlockIndex;
      return { index: idx, total };
    },
    blocks(state): Array<{ start: number; size: number }> {
      const ms = useManualStore();
      const m = ms.byId(state.manualId);
      const arr = m?.steps || [];
      const out: Array<{ start: number; size: number }> = [];
      let i = 0;
      while (i < arr.length) {
        const item = arr[i]!;
        const g = item.groupId || '';
        if (!g) {
          out.push({ start: i, size: 1 });
          i++;
          continue;
        }
        let j = i + 1;
        while (j < arr.length && arr[j]!.groupId === g) j++;
        out.push({ start: i, size: j - i });
        i = j;
      }
      return out;
    },
    currentBlockIndex(state): number {
      const blocks = this.blocks;
      for (let b = 0; b < blocks.length; b++) {
        const blk = blocks[b]!;
        if (state.currentStepIndex >= blk.start && state.currentStepIndex < blk.start + blk.size) return b;
      }
      return 0;
    },
  },
  actions: {
    start(manualId: string, index = 0) {
      this.manualId = manualId;
      this.currentStepIndex = index;
      this.toolStates = {};
    },
    next() {
      const blocks = this.blocks;
      const idx = this.currentBlockIndex;
      if (idx < blocks.length - 1) this.currentStepIndex = blocks[idx + 1]!.start;
    },
    prev() {
      const blocks = this.blocks;
      const idx = this.currentBlockIndex;
      if (idx > 0) this.currentStepIndex = blocks[idx - 1]!.start;
    },
    jumpTo(index: number) {
      const blocks = this.blocks;
      if (index >= 0 && index < blocks.length) this.currentStepIndex = blocks[index]!.start;
    },
    setToolState(bindingId: string, state: unknown) {
      this.toolStates[bindingId] = state;
    },
    setConfirmed(stepId: string, v: boolean) {
      this.confirmations[stepId] = v;
    },
    clearConfirmations() {
      this.confirmations = {};
    },
    isConfirmed(stepId: string): boolean {
      return !!this.confirmations[stepId];
    },
    getRef(name: string): number | undefined {
      const ms = useManualStore();
      const m = ms.byId(this.manualId);
      if (!m) return undefined;
      const matchName = name?.startsWith('@') ? name.slice(1) : name;
      for (const s of m.steps) {
        // step-level formula tools
        for (const tb of s.toolBindings) {
          if (tb.type === 'formula') {
            const cfg = tb.config as { ref?: string } | undefined;
            const refName = cfg?.ref?.startsWith('@') ? cfg.ref.slice(1) : cfg?.ref;
            if (refName === matchName) {
              const st = this.toolStates[tb.id] as { result?: unknown } | undefined;
              const r = st?.result;
              if (typeof r === 'number') return r as number;
            }
          }
        }
        // todo-level formula tools
        for (const td of s.todos || []) {
          for (const b of td.toolBindings || []) {
            if (b.type === 'formula') {
              const cfg = b.config as { ref?: string } | undefined;
              const refName = cfg?.ref?.startsWith('@') ? cfg.ref.slice(1) : cfg?.ref;
              if (refName === matchName) {
                const st = this.toolStates[b.id] as { result?: unknown } | undefined;
                const r = st?.result;
                if (typeof r === 'number') return r as number;
              }
            }
          }
        }
      }
      return undefined;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRunStore, import.meta.hot));
}
