import { existsSync, promises } from 'node:fs';
import { addComponent, useNuxt, addImportsSources, installModule, useLogger, defineNuxtModule, addTemplate, addPlugin } from '@nuxt/kit';
import { resolve as resolve$1, join } from 'pathe';
import { readPackageJSON } from 'pkg-types';
import { defineUnimportPreset } from 'unimport';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import * as icons from 'ionicons/icons/index.mjs';

const runtimeDir = fileURLToPath(new URL("./runtime", import.meta.url));

const setupUtilityComponents = () => {
  addComponent({
    name: "IonAnimation",
    filePath: resolve(runtimeDir, "components", "IonAnimation.vue")
  });
};

const useCSSSetup = () => {
  const nuxt = useNuxt();
  const setupCore = () => {
    nuxt.options.css.push("@ionic/vue/css/core.css");
  };
  const setupBasic = () => {
    nuxt.options.css.push(
      "@ionic/vue/css/normalize.css",
      "@ionic/vue/css/structure.css",
      "@ionic/vue/css/typography.css"
    );
  };
  const setupUtilities = () => {
    nuxt.options.css.push(
      "@ionic/vue/css/padding.css",
      "@ionic/vue/css/float-elements.css",
      "@ionic/vue/css/text-alignment.css",
      "@ionic/vue/css/text-transformation.css",
      "@ionic/vue/css/flex-utils.css",
      "@ionic/vue/css/display.css"
    );
  };
  return { setupCore, setupBasic, setupUtilities };
};

const iconsPreset = defineUnimportPreset({
  from: "ionicons/icons",
  imports: Object.keys(icons).map((name) => ({
    name,
    as: "ionicons" + name[0].toUpperCase() + name.slice(1)
  }))
});
const setupIcons = () => {
  const nuxt = useNuxt();
  nuxt.options.build.transpile.push(/ionicons/);
  addImportsSources(iconsPreset);
};

const setupMeta = () => {
  const nuxt = useNuxt();
  const metaDefaults = [
    { name: "color-scheme", content: "light dark" },
    { name: "format-detection", content: "telephone: no" },
    { name: "msapplication-tap-highlight", content: "no" }
  ];
  nuxt.options.app.head.meta = nuxt.options.app.head.meta || [];
  for (const meta of metaDefaults) {
    if (!nuxt.options.app.head.meta.some((i) => i.name === meta.name)) {
      nuxt.options.app.head.meta.unshift(meta);
    }
  }
  const viewport = nuxt.options.app.head.meta.find((i) => i.name === "viewport");
  if (viewport?.content === "width=device-width, initial-scale=1") {
    viewport.content = "viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no";
  }
};

const setupPWA = async () => {
  const nuxt = useNuxt();
  nuxt.options.pwa = nuxt.options.pwa || {};
  const pwaOptions = nuxt.options.pwa;
  pwaOptions.meta = pwaOptions.meta || {};
  pwaOptions.meta.mobileAppIOS = pwaOptions.meta.mobileAppIOS ?? true;
  await installModule("@kevinmarrec/nuxt-pwa");
};

const setupRouter = () => {
  const nuxt = useNuxt();
  const logger = useLogger();
  const pagesDirs = nuxt.options._layers.map(
    (layer) => resolve$1(layer.config?.srcDir || layer.cwd, layer.config?.dir?.pages || "pages")
  );
  if (nuxt.options.pages === false || nuxt.options.pages !== true && !pagesDirs.some((dir) => existsSync(dir))) {
    logger.info("Disabling Ionic Router integration as pages dir does not exist.");
    return;
  }
  nuxt.options.vite.optimizeDeps = nuxt.options.vite.optimizeDeps || {};
  nuxt.options.vite.optimizeDeps.include = nuxt.options.vite.optimizeDeps.include || [];
  nuxt.options.vite.optimizeDeps.include.push("@ionic/vue-router");
  nuxt.hook("modules:done", () => {
    nuxt.hook("app:resolve", (app) => {
      app.plugins = app.plugins.filter(
        (p) => !p.src.match(/nuxt3?\/dist\/(app\/plugins|pages\/runtime)\/router/)
      );
      app.plugins.unshift({
        src: resolve$1(runtimeDir, "router"),
        mode: "all"
      });
    });
  });
  nuxt.hook("app:resolve", (app) => {
    if (!app.mainComponent || app.mainComponent.includes("@nuxt/ui-templates") || app.mainComponent.match(/nuxt3?\/dist/)) {
      app.mainComponent = join(runtimeDir, "app.vue");
    }
  });
};

