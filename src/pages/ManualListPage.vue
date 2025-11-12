<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6">操作说明书</div>
      <div class="row q-gutter-sm">
        <q-btn color="primary" @click="create">新建说明书</q-btn>
        <q-btn color="secondary" @click="exportAll">导出全部</q-btn>
        <q-btn color="secondary" @click="showImport = true">导入</q-btn>
      </div>
    </div>
    <q-list bordered separator>
      <q-item v-for="m in manuals" :key="m.id">
        <q-item-section>
          <q-item-label>{{ m.name }}</q-item-label>
          <q-item-label caption>{{ m.description }}</q-item-label>
        </q-item-section>
        <q-item-section side class="row q-gutter-sm">
          <q-btn flat color="primary" @click="edit(m.id)">编辑</q-btn>
          <q-btn flat color="secondary" @click="run(m.id)" :disable="m.steps.length === 0"
            >运行</q-btn
          >
          <q-btn flat color="negative" @click="remove(m.id)">删除</q-btn>
          <q-btn flat color="secondary" @click="exportOne(m.id)">导出</q-btn>
        </q-item-section>
      </q-item>
    </q-list>
    <q-dialog v-model="showImport">
      <q-card style="min-width: 400px">
        <q-card-section class="text-h6">导入说明书</q-card-section>
        <q-card-section>
          <q-file v-model="importFile" accept=".json" label="选择JSON文件" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="primary" label="导入" @click="doImport" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useManualStore } from 'src/stores/manual-store';

const router = useRouter();
const manualStore = useManualStore();

onMounted(() => {
  manualStore.load();
});

const manuals = computed(() => manualStore.manuals);
const showImport = ref(false);
const importFile = ref<File | null>(null);

function create() {
  const id = manualStore.createManual({ name: '新的说明书' });
  void router.push(`/manuals/${id}/edit`);
}

function edit(id: string) {
  void router.push(`/manuals/${id}/edit`);
}

function run(id: string) {
  void router.push(`/manuals/${id}/run`);
}

function remove(id: string) {
  manualStore.removeManual(id);
}

function exportAll() {
  const json = manualStore.exportAll();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'manuals.json';
  a.click();
  URL.revokeObjectURL(url);
}

function exportOne(id: string) {
  const json = manualStore.exportById(id);
  if (!json) return;
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `manual-${id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function doImport() {
  if (!importFile.value) return;
  const text = await importFile.value.text();
  try {
    const data = JSON.parse(text);
    manualStore.importAll(data);
    showImport.value = false;
    importFile.value = null;
  } catch (e) {
    void e;
  }
}
</script>
