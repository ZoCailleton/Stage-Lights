import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import * as dat from 'dat.gui';
import gsap, {Power2} from 'gsap';
import { Howl } from 'howler';
import { Splide } from '@splidejs/splide';
import { URLHash } from '@splidejs/splide-extension-url-hash';

import songs from './data/songs.json';

import './reset.css';
import './style.scss';

import {
  getRandomIntFromInterval,
  getRandomFloatFromInterval,
  createHTMLElement,
} from './_utils';

import {
  introVert,
  baseVert,
  baseFrag,
  violetFrag,
  greenFrag,
  introFrag,
  raveFrag,
  blueFrag
} from "./shaders/shaders";

/**
 * TODO :
 * - Generate musics elements with JSON
 * - Intro bloom bug
 * - Remove the stage bloom persistance
 * - Colored particles
 * - Remove sound on tab change
 */

const SIZE = {
  width: window.innerWidth,
  height: window.innerHeight
};

const MOUSE = {
  x: 0,
  y: 0
};

const lerp = (start, end, t = 0.5) => {
  return start * (1 - t) + end * t;
}

let noInteractionTime = 0;
let debug = false;
let gui = null;
let splide = null;

// Three objects
let cvs = null;
let scene = null;
let camera = null;
let renderer = null;
let clock = null;
let uniforms = null;
let composer = null;
let bloomPass = null;
let planeMeshMiddle = null;
const particles = [];

let sceneIntro = null;
let cameraIntro = null;
let rendererIntro = null;
let composerIntro = null;
let screenIntroMat = null;
const particlesIntro = [];

// Audio objects
let ambianceSound = null;
let neonSound = null;
let tickSound = null;
let wooshSound = null;
let loadSound = null;
let analyser = null;
let audioContext = null;
let source = null;
let dataArray = null;
let audioSrc = null;
let audioElement = null;

// Init needed objects
let verseStart = 0.13;
let clockIntro = new THREE.Clock();

let SCENE = 'intro';
let PAUSE = false;
let STEP = 1;
let AUDIO_STATE = true;
let AUDIO_STATE_BEFORE_LEAVE = true;

let SHADERS = {
  vertex: 'base',
  fragment: 'base'
}

const SHADERS_LIST = [
  'rave',
  'blue',
  'green',
  'violet'
]

const shaderExists = name => SHADERS_LIST.includes(name);

window.addEventListener('mousemove', e => {
  
  MOUSE.x = e.clientX / window.innerWidth - .5;
  MOUSE.y = e.clientY / window.innerHeight - .5;
  
  // Reset the "no interaction" counter
  noInteractionTime = 0;

});

// ========== URL NAVIGATION ========== //

let hash = window.location.hash;

if(hash) {
  
  hash = hash.split('#')[1];

  if(hash === 'debug') debug = true;

}

if(debug) gui = new dat.GUI();

// ========== HTML Elements ========== //

const overlayElt = document.querySelector('.overlay');

const mainElement = document.querySelector('main');
const menuElt = document.querySelector('section.menu');

const introCta = document.querySelector('.intro .cta');
const menuCta = document.querySelector('.menu .cta.start');

const iconLogo = document.querySelector('.app-logo');
const iconBack = document.querySelector('.icon.back');
const iconPause = document.querySelector('.icon.pause');
const iconAudio = document.querySelector('.icon.audio');
const iconFullscreen = document.querySelector('.icon.fullscreen');
const iconGobelins = document.querySelector('.link.partner');

const iconPrevTrack = document.querySelector('.tracks .prev');
const iconNextTrack = document.querySelector('.tracks .next');

// ========== AUDIO ========== //

const setupAudioContext = () => {
  
  audioElement = new Audio(audioSrc);
  audioElement.play();

	audioContext = new window.AudioContext();
	source = audioContext.createMediaElementSource(audioElement);
	analyser = audioContext.createAnalyser();
	source.connect(analyser);
	analyser.connect(audioContext.destination);
	analyser.fftSize = 1024;
	dataArray = new Uint8Array(analyser.frequencyBinCount);

}

// ========== THREE - Lights scene ========== //

