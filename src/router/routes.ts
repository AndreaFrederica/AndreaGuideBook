import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'manuals', component: () => import('pages/ManualListPage.vue') },
      { path: 'manuals/:id/edit', component: () => import('pages/ManualEditorPage.vue') },
      { path: 'manuals/:id/run', component: () => import('pages/ManualRunnerPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
