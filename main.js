import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import gsap, {Power2} from 'gsap';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import Glide from '@glidejs/glide';

import Swiper from 'swiper';

import songs from './data/songs.json';

/**
 * TODO :
 * - Génération infinie de planes
 * - Dat GUI
 * - Loader
 * - Particles Intro
 * - Mouse Lerp
 * - Carousel
 * - Particles sur l'intro
 * - Intro screen
 * - Générer les musiques en JSON
 */

import './reset.css';
import './style.scss';

import {
  vertexShader,
  vertexShader2,
  vertexShader3,
  fragmentShader,
  fragmentShader2,
  fragmentShader3,
  fragmentShader4,
  particleVertexShader,
  particleFragmentShader,
  raveFrag,
  blueFrag
} from "./shaders/shaders";

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

window.addEventListener('mousemove', e => {
  MOUSE.x = e.clientX / window.innerWidth - .5;
  MOUSE.y = e.clientY / window.innerHeight - .5;
});

let SCENE = 'intro';
let PAUSE = false;

// Objects to init
let gui = null;

let verseStart = 0.13;

let cvs = null;
let scene = null;
let camera = null;
let renderer = null;

let analyser = null;
let audioContext = null;
let source = null;
let dataArray = null;

let uniforms = null;

let composer = null;

let SHADERS = {
  vertex: 'base',
  fragment: 'base'
}

// Check the url to enter debug mode
let debug = window.location.hash && window.location.hash === '#debug';

if(debug) {
  // Debug
  gui = new dat.GUI();
}