const setupCanvasSize = () => {

  cvs.width = SIZE.width;
  cvs.height = SIZE.height;

  cvs.style.width = SIZE.width;
  cvs.style.height = SIZE.height;

}

window.addEventListener('resize', () => {

  SIZE.width = window.innerWidth;
  SIZE.height = window.innerHeight;

  setupCanvasSize();

  cameraIntro.aspect = SIZE.width / SIZE.height;
  cameraIntro.updateProjectionMatrix();

  rendererIntro.setSize(SIZE.width, SIZE.height);
  rendererIntro.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  if(camera != null) {

    camera.aspect = SIZE.width / SIZE.height;
    camera.updateProjectionMatrix();

    updateRenderer();

  }

});

const setupCanvas = () => {
  
  cvs = document.createElement('canvas');
  document.querySelector('.app').append(cvs);

  cvs.addEventListener('click', () => {
    noInteractionTime = 0;
  });

  setupCanvasSize();
  
}

const setupBloom = () => {

  const renderScene = new RenderPass(scene, camera);
  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);

  // Bloom
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.6,
    .5,
    .1
  );
  composer.addPass(bloomPass);

}

const setupLights = () => {

  let ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  ambientLight.castShadow = false;
  scene.add(ambientLight);

  let spotLight = new THREE.SpotLight(0xffffff, 0.55);
  spotLight.castShadow = true;
  spotLight.position.set(0, 80, 10);
  scene.add(spotLight);

}

const setupParticles = (color) => {

  for(let i=0; i<1000; i++) {

    let particleSize = getRandomFloatFromInterval(.1, .2, 1);

    const particleGeometry = new THREE.BoxGeometry(particleSize, particleSize, particleSize);

    const particleMaterial = new THREE.MeshLambertMaterial({
      color
    });
    const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
    particleMesh.position.x = getRandomIntFromInterval(-100, 100);
    particleMesh.position.y = getRandomIntFromInterval(-100, 100);
    particleMesh.position.z = getRandomIntFromInterval(-10, 50);

    particles.push(particleMesh);

    setTimeout(() => {
      scene.add(particleMesh);
    }, getRandomIntFromInterval(0, 1000));

  }

}

const setupCamera = () => {
  
  camera = new THREE.PerspectiveCamera(100, SIZE.width / SIZE.height, 0.1, 100);

  camera.position.x = 0;
  camera.position.z = 100;
  camera.rotation.z = 0.8;

  scene.add(camera);

}

function updateRenderer() {

  renderer.setSize(SIZE.width, SIZE.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

}

const setupScene = () => {

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({
    canvas: cvs,
    antialias: true
  });
  
  updateRenderer();

  setupCamera();
  setupBloom();
  setupLights();
  setupPlaneMiddle();
  setupPlanesVerse();

  //new OrbitControls( camera, renderer.domElement )

}

const setupPlaneMiddle = () => {

  const planeGeometry1 = new THREE.PlaneGeometry(50, 50, 150, 150);
  const planeCustomMaterial1 = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: introVert(),
    fragmentShader: introFrag()
  });

  if(SHADERS.fragment === 'rave') {
    planeCustomMaterial1.fragmentShader = raveFrag();
  } else if(SHADERS.fragment === 'blue') {
    planeCustomMaterial1.fragmentShader = blueFrag();
  } else if(SHADERS.fragment === 'violet') {
    planeCustomMaterial1.fragmentShader = violetFrag();
  } else if(SHADERS.fragment === 'green') {
    planeCustomMaterial1.fragmentShader = greenFrag();
  } else {
    planeCustomMaterial1.fragmentShader = baseFrag();
  }

  planeMeshMiddle = new THREE.Mesh(planeGeometry1, planeCustomMaterial1);
  scene.add(planeMeshMiddle);

}

let planesVerse = [];

