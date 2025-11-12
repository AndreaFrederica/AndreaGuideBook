<template>
  <q-card>
    <q-card-section class="row items-center justify-between">
      <div class="text-subtitle1">公式</div>
      <q-btn flat dense icon="calculate" @click="compute" />
    </q-card-section>
    <q-card-section>
      <div v-if="showConfig" class="row q-col-gutter-sm q-mb-md">
        <div class="col-12 col-md-4">
          <q-select v-model="mode" :options="['expr', 'js']" label="模式" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model="outputName" label="输出变量名" />
        </div>
        <div class="col-12 col-md-4">
          <q-toggle v-model="autoRun" label="自动运行" />
        </div>
      </div>
      <div v-if="mode === 'expr'" class="q-mb-sm">{{ expression }}</div>
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-6" v-for="p in params" :key="p">
          <q-input v-model.number="values[p]" :label="p" type="number" />
        </div>
      </div>
      <div class="q-mb-md" v-if="mode === 'js'">
        <q-input v-model="code" type="textarea" autogrow label="JS代码" />
      </div>
      <div class="text-h6">{{ result }}</div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import type { ToolBinding } from 'src/models/manual';
import { evaluateExpression } from 'src/utils/math';
import { runJS } from 'src/utils/jsEval.js';
import { useRunStore } from 'src/stores/run-store';

const props = defineProps<{
  binding: ToolBinding;
  state?: unknown;
  showConfig?: boolean;
  ownerId?: string;
}>();
const showConfig = computed(() => props.showConfig === true);
const run = useRunStore();
const emit = defineEmits<{ (e: 'change', v: unknown): void }>();

type FormulaConfig = {
  expression?: string;
  params?: string[];
  mode?: 'expr' | 'js';
  code?: string;
  output?: string;
  defaults?: Record<string, number>;
};
const cfg = props.binding.config as FormulaConfig | undefined;
const expression = ref(String(cfg?.expression || 'a+b'));
const params = ref<string[]>(cfg?.params ?? (cfg?.mode === 'expr' ? ['a', 'b'] : []));
const values = ref<Record<string, number>>({});
const result = ref('');
const mode = ref<'expr' | 'js'>(cfg?.mode || 'expr');
const code = ref<string>(cfg?.code || '/* 在此编写JS，可使用 params 对象 */\nconst rpm = params.rpm ?? 12000;\nconst r = params.r_cm ?? 7.5;\nconst out = Math.round(1.118e-5 * r * rpm * rpm);');
const outputName = ref<string>(cfg?.output || 'out');
const autoRun = ref<boolean>((cfg as { autoRun?: boolean } | undefined)?.autoRun || false);

onMounted(() => {
  const defs = cfg?.defaults || {};
  if (params.value.length === 0) {
    for (const k of Object.keys(defs)) {
      if (typeof defs[k] === 'number') values.value[k] = defs[k] as number;
    }
  } else {
    for (const p of params.value) values.value[p] = typeof defs[p] === 'number' ? defs[p] : 0;
  }
  const s = props.state as { values?: Record<string, number>; result?: string } | undefined;
  if (s?.values) values.value = s.values;
  if (s?.result) result.value = s.result;
  if (autoRun.value) compute();
});

watch([values, expression], () => {
  if (autoRun.value) compute();
  else emit('change', { values: values.value, result: result.value });
});

watch([mode, code, outputName], () => {
  if (autoRun.value) compute();
});

watch(values, () => {
  if (autoRun.value) compute();
});

function compute() {
  try {
    let val: number | undefined;
    if (mode.value === 'expr') {
      let expr = expression.value;
      for (const p of params.value) {
        const v = values.value[p] ?? 0;
        const re = new RegExp(`\\b${p}\\b`, 'g');
        expr = expr.replace(re, String(v));
      }
      val = evaluateExpression(expr);
    } else {
      const out = runJS(code.value, values.value, outputName.value, values.value);
      if (typeof out === 'number') val = out as number;
    }
    const outVal = val !== undefined ? val : Number.NaN;
    result.value = Number.isNaN(outVal) ? '错误' : String(outVal);
    if (Number.isNaN(outVal)) {
      if (mode.value === 'expr') {
        console.error('Formula expression produced NaN', {
          expression: expression.value,
          values: values.value,
        });
      } else {
        console.error('JS formula produced invalid result', {
          code: code.value,
          values: values.value,
          output: outputName.value,
        });
      }
    }
    emit('change', { values: values.value, result: outVal });
    if (!Number.isNaN(outVal) && props.ownerId) run.setConfirmed(props.ownerId, true);
  } catch (err) {
    result.value = '错误';
    console.error('Formula compute error', err);
    emit('change', { values: values.value, result: Number.NaN });
  }
}
</script>
