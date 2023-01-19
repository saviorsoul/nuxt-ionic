<template>
  <ion-app v-show="showIonApp">
    <ion-router-outlet id="router-outlet" />
  </ion-app>
</template>

<script setup>
import { onBeforeMount, onMounted } from 'vue'
import { IonApp, IonRouterOutlet } from '@ionic/vue'

const showIonApp = ref(false);
// remove server-side rendered ionic app
onBeforeMount(() => {
  const rootId = 'router-outlet'
  const root = document.getElementById(rootId)
  root.innerHTML = ''
});

onMounted(() => {
  showIonApp.value = true;
});
</script>