const setupPlanesVerse = () => {

  const xs = [60, -60, 0, 0];
  const ys = [0, 0, 60, -60];

  for(let x=0; x<3; x++) {
    for(let y=0; y<=4; y++) {
      const planeGeometry = new THREE.PlaneGeometry(75, 75, 150, 150);
      const planeCustomMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: baseVert(),
        fragmentShader: baseFrag()
      });

      if(SHADERS.fragment === 'rave') {
        planeCustomMaterial.fragmentShader = raveFrag();
      } else if(SHADERS.fragment === 'blue') {
        planeCustomMaterial.fragmentShader = blueFrag();
      } else if(SHADERS.fragment === 'violet') {
        planeCustomMaterial.fragmentShader = violetFrag();
      } else if(SHADERS.fragment === 'green') {
        planeCustomMaterial.fragmentShader = greenFrag();
      } else {
        planeCustomMaterial.fragmentShader = baseFrag();
      }

      const planeMesh = new THREE.Mesh(planeGeometry, planeCustomMaterial);
      scene.add(planeMesh);

      planeMesh.visible = false;
      planeMesh.position.x = xs[y];
      planeMesh.position.y = ys[y];
      planeMesh.position.z = -40*x;

      planesVerse.push(planeMesh);
    }
  }

}

const showPlanesVerse = () => {

  for(let plane of planesVerse) {
    plane.visible = true;
  }

}

setupCanvas();

const play = () => {
  
  SCENE = 'stage';

  clock = new THREE.Clock();
  clockIntro = null;
  verse = false;

  neonSound.play();

  overlayElt.classList.remove('active');
  
  setupAudioContext();

  uniforms = {
    u_time: {
      type: "f",
      value: 1.0,
    },
    u_amplitude: {
      type: "f",
      value: 3.1,
    },
    u_data_arr: {
      type: "float[64]",
      value: dataArray,
    },
  };

  if(debug) {

    const shadersFolder = gui.addFolder('Shaders');
    shadersFolder.open()

  }
  
  setupScene();

  if(SHADERS.fragment === 'rave') {
    setupParticles('#d61609');
  } else if(SHADERS.fragment === 'blue') {
    setupParticles('#69d7ff');
  } else if(SHADERS.fragment === 'green') {
    setupParticles('#4be362');
  } else {
    setupParticles('#ffffff');
  }

}

// ========== SCENE INTRO ========== //

const setupCameraIntro = () => {

  cameraIntro = new THREE.PerspectiveCamera(60, SIZE.width / SIZE.height, 0.1, 100);
  cameraIntro.position.y = 1;
  if(SIZE.width < 500) cameraIntro.position.z = 10;
  else cameraIntro.position.z = 8;

  sceneIntro.add(cameraIntro);

}

const setupRendererIntro = () => {

  rendererIntro = new THREE.WebGLRenderer({
    canvas: cvs,
    antialias: true
  });

  rendererIntro.setSize(SIZE.width, SIZE.height);
  rendererIntro.setPixelRatio(Math.min(window.devicePixelRatio, 2));

}

const setupLightsIntro = () => {

  let ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  ambientLight.castShadow = false;
  sceneIntro.add(ambientLight);

  let spotLight = new THREE.SpotLight(0xffffff, 0.55);
  spotLight.castShadow = true;
  spotLight.position.set(0, 80, 10);
  sceneIntro.add(spotLight);

}

const screenIntroAnimation = () => {
  let tl = gsap.timeline();
  tl.to(screenIntroMat, {opacity: 1, duration: .25, ease: Power2.easeInOut});
  tl.to(screenIntroMat, {opacity: 0, duration: .1, ease: Power2.easeInOut});
  tl.to(screenIntroMat, {opacity: 1, duration: 0, ease: Power2.easeInOut});
  tl.to(screenIntroMat, {opacity: 0, duration: .25, ease: Power2.easeInOut});
}

const setupIntroScreen = () => {

  const boxGeo = new THREE.PlaneGeometry(10, 4, 10);
  screenIntroMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    //map: texture
    transparent: true
  });
  const boxMesh = new THREE.Mesh(boxGeo, screenIntroMat);
  boxMesh.position.z = -1;
  boxMesh.position.y = 2.5;
  screenIntroMat.opacity = 0;
  sceneIntro.add(boxMesh);

}

