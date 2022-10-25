import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import gsap from 'gsap';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import Glide from '@glidejs/glide';

import songs from './data/songs.json';

/**
 * TODO :
 * - Générer les musiques en JSON
 * - Particles sur l'intro
 * - Intro screen
 * - Génération infinie de plane
 * - Variations Fragment Shader
 */

import './reset.css';
import './style.scss';

import { vertexShader, vertexShader2, fragmentShader, fragmentShader2, particleVertexShader, particleFragmentShader, raveFrag, blueFrag } from "./shaders/shaders";

const SIZE = {
  width: window.innerWidth,
  height: window.innerHeight
};

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

const cubeTextureLoader = new THREE.CubeTextureLoader();

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

  camera.aspect = SIZE.width / SIZE.height;
  camera.updateProjectionMatrix();

  renderer.setSize(SIZE.width, SIZE.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

});

const setupCanvas = () => {
  
  cvs = document.createElement('canvas');
  document.querySelector('.app').append(cvs);

  cvs.width = SIZE.width;
  cvs.height = SIZE.height;

  cvs.style.width = SIZE.width;
  cvs.style.height = SIZE.height;
  
}

const setupScene = () => {

  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(100, SIZE.width / SIZE.height, 0.1, 100);

  camera.position.x = 0;
  camera.position.z = 100;

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
  const bloomPass = new UnrealBloomPass(
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

const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const setupParticles = () => {

  for(let i=0; i<2000; i++) {

    const particleGeometry = new THREE.BoxGeometry(.1, .1, .1);

    console.log(SHADERS.fragment);

    const particleMaterial = new THREE.MeshLambertMaterial({
      color: SHADERS.fragment === 'rave' ? 0xd61609 : 0xffffff
    });
    const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
    particleMesh.position.x = randomIntFromInterval(-100, 100);
    particleMesh.position.y = randomIntFromInterval(-100, 100);
    particleMesh.position.z = randomIntFromInterval(-100, 100);

    setTimeout(() => {
      scene.add(particleMesh);
    }, randomIntFromInterval(0, 1000));

  }

}

let planeMeshIntro = null;

const setupPlaneIntro = () => {

  const planeGeometry1 = new THREE.PlaneGeometry(50, 50, 150, 150);
  const planeCustomMaterial1 = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertexShader(),
    fragmentShader: SHADERS.fragment == 'rave' ? raveFrag() : fragmentShader()
    //fragmentShader: SHADERS.fragment == 'rave' ? raveFrag() : blueFrag()
  });
  planeMeshIntro = new THREE.Mesh(planeGeometry1, planeCustomMaterial1);
  scene.add(planeMeshIntro);

}

let planesVerse = [];

const setupPlanesVerse = () => {

  const xs = [60, -60, 0, 0];
  const ys = [0, 0, 60, -60];

  for(let x=0; x<20; x++) {
    for(let y=0; y<=4; y++) {
      const planeGeometry = new THREE.PlaneGeometry(75, 75, 150, 150);
      const planeCustomMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: vertexShader2(),
        fragmentShader: SHADERS.fragment == 'rave' ? raveFrag() : fragmentShader2()
      });
      const planeMesh = new THREE.Mesh(planeGeometry, planeCustomMaterial);
      scene.add(planeMesh);
      planeMesh.position.x = xs[y];
      planeMesh.position.y = ys[y];
      planeMesh.position.z = -40*x;

      planesVerse.push(planeMesh);
    }
  }

}

setupCanvas();
setupScene();

const neonSound = document.getElementById('neon-sound');
neonSound.volume = .25;

const play = () => {

  neonSound.play();

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
  
  setupParticles();
  setupPlaneIntro();

  const clock = new THREE.Clock();

  let verse = false;

  const tick = () => {

    const time = clock.getElapsedTime() * .01;
    
    if(verse) {
      //camera.rotation.z += 0.005;
      camera.position.z -= 0.1;
    } else {
      camera.rotation.z = 0.8;
      camera.position.z -= 0.01;
    }
    //planeMeshIntro.position.z -= 0.1;

    if(time > verseStart && !verse) {
      planeMeshIntro.removeFromParent();
      
      setupPlanesVerse();

      verse = true;
    }

    analyser.getByteFrequencyData(dataArray);

    uniforms.u_time.value = time;
    uniforms.u_data_arr.value = dataArray;

    composer.render(scene, camera);

    requestAnimationFrame(tick);

  }

  tick();

}

const reset = (collection, className) => {
    for(let elt of document.querySelectorAll(collection)) {
      elt.classList.remove(className);
    }
}

const createElement = (tag, className, value=null) => {
  const elt = document.createElement(tag);
  elt.classList.add(className);
  if(value) {
    if(tag === 'img') elt.src = value;
    else elt.innerHTML = value;
  }
  return elt;
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
    peek: -100
  });
  
  glide.mount();

}

setupTrackSlider();

const navElt = document.getElementById('track-list');

const createTrackElement = (_data) => {

  const trackElt = createElement('div', 'track');
  trackElt.classList.add('splide__slide');
  const coverElt = createElement('div', 'cover');
  const imgElt = createElement('img', null, `./covers/${_data.cover}`);
  const headingElt = createElement('h3', 'title', _data.title);
  const authorElt = createElement('p', 'author', _data.author);

  coverElt.append(imgElt);
  trackElt.append(coverElt, headingElt, authorElt);

  return trackElt;
  
}

const loadTrackElts = () => {

  const listTrackElt = createElement('div', 'splide__track');
  const listElt = createElement('div', 'splide__list');

  for(let song of songs) {
    listElt.append(createTrackElement(song));
  }

  listTrackElt.append(listElt);
  navElt.append(listTrackElt);

}

//loadTrackElts();

const intro_cta = document.querySelector('.intro .cta');
const menu_cta = document.querySelector('.menu .cta.start');

const mainElement = document.querySelector('main');

if(debug) {
  
  mainElement.style.display = 'none';
  play();

} else {

  intro_cta.addEventListener('click', () => {
    mainElement.classList.add('launched');
  });

  for(let track of document.querySelectorAll('.track')) {

    track.addEventListener('click', () => {

      reset('.track', 'active');
      verseStart = Number(track.dataset.verse);
      audioElement = track.querySelector('audio');
      track.classList.add('active');

      if(track.dataset.shader != undefined) {
        SHADERS.fragment = track.dataset.shader;
      }

    });
  }

  menu_cta.addEventListener('click', () => {
    mainElement.style.display = 'none';
    audioElement.play();
    play();
  });

}
