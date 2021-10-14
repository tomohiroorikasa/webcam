<template lang="pug">
.content
  img(ref="image")
</template>

<script>
// import Convert from './Convert.vue'

export default {
  name: 'Main',
  data () {
    return {
    }
  },
  mounted () {
    window.api.receive('refresh', (image) => {
      // console.log('main\'s refresh')
      this.$refs.image.src = image
    })
  },
  methods: {
  }
}
</script>

<style scoped lang="stylus">
.content
  background-color #ccc
  width 100vw
  img
    width 100%
</style>