const setupStageModel = () => {

  setInterval(() => {
    screenIntroAnimation();
  }, 7000);

  const loader = new GLTFLoader();

  loader.load(
    './models/stage/scene.gltf',
    function(gltf) {
  
      sceneIntro.add( gltf.scene );
  
      gltf.animations; // Array<THREE.AnimationClip>
      gltf.scene; // THREE.Group
      gltf.scenes; // Array<THREE.Group>
      gltf.cameras; // Array<THREE.Camera>
      gltf.asset; // Object
  
    },
    function(xhr) {
      document.querySelector('.loader .amount').style.transform = `scaleX(${xhr.loaded / xhr.total})`;
      setTimeout(initAnimation, 1000);
    }
  );

}

const setupParticlesIntro = () => {
  
  for(let i=0; i<200; i++) {

    const particleGeometry = new THREE.SphereGeometry(.01);

    const particleMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff
    });

    const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);

    particleMesh.position.x = getRandomFloatFromInterval(-10, 10, 2);
    particleMesh.position.y = getRandomFloatFromInterval(-3, 20, 2);
    particleMesh.position.z = getRandomFloatFromInterval(-1, 10, 2);

    particlesIntro.push(particleMesh);

    sceneIntro.add(particleMesh);

  }

}

const setupBloomIntro = () => {
  
  const renderSceneIntro = new RenderPass(sceneIntro, cameraIntro);
  composerIntro = new EffectComposer(rendererIntro);
  composerIntro.addPass(renderSceneIntro);

  // Bloom
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    .75,
    .5,
    .1
  );
  composerIntro.addPass(bloomPass);
  
  if(debug) {

    const bloomFolder = gui.addFolder('Bloom');
    bloomFolder.add(bloomPass, 'strength', 0, 10)
    bloomFolder.add(bloomPass, 'radius', 0, 10)
    bloomFolder.open()

  }

}

// ========== UI ========== //

let justMoved = false;

const getCurrentTrack = () => {

  justMoved = true;
  
  setTimeout(() => {
    justMoved = false;
  }, 1000);

  let track = document.querySelector(`.splide__slide.is-active`);
  if(track == undefined) track = document.querySelector('.splide__slide:first-child');

  verseStart = Number(track.dataset.verse);
  audioSrc = track.dataset.source;

  let trackShader = track.dataset.shader;

  if(trackShader != undefined && shaderExists(trackShader)) {
    SHADERS.fragment = track.dataset.shader;
  } else {
    SHADERS.fragment = 'base';
  }

}

getCurrentTrack();

const setupIntroHeading = () => {

  const opacities = ['neon1', 'neon2', 'neon3', 'neon4'];
  
  const heading = document.querySelector('.intro .heading');
  const words = heading.textContent.split(' ');
  heading.innerHTML = '';
  for(let word of words) {
    const wordElt = createHTMLElement('span', 'word');
    for(let letter of word.split('')) {
      const letterElt = createHTMLElement('span', 'letter', letter);
      letterElt.classList.add(opacities[getRandomIntFromInterval(0, 3)], 'neon');
      wordElt.append(letterElt);
    }
    heading.append(wordElt);
  }

}

setupIntroHeading();

// ========== SLIDER ========== //

for(let elt of document.querySelectorAll('.splide__slide')) {
  elt.addEventListener('click', () => {
    if(elt.classList.contains('is-active') && !justMoved) {
      launchStage();
    }
  });
}