window.addEventListener('resize', () => {

  SIZE.width = window.innerWidth;
  SIZE.height = window.innerHeight;

  cvs.width = SIZE.width;
  cvs.height = SIZE.height;

  cvs.style.width = SIZE.width;
  cvs.style.height = SIZE.height;

  if(SCENE === 'intro') {

    cameraIntro.aspect = SIZE.width / SIZE.height;
    cameraIntro.updateProjectionMatrix();

    rendererIntro.setSize(SIZE.width, SIZE.height);
    rendererIntro.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
  } else if(SCENE === 'stage') {

    camera.aspect = SIZE.width / SIZE.height;
    camera.updateProjectionMatrix();

    renderer.setSize(SIZE.width, SIZE.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  }

});

const setupCanvas = () => {
  
  cvs = document.createElement('canvas');
  document.querySelector('.app').append(cvs);

  cvs.width = SIZE.width;
  cvs.height = SIZE.height;

  cvs.style.width = SIZE.width;
  cvs.style.height = SIZE.height;
  
}

let bloomPass;

const setupScene = () => {

  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(100, SIZE.width / SIZE.height, 0.1, 100);

  camera.position.x = 0;
  camera.position.z = 100;
  camera.rotation.z = 0.8;

  scene.add(camera);

  renderer = new THREE.WebGLRenderer({
    canvas: cvs,
    antialias: true
  });

  renderer.setSize(SIZE.width, SIZE.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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

  //new OrbitControls( camera, renderer.domElement )

  let ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  ambientLight.castShadow = false;
  scene.add(ambientLight);

  let spotLight = new THREE.SpotLight(0xffffff, 0.55);
  spotLight.castShadow = true;
  spotLight.position.set(0, 80, 10);
  scene.add(spotLight);

}

let audioElement = document.querySelector('.track:first-child audio');

const setupAudioContext = () => {

	audioContext = new window.AudioContext();
	source = audioContext.createMediaElementSource(audioElement);
	analyser = audioContext.createAnalyser();
	source.connect(analyser);
	analyser.connect(audioContext.destination);
	analyser.fftSize = 1024;
	dataArray = new Uint8Array(analyser.frequencyBinCount);

}

const getRandomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

function getRandomFloat(min, max, decimals) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

const particles = [];

const setupParticles = (_color='0xffffff') => {

  for(let i=0; i<1000; i++) {

    let particleSize = getRandomFloat(.1, .2, 1);

    const particleGeometry = new THREE.BoxGeometry(particleSize, particleSize, particleSize);

    const particleMaterial = new THREE.MeshLambertMaterial({
      color: _color
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

let planeMeshIntro = null;

const setupPlaneIntro = () => {

  const planeGeometry1 = new THREE.PlaneGeometry(50, 50, 150, 150);
  const planeCustomMaterial1 = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertexShader(),
    //vertexShader: vertexShader3(),
    fragmentShader: fragmentShader()
  });

  if(SHADERS.fragment === 'rave') {
    planeCustomMaterial1.fragmentShader = raveFrag();
  } else if(SHADERS.fragment === 'blue') {
    planeCustomMaterial1.fragmentShader = blueFrag();
  }

  planeMeshIntro = new THREE.Mesh(planeGeometry1, planeCustomMaterial1);
  scene.add(planeMeshIntro);

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
        vertexShader: vertexShader2(),
        fragmentShader: fragmentShader2()
      });

      if(SHADERS.fragment === 'rave') {
        planeCustomMaterial.fragmentShader = raveFrag();
      } else if(SHADERS.fragment === 'blue') {
        planeCustomMaterial.fragmentShader = blueFrag();
      } else if(SHADERS.fragment === 'violet') {
        planeCustomMaterial.fragmentShader = fragmentShader3();
      } else if(SHADERS.fragment === 'green') {
        planeCustomMaterial.fragmentShader = fragmentShader4();
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

const neonSound = document.getElementById('neon-sound');
neonSound.volume = .25;

const play = () => {
  
  SCENE = 'stage';

  neonSound.play();
  audioElement.play();

  navTopElt.classList.remove('active');
  overlayElt.classList.remove('active');

  if (audioContext === null) setupAudioContext();

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
  
  setupScene();
  setupPlaneIntro();
  setupPlanesVerse();
  if(SHADERS.fragment === 'rave') setupParticles(0xd61609);
  else if(SHADERS.fragment === 'blue') setupParticles(0x69d7ff);
  else setupParticles();

}

const createHTMLElement = (tag, className, value=null) => {
  const elt = document.createElement(tag);
  elt.classList.add(className);
  if(value) {
    if(tag === 'img') elt.src = value;
    else elt.innerHTML = value;
  }
  return elt;
}

const setupIntroHeading = () => {

  const opacities = ['neon1', 'neon2', 'neon3', 'neon4'];
  
  const heading = document.querySelector('.intro .heading');
  const words = heading.textContent.split(' ');
  heading.innerHTML = '';
  for(let word of words) {
    const wordElt = createHTMLElement('span', 'word');
    for(let letter of word.split('')) {
      const letterElt = createHTMLElement('span', 'letter', letter);
      letterElt.classList.add(opacities[getRandomIntFromInterval(0, 3)]);
      wordElt.append(letterElt);
    }
    heading.append(wordElt);
  }

  neonSound.play();

}

setupIntroHeading();

const reset = (collection, className) => {
    for(let elt of document.querySelectorAll(collection)) {
      elt.classList.remove(className);
    }
}

const setupTrackSlider = () => {

  const glide = new Glide('#track-list', {
    type: 'carousel',
    start: 5,
    focusAt: 'center',
    perView: 6,
    gap: 50,
    rewind: true,
    focusAt: 'center',
    peek: -100,
    swipeThreshold: 200,
    breakpoints: {
      600: { perView: 2 },
      800: { perView: 3 },
      1000: { perView: 3 },
      1200: { perView: 4 },
    }
  });
  
  glide.mount();

  /* const swiper = new Swiper('.swiper', {
    loop: true,
    slidesPerView: 5,
    spaceBetween: 35,
    keyboard: {
      enabled: true
    }
  }); */

}

const trackList = document.getElementById('track-list');

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

const loadTrackElts = () => {

  const listTrackElt = createHTMLElement('div', 'glide__track');
  const listElt = createHTMLElement('div', 'glide__slides');

  for(let song of songs) {
    listElt.append(createTrackElement(song));
  }

  listTrackElt.append(listElt);
  trackList.append(listTrackElt);

}

//loadTrackElts();
setupTrackSlider();

const intro_cta = document.querySelector('.intro .cta');
const menu_cta = document.querySelector('.menu .cta.start');

const mainElement = document.querySelector('main');

intro_cta.addEventListener('click', () => {
  animateStage();
  mainElement.classList.add('launched');
});

for(let track of document.querySelectorAll('.track')) {

  track.addEventListener('click', () => {

    reset('.track', 'active');

    verseStart = Number(track.dataset.verse);
    audioElement = track.querySelector('audio');
    console.log(audioElement);
    track.classList.add('active');

    console.log(verseStart);

    if(track.dataset.shader != undefined) {
      SHADERS.fragment = track.dataset.shader;
    }

  });
}

menu_cta.addEventListener('click', () => {
  mainElement.classList.remove('active');
  enterStage();
  setTimeout(play, 1000);
});

// ========== SCENE INTRO ========== //

let sceneIntro = null;
let cameraIntro = null;
let rendererIntro = null;
let composerIntro = null;

const headingIntroElt = document.querySelector('.intro .heading');

const setupCameraIntro = () => {

  cameraIntro = new THREE.PerspectiveCamera(60, SIZE.width / SIZE.height, 0.1, 100);
  cameraIntro.position.y = 1;
  cameraIntro.position.z = 8;

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

const setupStageModel = () => {

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
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    }
  );

}

const particlesIntro = [];

const setupParticlesIntro = () => {
  
  for(let i=0; i<100; i++) {

    const particleGeometry = new THREE.BoxGeometry(.02, .02, .02);

    const particleMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff
    });
    const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
    particleMesh.position.x = getRandomIntFromInterval(-10, 10);
    particleMesh.position.y = getRandomIntFromInterval(0, 1);
    particleMesh.position.z = getRandomIntFromInterval(-10, 10);

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
    .5,
    .5,
    .1
  );
  composerIntro.addPass(bloomPass);

}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

const overlayElt = document.querySelector('.overlay');
const navTopElt = document.querySelector('.navigation.top');
const iconBack = document.querySelector('.navigation .icon.back');
const iconPause = document.querySelector('.navigation .icon.pause');
const iconFullscreen = document.querySelector('.navigation .icon.fullscreen');

iconBack.addEventListener('click', () => {
  mainElement.classList.add('active');
  audioElement.pause();
  SCENE = 'intro';
  animateStage();
});

iconPause.addEventListener('click', () => {
  PAUSE = !PAUSE;
});

iconFullscreen.addEventListener('click', () => {
  toggleFullScreen();
});

const setupSceneIntro = () => {
  
  sceneIntro = new THREE.Scene();

  setupCameraIntro();
  setupRendererIntro();
  setupLightsIntro();
  setupStageModel();
  //setupParticlesIntro();
  setupBloomIntro();

}

setupSceneIntro();

function animateStage() {
  gsap.to(cameraIntro.position, {z: 5, duration: 1, ease: Power2.easeInOut});
}

function enterStage() {
  gsap.to(cameraIntro.position, {z: -5, duration: 1, ease: Power2.easeInOut});
}

function animateStageIntro() {
  gsap.from(cameraIntro.position, {y: 20, duration: 2, ease: Power2.easeOut});
}

//animateStageIntro();

const clock = new THREE.Clock();

let xc = 0;
let yc = 0;

let verse = false;

const tick = () => {

  // Lerp
  xc = lerp(xc, -MOUSE.y * .1, .05);
  yc = lerp(yc, -MOUSE.x * .1, .05);
  
  if(SCENE === 'intro') {

    if(composerIntro != null) {
      composerIntro.render(sceneIntro, cameraIntro);
    } else {
      rendererIntro.render(sceneIntro, cameraIntro);
    }

    cameraIntro.rotation.x = xc;
    cameraIntro.rotation.y = yc;

    for(let particle of particlesIntro) {
      if(particle.position.y > 2) {
        particle.position.y = -1;
      }
      particle.position.y += getRandomFloat(.001, .005, 3);
    }
  
    headingIntroElt.style.transform = `rotate3d(${xc}, ${yc}, 0)`;

  }
  
  if(SCENE === 'stage') {

    const time = clock.getElapsedTime() * .01;
  
    //console.log(time);
    
    if(verse) {
      //camera.rotation.z += 0.005;
      //camera.position.z -= 0.1;
    } else {
      //camera.position.z -= 0.01;
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
          particle.position.z = -50;
        } else {
          particle.position.z += 0.1;
        }
      }

    }

    if(time > verseStart && !verse) {
      planeMeshIntro.removeFromParent();
      showPlanesVerse();
      verse = true;
    }

    analyser.getByteFrequencyData(dataArray);

    uniforms.u_time.value = time;
    uniforms.u_data_arr.value = dataArray;

    composer.render(scene, camera);

  }

  requestAnimationFrame(tick);

}

tick();
