<template lang="pug">
.text-center
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
</style>