const setupTrackSlider = () => {

  // Generate slider with Splide
  splide = new Splide('#track-list', {
    type: 'loop',
    focus: 'center',
    perPage: 7,
    rewind: true,
    arrows: false,
    pagination: false,
    gap: 35,
    snap: true,
    slideFocus: true,
    keyboard: true,
    padding: 0,
    updateOnMove: true,
    lazyLoad: 'nearby',
    breakpoints: {
      2000: {
        perPage: 5
      },
      1600: {
        perPage: 3,
        padding: 250
      },
      1200: {
        perPage: 1,
        padding: 350
      },
      1000: {
        padding: 300
      },
      800: {
        padding: 200
      },
      600: {
        padding: 50
      }
    }
  });

  // Slider activation
  splide.mount({URLHash});

  splide.go( 1 );

  // On slider movement
  splide.on('move resize', getCurrentTrack);
  
  // Slider keyboard control
  window.addEventListener('keyup', e => {

    // Reset the "no interaction" counter
    noInteractionTime = 0;
    
    if(SCENE === 'intro') {

      if(STEP === 1) {
      
        if(e.key === 'Enter') goToMenu();

      }

      if(STEP === 2) {

        if(e.key === 'ArrowLeft') {
          iconPrevTrack.classList.add('hovered');
          setTimeout(() => {
            iconPrevTrack.classList.remove('hovered');
          }, 100);
          splide.go('-1');
          tickSound.play();
        }
    
        if(e.key === 'ArrowRight') {
          iconNextTrack.classList.add('hovered');
          setTimeout(() => {
            iconNextTrack.classList.remove('hovered');
          }, 100);
          splide.go('+1');
          tickSound.play();
        }
      
        if(e.key === 'ArrowUp') backToIntro();
        if(e.key === 'Enter') launchStage();

      }
      
    }

    if(SCENE === 'stage') {

      if(e.key === 'ArrowLeft') goToMenuFromStage();
      
    }
    
    if(e.key === 'f') toggleFullScreen();

  });

  for(let track of document.querySelectorAll('.splide__slide:not(.is-active)')) {
    let id = Number(track.ariaLabel.split(' of ')[0]) - 1;
    track.addEventListener('click', () => {
      splide.go(id);
    });
  }

  iconPrevTrack.addEventListener('click', () => {
    tickSound.play();
    splide.go('-1');
  });

  iconNextTrack.addEventListener('click', () => {
    tickSound.play();
    splide.go('+1');
  });

}

setupTrackSlider();

const createTrackElement = (_data) => {

  const trackElt = createHTMLElement('div', 'track');
  trackElt.classList.add('glide__slide');
  const coverElt = createHTMLElement('div', 'cover');
  const imgElt = createHTMLElement('img', null, `./covers/${_data.cover}`);
  const headingElt = createHTMLElement('h3', 'title', _data.title);
  const authorElt = createHTMLElement('p', 'author', _data.author);

  coverElt.append(imgElt);
  trackElt.append(coverElt, headingElt, authorElt);

  return trackElt;
  
}

function toggleAudio(state) {

  if(state) {

    AUDIO_STATE = true;

    ambianceSound.fade(0, .5, 1000);
    tickSound.volume(.05);
    wooshSound.volume(.01);

    iconAudio.querySelector('img').src = './assets/icon-audio.svg';
    
  } else if(state === false) {

    AUDIO_STATE = false;

    if(AUDIO_STATE_BEFORE_LEAVE) {
      ambianceSound.fade(.5, 0, 1000);
    } else {
      ambianceSound.volume(0);
    }

    tickSound.volume(0);
    wooshSound.volume(0);

    iconAudio.querySelector('img').src = './assets/no-sound.png';

  }

}

function toggleFullScreen() {

  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    iconFullscreen.classList.add('hovered');
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
    iconFullscreen.classList.remove('hovered');
  }

}

const toggleNavigations = state => {

  for(let elt of document.querySelectorAll('.icon, .link.partner')) {
    
    if(state) {
      elt.classList.remove('side');
      cvs.style.cursor = 'default';
    } else {
      elt.classList.add('side');
      cvs.style.cursor = 'none';
    }

  }
  
}

const hidePlanes = () => {

  planeMeshMiddle.visible = false;
  for(let plane of planesVerse) {
    plane.visible = false;
  }

}

const manageMenuElementsVisibility = () => {

  iconLogo.classList.remove('active');
  iconPause.classList.remove('active');
  iconBack.classList.remove('active');
  iconAudio.classList.remove('active');

  if(STEP === 1) {
    iconGobelins.classList.add('active');
  }
  
  if(STEP === 2) {
    iconAudio.classList.add('active');
    iconLogo.classList.add('active');
  }
  
  if(STEP === 3) {
    iconBack.classList.add('active');
    iconPause.classList.add('active');
  }

}

