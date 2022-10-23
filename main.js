import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

import './reset.css';
import './style.scss';

import { vertexShader, fragmentShader } from "./shaders/shaders";

const SIZE = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Objects to init
let gui = null;

let cvs = null;
let scene = null;
let camera = null;
let renderer = null;

let analyser = null;
let audioContext = null;
let source = null;
let dataArray = null;

let uniforms = null;

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
  cvs.style.backgroundColor = 'red';
  
}

const setupScene = () => {

  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(100, SIZE.width / SIZE.height, 0.1, 100);

  camera.position.x = 0;
  if(!debug) camera.position.y = -100;
  camera.position.z = 30;
  camera.rotation.x = .5;

  scene.add(camera);

  renderer = new THREE.WebGLRenderer({
    canvas: cvs,
    antialias: true
  });

  renderer.setSize(SIZE.width, SIZE.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  let ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  ambientLight.castShadow = false;
  scene.add(ambientLight);

  let spotLight = new THREE.SpotLight(0xffffff, 0.55);
  spotLight.castShadow = true;
  spotLight.position.set(0, 80, 10);
  scene.add(spotLight);

}

const audioElement = document.getElementById('audio');

const setupAudioContext = () => {

	audioContext = new window.AudioContext();
	source = audioContext.createMediaElementSource(audioElement);
	analyser = audioContext.createAnalyser();
	source.connect(analyser);
	analyser.connect(audioContext.destination);
	analyser.fftSize = 1024;
	dataArray = new Uint8Array(analyser.frequencyBinCount);

}

const setupPlane = () => {

  const planeGeometry = new THREE.PlaneGeometry(150, 150, 64, 64);
  const planeCustomMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader(),
    wireframe: true
  });
  const planeMesh = new THREE.Mesh(planeGeometry, planeCustomMaterial);
  scene.add(planeMesh);

  if(gui != null) {

    const audioWaveGui = gui.addFolder("audio waveform");
    audioWaveGui
      .add(planeCustomMaterial, "wireframe")
      .name("wireframe")
      .listen();
    audioWaveGui
      .add(uniforms.u_amplitude, "value", 1.0, 8.0)
      .name("amplitude")
      .listen();
      
  }

}

setupCanvas();
setupScene();

const play = () => {

  if (audioContext === null) setupAudioContext();

  uniforms = {
    u_time: {
      type: "f",
      value: 1.0,
    },
    u_amplitude: {
      type: "f",
      value: 3.0,
    },
    u_data_arr: {
      type: "float[64]",
      value: dataArray,
    },
  };
  
  setupPlane();

  const clock = new THREE.Clock();

  const tick = () => {

    const time = clock.getElapsedTime() * .01;
    
    if(!debug) camera.position.y += 0.1;

    analyser.getByteFrequencyData(dataArray);

    uniforms.u_time.value = time;
    uniforms.u_data_arr.value = dataArray;

    renderer.render(scene, camera);

    requestAnimationFrame(tick);

  }

  tick();

}

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

  menu_cta.addEventListener('click', () => {
    mainElement.style.display = 'none';
    audioElement.play();
    play();
  });

}