const module = defineNuxtModule({
  meta: {
    name: "nuxt-ionic",
    configKey: "ionic",
    compatibility: {
      nuxt: "^3.0.0"
    }
  },
  defaults: {
    integrations: {
      meta: true,
      pwa: true,
      router: true,
      icons: true
    },
    css: {
      core: true,
      basic: true,
      utilities: false
    },
    config: {}
  },
  async setup(options, nuxt) {
    nuxt.options.build.transpile.push(runtimeDir);
    nuxt.options.build.transpile.push(/@ionic/, /@stencil/);
    addTemplate({
      filename: "ionic/vue-config.mjs",
      getContents: () => `export default ${JSON.stringify(options.config)}`
    });
    const ionicConfigPath = join(nuxt.options.rootDir, "ionic.config.json");
    if (!existsSync(ionicConfigPath)) {
      await promises.writeFile(
        ionicConfigPath,
        JSON.stringify(
          {
            name: await readPackageJSON(nuxt.options.rootDir).then(
              ({ name }) => name || "nuxt-ionic-project"
            ),
            integrations: {},
            type: "vue"
          },
          null,
          2
        )
      );
    }
    addPlugin(resolve$1(runtimeDir, "ionic"));
    nuxt.options.vite.optimizeDeps = nuxt.options.vite.optimizeDeps || {};
    nuxt.options.vite.optimizeDeps.include = nuxt.options.vite.optimizeDeps.include || [];
    nuxt.options.vite.optimizeDeps.include.push("@ionic/vue");
    setupUtilityComponents();
    IonicBuiltInComponents.map(
      (name) => addComponent({
        name,
        export: name,
        filePath: "@ionic/vue"
      })
    );
    addImportsSources(
      defineUnimportPreset({
        from: "@ionic/vue",
        imports: [...IonicHooks]
      })
    );
    const { setupBasic, setupCore, setupUtilities } = useCSSSetup();
    if (options.css?.core) {
      await setupCore();
    }
    if (options.css?.basic) {
      await setupBasic();
    }
    if (options.css?.utilities) {
      await setupUtilities();
    }
    if (options.integrations?.icons) {
      await setupIcons();
    }
    if (options.integrations?.meta) {
      await setupMeta();
    }
    if (options.integrations?.pwa) {
      await setupPWA();
    }
    if (options.integrations?.router) {
      await setupRouter();
    }
  }
});
const IonicHooks = [
  "createAnimation",
  "createGesture",
  "getPlatforms",
  "getTimeGivenProgression",
  "iosTransitionAnimation",
  "isPlatform",
  "mdTransitionAnimation",
  "menuController",
  "onIonViewDidEnter",
  "onIonViewDidLeave",
  "onIonViewWillEnter",
  "onIonViewWillLeave",
  "useBackButton",
  "useIonRouter",
  "useKeyboard"
];
const IonicBuiltInComponents = [
  "IonAccordion",
  "IonAccordionGroup",
  "IonActionSheet",
  "IonAlert",
  "IonApp",
  "IonAvatar",
  "IonBackButton",
  "IonBackdrop",
  "IonBadge",
  "IonBreadcrumb",
  "IonBreadcrumbs",
  "IonButton",
  "IonButtons",
  "IonCard",
  "IonCardContent",
  "IonCardHeader",
  "IonCardSubtitle",
  "IonCardTitle",
  "IonCheckbox",
  "IonChip",
  "IonCol",
  "IonContent",
  "IonDatetime",
  "IonDatetimeButton",
  "IonFab",
  "IonFabButton",
  "IonFabList",
  "IonFooter",
  "IonGrid",
  "IonHeader",
  "IonIcon",
  "IonImg",
  "IonInfiniteScroll",
  "IonInfiniteScrollContent",
  "IonInput",
  "IonItem",
  "IonItemDivider",
  "IonItemGroup",
  "IonItemOption",
  "IonItemOptions",
  "IonItemSliding",
  "IonLabel",
  "IonList",
  "IonListHeader",
  "IonLoading",
  "IonMenu",
  "IonMenuButton",
  "IonMenuToggle",
  "IonModal",
  "IonNav",
  "IonNavLink",
  "IonNote",
  "IonPage",
  "IonPicker",
  "IonPopover",
  "IonProgressBar",
  "IonRadio",
  "IonRadioGroup",
  "IonRange",
  "IonRefresher",
  "IonRefresherContent",
  "IonReorder",
  "IonReorderGroup",
  "IonRippleEffect",
  "IonRouterOutlet",
  "IonRow",
  "IonSearchbar",
  "IonSegment",
  "IonSegmentButton",
  "IonSelect",
  "IonSelectOption",
  "IonSkeletonText",
  "IonSlide",
  "IonSlides",
  "IonSpinner",
  "IonSplitPane",
  "IonTabBar",
  "IonTabButton",
  "IonTabs",
  "IonText",
  "IonTextarea",
  "IonThumbnail",
  "IonTitle",
  "IonToast",
  "IonToggle",
  "IonToolbar",
  "IonVirtualScroll"
];

export { module as default };
