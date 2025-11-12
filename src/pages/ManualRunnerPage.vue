<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6">运行说明书</div>
      <div class="text-caption">步骤 {{ progress.index + 1 }}/{{ progress.total }}</div>
    </div>
    <q-stepper v-model="blockIndex" flat color="primary" animated>
      <q-step v-for="(blk, idx) in blocks" :key="idx" :name="idx" :title="blockTitle(blk)">
        <div class="row q-col-gutter-md">
          <div
            v-for="s in blockSteps(blk)"
            :key="s.id"
            :class="blk.size > 1 ? 'col-12 col-md-6' : 'col-12'"
          >
            <div class="q-mb-md" v-if="s.content && s.content.trim().length">
              <q-editor :model-value="renderContent(s.content)" readonly :toolbar="[]" />
            </div>
            <div v-if="(s.todos || []).length" class="q-mb-md">
              <div class="text-caption q-mb-xs">子任务</div>
              <div v-for="td in s.todos" :key="td.id" class="q-pa-sm q-mb-sm bg-grey-2">
                <div class="row items-center q-gutter-sm q-mb-sm">
                  <div class="col">
                    <div class="text-subtitle2">{{ td.title }}</div>
                    <div class="text-caption" v-html="renderContent(td.description || '')"></div>
                  </div>
                  <div class="col-auto">
                    <q-checkbox v-model="todoStates[td.id]" label="完成" />
                    <q-btn
                      flat
                      dense
                      color="secondary"
                      @click="confirmTodo(td.id)"
                      :disable="!todoStates[td.id]"
                      >确认</q-btn
                    >
                  </div>
                </div>
                <tools-panel
                  :bindings="td.toolBindings || []"
                  :owner-id="td.id"
                  :stop-on-confirm="true"
                />
              </div>
            </div>
            <tools-panel :bindings="s.toolBindings" :owner-id="s.id" :stop-on-confirm="true" />
          </div>
        </div>
      </q-step>
      <template #navigation>
        <q-stepper-navigation>
          <q-btn color="primary" @click="next" :disable="isLast || !canNext">下一步</q-btn>
          <q-btn flat @click="prev" class="q-ml-sm" :disable="isFirst">上一步</q-btn>
          <q-btn flat @click="backHome" class="q-ml-sm">返回首页</q-btn>
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useManualStore } from 'src/stores/manual-store';
import { useRunStore } from 'src/stores/run-store';
import ToolsPanel from 'components/ToolsPanel.vue';

const route = useRoute();
const manualStore = useManualStore();
const router = useRouter();
const run = useRunStore();

onMounted(() => {
  manualStore.load();
  const id = String(route.params.id);
  run.start(id, 0);
});

const steps = computed(() => run.steps);
const blocks = computed<Array<{ start: number; size: number }>>(() => run.blocks);
const progress = computed(() => run.progress);
const blockIndex = ref(0);

watch(blockIndex, (v) => run.jumpTo(v));
watch(
  () => run.currentBlockIndex,
  (v) => (blockIndex.value = v),
);

const isFirst = computed(() => blockIndex.value === 0);
const isLast = computed(() => blockIndex.value >= blocks.value.length - 1);

function blockSteps(blk: { start: number; size: number }) {
  return steps.value.slice(blk.start, blk.start + blk.size);
}

function blockTitle(blk: { start: number; size: number }) {
  const list = blockSteps(blk);
  if (list.length === 0) return '并行组';
  if (list.length === 1) return list[0]?.title || '并行组';
  return list.map((s) => s.title).join(' | ');
}

const todoStates = ref<Record<string, boolean>>({});
function confirmTodo(todoId: string) {
  run.setConfirmed(todoId, true);
}
const canNext = computed(() => {
  const blk = blocks.value[blockIndex.value];
  if (!blk) return false;
  const list = blockSteps(blk);
  for (const s of list) {
    if (s.todos && s.todos.length > 0) {
      for (const td of s.todos) {
        if (!run.isConfirmed(td.id)) return false;
      }
    }
  }
  return true;
});

function next() {
  run.next();
}

function prev() {
  run.prev();
}

function backHome() {
  void router.push('/manuals');
}

function renderContent(text: string) {
  if (!text) return '';
  return text.replace(/@([a-zA-Z_]\w*)/g, (_, name: string) => {
    const v = run.getRef(name);
    return typeof v === 'number' ? String(v) : `@${name}`;
  });
}
</script>
