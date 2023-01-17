<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tab 3</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      {{  timeData }}
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tab 3</ion-title>
        </ion-toolbar>
      </ion-header>
      <ExploreContainer name="Tab 3 page" />
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
const { data: timeData } = await useFetch(
  'https://worldtimeapi.org/api/timezone/Europe/Kiev'
);
</script>
