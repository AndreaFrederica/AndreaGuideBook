<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Andrea Guidebooks Online </q-toolbar-title>

        <q-btn flat dense icon="widgets" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item clickable to="/home">
          <q-item-section>
            <q-item-label>主页</q-item-label>
            <q-item-label caption>Home</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable to="/manuals">
          <q-item-section>
            <q-item-label>说明书合集</q-item-label>
            <q-item-label caption>Manuals</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator spaced />
        <EssentialLink
          :title="'Blog'"
          :caption="'blog.sirrus.cc'"
          :icon="'rss_feed'"
          :link="'https://blog.sirrus.cc'"
        />
      </q-list>
    </q-drawer>

    <q-drawer v-model="rightDrawerOpen" side="right" bordered>
      <q-list>
        <q-item-label header>常驻工具</q-item-label>
        <div class="q-pa-sm">
          <TimerTool :binding="{ id: 'dock-timer', type: 'timer', config: {} }" />
          <div class="q-mt-md">
            <CalculatorTool :binding="{ id: 'dock-calc', type: 'calculator', config: {} }" />
          </div>
        </div>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EssentialLink from 'components/EssentialLink.vue';
import TimerTool from 'components/tools/TimerTool.vue';
import CalculatorTool from 'components/tools/CalculatorTool.vue';

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value;
}
</script>
