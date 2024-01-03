import {
  CubeTextureLoader,
  LoadingManager,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  VSMShadowMap,
  WebGLRenderer
} from 'three'
import { EffectComposer, RenderPass, CopyPass } from 'postprocessing'
import { Pane } from 'tweakpane'
import { ControlMode, SpatialControls } from 'spatial-controls'
import { calculateVerticalFoV, FPSMeter } from './utils/index'
import * as CornellBox from './objects/CornellBox'

function load() {
  const assets = new Map()
  const loadingManager = new LoadingManager()
  const cubeTextureLoader = new CubeTextureLoader(loadingManager)

  const path = './static/img/textures/skies/sunset/'
  const format = '.png'
  const urls = [
    path + 'px' + format,
    path + 'nx' + format,
    path + 'py' + format,
    path + 'ny' + format,
    path + 'pz' + format,
    path + 'nz' + format
  ]

  return new Promise((resolve, reject) => {
    loadingManager.onLoad = () => resolve(assets)
    loadingManager.onError = (url) => reject(new Error(`Failed to load ${url}`))

    cubeTextureLoader.load(urls, (t) => {
      t.colorSpace = SRGBColorSpace
      assets.set('sky', t)
    })
  })
}

window.addEventListener('load', () =>
  load().then((assets: any) => {
    // 渲染器
    const renderer = new WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false,
      stencil: false,
      depth: false
    })
    renderer.debug.checkShaderErrors = window.location.hostname === 'localhost'
    renderer.shadowMap.type = VSMShadowMap
    renderer.shadowMap.autoUpdate = false
    renderer.shadowMap.needsUpdate = true
    renderer.shadowMap.enabled = true
    // 容器
    const container = document.getElementById('viewport') as HTMLElement
    container.appendChild(renderer.domElement)
    // 相机
    const camera = new PerspectiveCamera()
    // 控制器
    const controls = new SpatialControls(
      camera.position,
      camera.quaternion,
      renderer.domElement
    )
    const settings = controls.settings
    settings.general.mode = ControlMode.THIRD_PERSON
    settings.rotation.sensitivity = 2.2
    settings.rotation.damping = 0.05
    settings.zoom.damping = 0.1
    settings.translation.enabled = false
    controls.position.set(0, 0, 5)

    // 场景
    const scene = new Scene()
    scene.background = assets.get('sky')
    // 光照
    scene.add(CornellBox.createLights())
    // 环境
    scene.add(CornellBox.createEnvironment())
    // 目标
    scene.add(CornellBox.createActors())
    // 后期处理
    const maxSamples = renderer.capabilities.maxSamples
    const composer = new EffectComposer(renderer, {
      multisampling: Math.min(4, maxSamples)
    })
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(new CopyPass())
    // 配置
    const fpsMeter = new FPSMeter()
    const pane = new Pane({
      container: container.querySelector('.tp') as HTMLElement
    })
    // @ts-ignore;
    pane.addBinding(fpsMeter, 'fps', { readonly: true, label: 'FPS' })
    // @ts-ignore;
    const folder = pane.addFolder({ title: 'Settings' })
    folder.addBinding(composer, 'multisampling', {
      label: 'MSAA',
      options: {
        OFF: 0,
        LOW: Math.min(2, maxSamples),
        MEDIUM: Math.min(4, maxSamples),
        HIGH: Math.min(8, maxSamples)
      }
    })
    // 屏幕自适应调整
    function onResize() {
      const width = window.innerWidth,
        height = window.innerHeight
      camera.aspect = width / height
      camera.fov = calculateVerticalFoV(90, Math.max(camera.aspect, 16 / 9))
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      composer.setSize(width, height)
    }
    window.addEventListener('resize', onResize)
    onResize()
    // 帧循环渲染
    requestAnimationFrame(function render(timestamp) {
      fpsMeter.update(timestamp)
      controls.update(timestamp)
      composer.render()
      requestAnimationFrame(render)
    })
  })
)