function backToIntro() {

  STEP = 1;

  wooshSound.play();
  
  mainElement.classList.remove('launched');

  manageMenuElementsVisibility();
  getBackToStageTween();
  
}

function goToMenu() {

  STEP = 2;

  wooshSound.play();

  mainElement.classList.add('launched');

  manageMenuElementsVisibility();
  animateStageTween();

}

function goToMenuFromStage() {

  STEP = 2;
  SCENE = 'intro';

  if(PAUSE) {
    togglePause(false);
  }

  audioElement.pause();

  wooshSound.play();
  ambianceSound.fade(0, .5, 1000);

  clockIntro = new THREE.Clock();

  hidePlanes();

  mainElement.classList.add('active');

  manageMenuElementsVisibility();
  animateStageTween();
  
}

function launchStage() {

  if(STEP === 2) {
    setTimeout(play, 1000);
  }
  
  STEP = 3;

  ambianceSound.fade(.5, 0, 1000);
  wooshSound.play();
  loadSound.play();

  manageMenuElementsVisibility();

  enterStageTween();

}

const togglePause = (state) => {
  
  if(state) {
    PAUSE = state;
  } else PAUSE = !PAUSE;

  if(PAUSE) {
    audioElement.pause();
    iconPause.querySelector('img').src = './assets/icon-play.svg';
  } else {
    audioElement.play();
    iconPause.querySelector('img').src = './assets/icon-pause.svg';
  }

}

function animateStageTween() {

  // Step 1 to 2
  let tl = gsap.timeline();
  tl.add('launch');
  tl.to(overlayElt, {opacity: 1, duration: 1, ease: Power2.easeInOut}, 'launch');
  tl.to(cameraIntro.position, {z: 5, y: 2.5, duration: 1, ease: Power2.easeInOut}, 'launch');
  tl.from(menuElt, {opacity: 0, duration: 1, ease: Power2.easeInOut}, 'launch');
  tl.to(menuElt, {opacity: 1, duration: 1, ease: Power2.easeInOut}, 'launch');

}

function getBackToStageTween() {

  // Step 3 to 2
  let tl = gsap.timeline();
  tl.add('back');
  tl.to(overlayElt, {opacity: 0, duration: 1, ease: Power2.easeInOut}, 'launch');
  tl.to(cameraIntro.position, {z: 8, y: 1, duration: 1, ease: Power2.easeInOut}, 'launch');

}

function enterStageTween() {

  // Step 2 to 3
  let tl = gsap.timeline();
  tl.add('enter');
  tl.to(cameraIntro.position, {z: -5, duration: 1, ease: Power2.easeInOut}, 'enter');
  tl.to(overlayElt, {opacity: 0, duration: 1, ease: Power2.easeInOut}, 'enter');
  tl.to(menuElt, {opacity: 0, duration: .25, ease: Power2.easeInOut, onComplete: () => {
    mainElement.classList.remove('active');
  }}, 'enter');

}

function animateStageIntroTween() {

  // Step 0 to 1
  let tl = gsap.timeline();
  tl.from(cameraIntro.position, {y: 20, duration: 2, ease: Power2.easeOut});
  
}

function initAnimation() {

  document.querySelector('.amount').style.transform = 'translateX(100%)';
  
  if(!debug) {

    setTimeout(() => {
      document.querySelector('.loader').style.display = 'none';
      animateStageIntroTween();
    }, 3000);
  
    setTimeout(() => {
      document.querySelector('.intro > .inner').classList.add('active');
      iconFullscreen.classList.add('active');
      iconGobelins.classList.add('active');
      neonSound.play();
      loadSound.play();
    }, 5000);

  } else {

    document.querySelector('.loader').style.display = 'none';
    document.querySelector('.intro > .inner').classList.add('active');
    iconFullscreen.classList.add('active');
    iconGobelins.classList.add('active');
    iconBack.classList.add('active');
    mainElement.classList.add('launched');
    animateStageTween();

  }
  
}

