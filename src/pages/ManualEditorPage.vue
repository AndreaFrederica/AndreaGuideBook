<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6">编辑说明书</div>
      <div class="row q-gutter-sm">
        <q-btn color="primary" @click="save">保存</q-btn>
        <q-btn color="secondary" @click="back">返回</q-btn>
      </div>
    </div>
    <q-form class="q-mb-lg">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-input v-model="name" label="名称" />
        </div>
        <div class="col-12 col-md-6">
          <q-input v-model="description" label="描述" />
        </div>
      </div>
    </q-form>

    <div class="text-subtitle1 q-mb-sm">步骤</div>
    <q-list bordered separator class="q-mb-md">
      <q-item v-for="s in steps" :key="s.id">
        <q-item-section>
          <q-input v-model="s.title" label="标题" />
          <q-editor v-model="s.content" height="150px" />
          <div class="row items-center q-gutter-sm q-mt-sm">
            <q-select v-model="newToolType" :options="toolOptions" label="绑定小工具" />
            <q-btn dense @click="addTool(s.id)" label="添加" />
            <q-input v-model="s.groupId" label="并行组ID" />
          </div>
          <div class="q-mt-sm">
            <div v-for="tb in s.toolBindings" :key="tb.id" class="q-pa-sm q-mb-sm bg-grey-2">
              <div class="row items-center justify-between">
                <div>{{ tb.type }}</div>
                <q-btn flat dense color="negative" @click="removeTool(s.id, tb.id)">移除</q-btn>
              </div>
              <div v-if="tb.type === 'timer'" class="row q-col-gutter-sm q-mt-sm">
                <div class="col-6">
                  <q-select
                    v-model="(tb.config as any).mode"
                    :options="['stopwatch', 'countdown']"
                    label="模式"
                  />
                </div>
                <div class="col-6">
                  <q-input v-model.number="(tb.config as any).seconds" type="number" label="秒数" />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="(tb.config as any).sourceFormulaId"
                    label="来源公式工具ID(可选)"
                  />
                </div>
              </div>
              <div v-else-if="tb.type === 'formula'" class="q-mt-sm">
                <q-input v-model="(tb.config as any).expression" label="表达式" />
                <q-input
                  v-model="formulaParamsText[tb.id]"
                  label="参数(逗号分隔)"
                  @update:model-value="updateParams(tb)"
                />
                <div class="row q-col-gutter-sm q-mt-sm">
                  <div class="col-4">
                    <q-select
                      v-model="(tb.config as any).mode"
                      :options="['expr', 'js']"
                      label="模式"
                    />
                  </div>
                  <div class="col-4">
                    <q-input v-model="(tb.config as any).output" label="输出变量名" />
                  </div>
                  <div class="col-12" v-if="(tb.config as any).mode === 'js'">
                    <div class="monaco-wrap">
                      <MonacoEditor v-model:value="(tb.config as any).code" lang="javascript" />
                    </div>
                  </div>
                  <div class="col-12 q-mt-sm">
                    <q-input v-model="(tb.config as any).ref" label="引用名称(@xxx)" />
                  </div>
                  <div class="col-12 q-mt-sm">
                    <div class="row q-col-gutter-sm">
                      <div class="col-6" v-for="p in (tb.config as any).params || []" :key="p">
                        <q-input
                          :model-value="getDefault(tb, p)"
                          type="number"
                          :label="`默认值: ${p}`"
                          @update:model-value="(val) => setDefaultStep(s.id, tb, p, Number(val))"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="col-12 q-mt-sm">
                    <q-btn dense color="primary" label="运行测试" @click="testFormula(tb)" />
                    <div class="text-caption q-mt-xs">
                      测试结果：{{ formulaTestResult[tb.id] || '' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="q-mt-sm">
            <div class="text-caption q-mb-xs">子任务</div>
            <div v-for="td in s.todos || []" :key="td.id" class="q-pa-sm q-mb-sm bg-grey-2">
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-md-6">
                  <q-input v-model="td.title" label="标题" />
                </div>
                <div class="col-12 col-md-6">
                  <q-toggle v-model="td.done" label="完成" />
                </div>
                <div class="col-12">
                  <q-input v-model="td.description" type="textarea" autogrow label="描述" />
                </div>
              </div>
              <div class="row items-center q-gutter-sm q-mt-sm">
                <q-select
                  v-model="newTodoToolType[td.id]"
                  :options="toolOptions"
                  label="绑定小工具"
                  class="col"
                />
                <q-btn dense @click="addTodoTool(s.id, td.id)" label="添加工具" class="col-auto" />
                <q-btn dense flat color="primary" @click="quickAddTodoTool(s.id, td.id, 'timer')"
                  >添加计时器</q-btn
                >
                <q-btn
                  dense
                  flat
                  color="primary"
                  @click="quickAddTodoTool(s.id, td.id, 'calculator')"
                  >添加计算器</q-btn
                >
                <q-btn dense flat color="primary" @click="quickAddTodoTool(s.id, td.id, 'formula')"
                  >添加公式</q-btn
                >
              </div>
              <div class="row q-gutter-sm q-mt-sm">
                <q-chip
                  v-for="tb in td.toolBindings || []"
                  :key="tb.id"
                  removable
                  @remove="removeTodoTool(s.id, td.id, tb.id)"
                >
                  {{ tb.type }}
                </q-chip>
              </div>
              <div v-for="tb in td.toolBindings || []" :key="tb.id" class="q-mt-sm">
                <div v-if="tb.type === 'timer'" class="row q-col-gutter-sm">
                  <div class="col-6">
                    <q-select
                      v-model="(tb.config as any).mode"
                      :options="['stopwatch', 'countdown']"
                      label="模式"
                    />
                  </div>
                  <div class="col-6">
                    <q-input
                      v-model.number="(tb.config as any).seconds"
                      type="number"
                      label="秒数"
                    />
                  </div>
                  <div class="col-6">
                    <q-input v-model="(tb.config as any).sourceFormulaId" label="来源公式工具ID" />
                  </div>
                  <div class="col-6">
                    <q-input v-model="(tb.config as any).sourceRef" label="引用名称(@xxx)" />
                  </div>
                </div>
                <div v-else-if="tb.type === 'formula'">
                  <q-input
                    v-if="(tb.config as any).mode !== 'js'"
                    v-model="(tb.config as any).expression"
                    label="表达式"
                  />
                  <q-input
                    v-model="formulaParamsText[tb.id]"
                    label="参数(逗号分隔)"
                    @update:model-value="updateParams(tb)"
                  />
                  <div class="row q-col-gutter-sm q-mt-sm">
                    <div class="col-4">
                      <q-select
                        v-model="(tb.config as any).mode"
                        :options="['expr', 'js']"
                        label="模式"
                      />
                    </div>
                    <div class="col-4">
                      <q-input v-model="(tb.config as any).output" label="输出变量名" />
                    </div>
                    <div class="col-4">
                      <q-toggle v-model="(tb.config as any).autoRun" label="自动运行公式" />
                    </div>
                    <div class="col-12" v-if="(tb.config as any).mode === 'js'">
                      <div class="monaco-wrap">
                        <MonacoEditor v-model:value="(tb.config as any).code" lang="javascript" />
                      </div>
                    </div>
                    <div class="col-12 q-mt-sm">
                      <q-input v-model="(tb.config as any).ref" label="引用名称(@xxx)" />
                    </div>
                    <div class="col-12 q-mt-sm">
                      <div class="row q-col-gutter-sm">
                        <div class="col-6" v-for="p in (tb.config as any).params || []" :key="p">
                          <q-input
                            :model-value="getDefault(tb, p)"
                            type="number"
                            :label="`默认值: ${p}`"
                            @update:model-value="
                              (val) => setDefaultTodo(s.id, td.id, tb, p, Number(val))
                            "
                          />
                        </div>
                      </div>
                    </div>
                    <div class="col-12 q-mt-sm">
                      <q-btn dense color="primary" label="运行测试" @click="testFormula(tb)" />
                      <div class="text-caption q-mt-xs">
                        测试结果：{{ formulaTestResult[tb.id] || '' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row justify-end q-gutter-sm q-mt-sm">
                <q-btn flat dense color="negative" @click="removeTodo(s.id, td.id)"
                  >删除子任务</q-btn
                >
              </div>
            </div>
            <div class="row q-gutter-sm">
              <q-input v-model="newTodoText" label="新增子任务标题" class="col" />
              <q-btn dense @click="addTodo(s.id)" label="添加子任务" class="col-auto" />
            </div>
          </div>
        </q-item-section>
        <q-item-section side>
          <q-btn flat color="negative" @click="removeStep(s.id)">删除步骤</q-btn>
        </q-item-section>
      </q-item>
    </q-list>
    <q-btn color="primary" @click="addStep">添加步骤</q-btn>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import MonacoEditor from '@guolao/vue-monaco-editor';
import { useRoute, useRouter } from 'vue-router';
import { useManualStore } from 'src/stores/manual-store';
import type { ToolType } from 'src/models/manual';
import { evaluateExpression } from 'src/utils/math';
import { runJS } from 'src/utils/jsEval.js';

const route = useRoute();
const router = useRouter();
const manualStore = useManualStore();
const id = String(route.params.id);

const name = ref('');
const description = ref('');
const toolOptions: ToolType[] = ['timer', 'calculator', 'formula'];
const newToolType = ref<ToolType | null>(null);
const formulaParamsText = ref<Record<string, string>>({});
const newTodoText = ref('');
const newTodoToolType = ref<Record<string, ToolType | null>>({});
const formulaTestResult = ref<Record<string, string>>({});

onMounted(() => {
  manualStore.load();
  const m = manualStore.byId(id);
  if (!m) return;
  name.value = m.name;
  description.value = m.description || '';

  for (const step of m.steps) {
    for (const tb of step.toolBindings) {
      const cfg = (tb.config || {}) as { params?: string[] };
      if (cfg.params && cfg.params.length) {
        formulaParamsText.value[tb.id] = cfg.params.join(',');
      }
    }
    for (const td of step.todos || []) {
      for (const b of td.toolBindings || []) {
        const cfg = (b.config || {}) as { params?: string[] };
        if (cfg.params && cfg.params.length) {
          formulaParamsText.value[b.id] = cfg.params.join(',');
        }
      }
    }
  }
});

const steps = computed(() => manualStore.byId(id)?.steps || []);

function addStep() {
  manualStore.addStep(id, { title: '新步骤', content: '' });
}

function removeStep(stepId: string) {
  manualStore.removeStep(id, stepId);
}

function addTool(stepId: string) {
  if (!newToolType.value) return;
  manualStore.addToolBinding(id, stepId, { type: newToolType.value });
  newToolType.value = null;
}

function removeTool(stepId: string, bindingId: string) {
  manualStore.removeToolBinding(id, stepId, bindingId);
}

import type { ToolBinding } from 'src/models/manual';
function updateParams(tb: ToolBinding) {
  const txt = formulaParamsText.value[tb.id] || '';
  const arr = txt
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const step = steps.value.find((s) => s.toolBindings.some((x) => x.id === tb.id));
  if (step) {
    manualStore.updateToolBinding(id, step.id, tb.id, (t) => {
      const cfg = (t.config || {}) as { params?: string[] };
      cfg.params = arr;
      t.config = cfg as unknown as Record<string, unknown>;
    });
    return;
  }
  const owner = steps.value.find((s) =>
    (s.todos || []).some((td) => (td.toolBindings || []).some((b) => b.id === tb.id)),
  );
  if (!owner) return;
  manualStore.updateStep(id, owner.id, (s) => {
    const td = s.todos?.find((x) => (x.toolBindings || []).some((b) => b.id === tb.id));
    const b = td?.toolBindings?.find((x) => x.id === tb.id);
    if (!b) return;
    const cfg = (b.config || {}) as { params?: string[] };
    cfg.params = arr;
    b.config = cfg as unknown as Record<string, unknown>;
  });
}

function testFormula(tb: ToolBinding) {
  const cfg = (tb.config || {}) as {
    mode?: 'expr' | 'js';
    expression?: string;
    output?: string;
    code?: string;
    params?: string[];
    defaults?: Record<string, number>;
  };
  const params = cfg.params || [];
  const values: Record<string, number> = {};
  const defaults = cfg.defaults as Record<string, number> | undefined;
  for (const p of params) {
    if (defaults && Object.prototype.hasOwnProperty.call(defaults, p)) {
      values[p] = defaults[p]!;
    } else {
      values[p] = 0;
    }
  }
  try {
    let val: number | undefined;
    if (cfg.mode === 'js') {
      const out = runJS(cfg.code || '', values, cfg.output || 'out');
      if (typeof out === 'number') val = out as number;
    } else {
      let expr = cfg.expression || '';
      for (const p of params) {
        const v = values[p] ?? 0;
        const re = new RegExp(`\\b${p}\\b`, 'g');
        expr = expr.replace(re, String(v));
      }
      val = evaluateExpression(expr);
    }
    formulaTestResult.value[tb.id] = val !== undefined ? String(val) : '错误';
  } catch {
    formulaTestResult.value[tb.id] = '错误';
  }
}

function getDefault(tb: ToolBinding, p: string) {
  const cfg = (tb.config || {}) as { defaults?: Record<string, number> };
  return cfg.defaults?.[p] ?? 0;
}

function setDefaultStep(stepId: string, tb: ToolBinding, p: string, val: number) {
  manualStore.updateToolBinding(id, stepId, tb.id, (t) => {
    const cfg = (t.config || {}) as { defaults?: Record<string, number> };
    if (!cfg.defaults) cfg.defaults = {};
    cfg.defaults[p] = val;
    t.config = { ...cfg, defaults: cfg.defaults } as unknown as Record<string, unknown>;
  });
}

function setDefaultTodo(stepId: string, todoId: string, tb: ToolBinding, p: string, val: number) {
  manualStore.updateStep(id, stepId, (s) => {
    const td = s.todos?.find((x) => x.id === todoId);
    const b = td?.toolBindings?.find((x) => x.id === tb.id);
    if (!b) return;
    const cfg = (b.config || {}) as { defaults?: Record<string, number> };
    if (!cfg.defaults) cfg.defaults = {};
    cfg.defaults[p] = val;
    b.config = { ...cfg, defaults: cfg.defaults } as unknown as Record<string, unknown>;
  });
}

function addTodo(stepId: string) {
  if (!newTodoText.value) return;
  manualStore.addTodo(id, stepId, newTodoText.value);
  newTodoText.value = '';
}

function removeTodo(stepId: string, todoId: string) {
  manualStore.removeTodo(id, stepId, todoId);
}

function addTodoTool(stepId: string, todoId: string) {
  const t = newTodoToolType.value[todoId];
  if (!t) return;
  manualStore.addTodoToolBinding(id, stepId, todoId, { type: t });
  newTodoToolType.value[todoId] = null;
}

function removeTodoTool(stepId: string, todoId: string, bindingId: string) {
  manualStore.removeTodoToolBinding(id, stepId, todoId, bindingId);
}

function quickAddTodoTool(stepId: string, todoId: string, type: ToolType) {
  manualStore.addTodoToolBinding(id, stepId, todoId, { type });
}

function save() {
  manualStore.updateManual(id, (m) => {
    m.name = name.value;
    m.description = description.value;
  });
}

function back() {
  void router.push('/manuals');
}
</script>
<style scoped>
.monaco-wrap {
  height: 320px;
}
.monaco-wrap :deep(.monaco-editor) {
  height: 100%;
}
</style>
