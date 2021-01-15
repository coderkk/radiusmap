<script>
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
export default {
  components: {
    Header,
    Footer,
  },
  setup() {

  },
}
</script>
<template>
  <Header />
  <main class="flex-grow">
  <router-view/>
  </main>
  <Footer />
</template>

<style lang="scss">
html, body, #app {
  height: 100%;
}
.flex-col {
  flex-direction: column;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
