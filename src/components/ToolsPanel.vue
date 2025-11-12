<template>
  <div>
    <div v-for="binding in bindings" :key="binding.id" class="q-mb-md">
      <div v-if="desc(binding)" class="q-mb-xs text-caption">{{ desc(binding) }}</div>
      <div class="q-mb-xs">
        <q-checkbox
          :model-value="isConfirmed(binding.id)"
          label="完成"
          @update:model-value="(v) => setConfirmed(binding.id, !!v)"
        />
      </div>
      <component
        :is="resolve(binding)"
        :binding="binding"
        :state="states[binding.id]"
        :owner-id="ownerId"
        :stop-on-confirm="stopOnConfirm ?? true"
        @change="onChange(binding.id, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ToolBinding } from 'src/models/manual';
import { useRunStore } from 'src/stores/run-store';
import TimerTool from 'components/tools/TimerTool.vue';
import CalculatorTool from 'components/tools/CalculatorTool.vue';
import FormulaTool from 'components/tools/FormulaTool.vue';

const { bindings, ownerId, stopOnConfirm } = defineProps<{
  bindings: ToolBinding[];
  ownerId?: string;
  stopOnConfirm?: boolean;
}>();

const run = useRunStore();
const states = computed(() => run.toolStates);

function resolve(binding: ToolBinding) {
  if (binding.type === 'timer') return TimerTool;
  if (binding.type === 'calculator') return CalculatorTool;
  if (binding.type === 'formula') return FormulaTool;
  return TimerTool;
}

function onChange(bindingId: string, state: unknown) {
  run.setToolState(bindingId, state);
}

function isConfirmed(id: string) {
  return run.isConfirmed(id);
}

function setConfirmed(id: string, v: boolean) {
  run.setConfirmed(id, v);
}

function desc(binding: ToolBinding) {
  const cfg = binding.config as { description?: string } | undefined;
  const raw = cfg?.description;
  if (!raw) return '';
  return raw.replace(/@([a-zA-Z_]\w*)/g, (_m: string, name: string) => {
    const val = run.getRef(name);
    return typeof val === 'number' ? String(val) : `@${name}`;
  });
}
</script>
