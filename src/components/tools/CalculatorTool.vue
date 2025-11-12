<template>
  <q-card>
    <q-card-section class="row items-center justify-between">
      <div class="text-subtitle1">计算器</div>
      <q-btn flat dense icon="clear_all" @click="clearAll" />
    </q-card-section>
    <q-card-section>
      <div class="text-h5 q-mb-md">{{ display }}</div>
      <div class="row q-col-gutter-sm">
        <div class="col-12">
          <div class="row q-col-gutter-sm">
            <div class="col-3" v-for="key in keys" :key="key">
              <q-btn outline class="full-width" @click="press(key)">{{ key }}</q-btn>
            </div>
          </div>
        </div>
        <div class="col-12 q-mt-md">
          <q-btn color="primary" @click="compute" class="full-width">=</q-btn>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { ToolBinding } from 'src/models/manual';
import { evaluateExpression } from 'src/utils/math';

const props = defineProps<{ binding: ToolBinding; state?: unknown }>();
const emit = defineEmits<{ (e: 'change', v: unknown): void }>();

const keys = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','C','+'];
const display = ref('0');
const buffer = ref('');

onMounted(() => {
  const s = props.state as { display?: string; buffer?: string } | undefined;
  if (s?.display) display.value = s.display;
  if (s?.buffer) buffer.value = s.buffer;
});

watch([display, buffer], () => {
  emit('change', { display: display.value, buffer: buffer.value });
});

function press(k: string) {
  if (k === 'C') {
    clearEntry();
    return;
  }
  if (buffer.value.length === 0 && ['+','-','*','/'].includes(k)) return;
  buffer.value += k;
  display.value = buffer.value;
}

function clearEntry() {
  buffer.value = '';
  display.value = '0';
}

function clearAll() {
  clearEntry();
}

function compute() {
  try {
    const value = evaluateExpression(buffer.value);
    display.value = String(value);
    buffer.value = String(value);
  } catch {
    display.value = '错误';
  }
}

</script>
