<template>
  <q-card>
    <q-card-section class="row items-center justify-between">
      <div class="text-subtitle1">计时器</div>
      <q-btn flat dense icon="refresh" @click="reset" />
    </q-card-section>
    <q-card-section>
      <div class="row items-center q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-select v-model="mode" :options="modes" label="模式" />
        </div>
        <div class="col-12 col-md-6" v-if="mode === 'countdown'">
          <q-input v-model.number="seconds" type="number" label="秒数" />
        </div>
      </div>
      <div class="text-h5 q-my-md">{{ display }}</div>
      <div class="row q-col-gutter-sm">
        <div class="col-auto">
          <q-btn color="primary" @click="start" :disable="running">开始</q-btn>
        </div>
        <div class="col-auto">
          <q-btn color="warning" @click="pause" :disable="!running">暂停</q-btn>
        </div>
        <div class="col-auto">
          <q-btn color="secondary" @click="endTimer">结束</q-btn>
        </div>
        <div class="col-auto">
          <q-btn color="negative" @click="reset">重置</q-btn>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import type { ToolBinding } from 'src/models/manual';
import { useRunStore } from 'src/stores/run-store';

const props = defineProps<{
  binding: ToolBinding;
  state?: unknown;
  ownerId?: string;
  stopOnConfirm?: boolean;
}>();
const emit = defineEmits<{ (e: 'change', v: unknown): void }>();

const modes = ['stopwatch', 'countdown'];
const cfg = props.binding.config as
  | {
      mode?: 'stopwatch' | 'countdown';
      seconds?: number;
      sourceFormulaId?: string;
      sourceRef?: string;
    }
  | undefined;
const mode = ref<'stopwatch' | 'countdown'>(cfg?.mode ?? 'stopwatch');
const seconds = ref<number>(cfg?.seconds ?? 60);
const sourceFormulaId = ref<string | undefined>(cfg?.sourceFormulaId);
const sourceRef = ref<string | undefined>(cfg?.sourceRef);
const running = ref(false);
const elapsed = ref(0);
let timer: number | null = null;
let alarmTimer: number | null = null;
const alarming = ref(false);

interface TimerState {
  mode: 'stopwatch' | 'countdown';
  seconds: number;
  elapsed: number;
  running: boolean;
}

onMounted(() => {
  const st = props.state as Partial<TimerState> | undefined;
  if (st) {
    mode.value = st.mode ?? mode.value;
    seconds.value = st.seconds ?? seconds.value;
    elapsed.value = st.elapsed ?? 0;
    running.value = st.running ?? false;
  }
});

const run = useRunStore();
watch(
  sourceFormulaId,
  (id) => {
    if (!id) return;
    const st = run.toolStates[id] as { result?: unknown } | undefined;
    if (typeof st?.result === 'number') seconds.value = st.result as number;
  },
  { immediate: true },
);
watch(sourceRef, (name) => {
  if (!name) return;
  const v = run.getRef(name.startsWith('@') ? name.slice(1) : name);
  if (typeof v === 'number') seconds.value = v;
});
watch(
  () =>
    sourceFormulaId.value
      ? (run.toolStates[sourceFormulaId.value] as { result?: unknown } | undefined)
      : undefined,
  (st) => {
    const r = st?.result;
    if (typeof r === 'number') seconds.value = r as number;
  },
  { immediate: true },
);
watch(
  () => JSON.stringify(run.toolStates),
  () => {
    if (sourceRef.value) {
      const v = run.getRef(
        sourceRef.value.startsWith('@') ? sourceRef.value.slice(1) : sourceRef.value,
      );
      if (typeof v === 'number') seconds.value = v;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
  if (alarmTimer) window.clearInterval(alarmTimer);
});

watch([mode, seconds, elapsed, running], () => {
  emit('change', {
    mode: mode.value,
    seconds: seconds.value,
    elapsed: elapsed.value,
    running: running.value,
  });
});

watch(
  () => JSON.stringify(run.confirmations),
  () => {
    if (props.stopOnConfirm && props.ownerId && run.isConfirmed(props.ownerId)) {
      stopAlarm();
    }
  },
);

function start() {
  if (running.value) return;
  running.value = true;
  timer = window.setInterval(() => {
    if (mode.value === 'stopwatch') {
      elapsed.value += 1;
    } else {
      elapsed.value += 1;
      if (elapsed.value >= seconds.value) {
        if (props.ownerId) run.setConfirmed(props.ownerId, true);
        startAlarm();
        finish();
      }
    }
  }, 1000);
}

function pause() {
  if (running.value) {
    running.value = false;
    if (timer) window.clearInterval(timer);
    timer = null;
  }
  stopAlarm();
}

function finish() {
  running.value = false;
  if (timer) window.clearInterval(timer);
  timer = null;
  // keep alarm running until user action or confirmation
}

function reset() {
  pause();
  elapsed.value = 0;
}

function endTimer() {
  if (timer) window.clearInterval(timer);
  timer = null;
  running.value = false;
  stopAlarm();
}

function fmt(n: number) {
  const m = Math.floor(n / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(n % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

const display = computed(() => {
  if (mode.value === 'stopwatch') return fmt(elapsed.value);
  const remain = Math.max(0, seconds.value - elapsed.value);
  return fmt(remain);
});

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.25;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    window.setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 300);
  } catch (e) {
    void e;
  }
}

function startAlarm() {
  if (alarming.value) return;
  alarming.value = true;
  alarmTimer = window.setInterval(() => beep(), 800);
}

function stopAlarm() {
  alarming.value = false;
  if (alarmTimer) window.clearInterval(alarmTimer);
  alarmTimer = null;
}
</script>