menuCta.addEventListener('click', launchStage);
iconLogo.addEventListener('click', backToIntro);
introCta.addEventListener('click', goToMenu);
iconBack.addEventListener('click', () => {
  tickSound.play();
  goToMenuFromStage();
});
iconPause.addEventListener('click', () => {
  tickSound.play();
  togglePause();
});
iconFullscreen.addEventListener('click', () => {
  tickSound.play();
  toggleFullScreen();
});
iconAudio.addEventListener('click', () => {
  if(AUDIO_STATE) {
    AUDIO_STATE_BEFORE_LEAVE = false;
  } else {
    AUDIO_STATE_BEFORE_LEAVE = true;
  }
  toggleAudio(!AUDIO_STATE);
});

document.addEventListener("visibilitychange", (event) => {
  if(document.visibilityState == "visible") {
    if(AUDIO_STATE_BEFORE_LEAVE) {
      toggleAudio(true);
    }
  } else {
    toggleAudio(false);
  }
});

window.addEventListener('keypress', e => {
  if(e.keyCode === 32) togglePause();
});

// ========== RENDER LOOP ========== //

let xc = 0;
let yc = 0;

let verse = false;

const tick = () => {
  
  if(SCENE === 'intro') {

    const time = clockIntro.getElapsedTime() * .01;

    if(composer != null) composer = null;

    if(composerIntro != null) {
      composerIntro.render(sceneIntro, cameraIntro);
    } else {
      rendererIntro.render(sceneIntro, cameraIntro);
    }

    // Lerp
    xc = lerp(xc, -MOUSE.y * .1, .05);
    yc = lerp(yc, -MOUSE.x * .1, .05);
    
    cameraIntro.rotation.x = xc;
    cameraIntro.rotation.y = yc;
    
    cameraIntro.position.y += Math.sin(time * 100) * 0.001;

    for(let particle of particlesIntro) {
      if(particle.position.y > 10) {
        particle.position.y = 2;
      }
      particle.position.y += getRandomFloatFromInterval(.001, .005, 3);
    }
  
    document.querySelector('.intro .heading').style.transform = `rotateX(${xc*75}deg) rotateY(${-yc*75}deg)`;

  }
  
  if(SCENE === 'stage') {

    const time = clock.getElapsedTime() * .01;

    console.log(time);

    noInteractionTime += 0.01;

    if(noInteractionTime > 2) {
      toggleNavigations(false);
    } else {
      toggleNavigations(true);
    }

    if(!PAUSE) {

      for(let plane of planesVerse) {
        if(plane.position.z > 100) {
          plane.position.z = -30;
        } else {
          plane.position.z += 0.1;
        }
      }

      for(let particle of particles) {
        if(particle.position.z > 100) {
          particle.position.z = -10;
        } else {
          particle.position.z += 0.1;
        }
      }

      if(time > verseStart && !verse) {
        planeMeshMiddle.removeFromParent();
        showPlanesVerse();
        verse = true;
      }
  
      analyser.getByteFrequencyData(dataArray);
  
      uniforms.u_time.value = time;
      uniforms.u_data_arr.value = dataArray;

    }

    composer.render(scene, camera);

  }

  requestAnimationFrame(tick);

}

// ========== SETUP ========== //

const setupAmbianceSound = () => {

  ambianceSound = new Howl({
    src: ['./audio/ambiance.wav'],
    volume: .5,
    loop: true
  });

  neonSound = new Howl({
    src: ['./audio/neo.mp3'],
    volume: .1
  });

  tickSound = new Howl({
    src: ['./audio/tick.wav'],
    volume: .05
  });

  wooshSound = new Howl({
    src: ['./audio/woosh.wav'],
    volume: .25
  });

  loadSound = new Howl({
    src: ['./audio/load.wav'],
    volume: .1
  });
  
  ambianceSound.play();

}

const setupSceneIntro = () => {
  
  sceneIntro = new THREE.Scene();
  
  setupCameraIntro();
  setupRendererIntro();
  setupLightsIntro();
  setupStageModel();
  setupIntroScreen();
  setupParticlesIntro();
  setupBloomIntro();

}

const startExperience = () => {

  setupAmbianceSound();
  setupSceneIntro();

  if(hash === 'menu') {
    goToMenu();
  }

  tick();

}

startExperience();
