import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

import './reset.css';
import './style.scss';

import { vertexShader, vertexShader2, fragmentShader, fragmentShader2 } from "./shaders/shaders";

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

const cubeTextureLoader = new THREE.CubeTextureLoader();

// Check the url to enter debug mode
let debug = window.location.hash && window.location.hash === '#debug';

if(!debug) {
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
  camera.position.z = 50;

  scene.add(camera);

  renderer = new THREE.WebGLRenderer({
    canvas: cvs,
    antialias: true
  });

  renderer.setSize(SIZE.width, SIZE.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const setupParticles = () => {

  for(let i=0; i<100; i++) {
    const particleGeometry = new THREE.BoxGeometry(1, 1);
    const particleMaterial = new THREE.ShaderMaterial({
      wireframe: true
    });
    const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
    particleMesh.position.x = randomIntFromInterval(-50, 50);
    particleMesh.position.y = randomIntFromInterval(-50, 50);
    particleMesh.position.z = randomIntFromInterval(-30, 30);
    scene.add(particleMesh);
  }

}

let planeMesh1 = null;
let planeMesh2 = null;
let planeMesh3 = null;
let planeMesh4 = null;
let planeMesh5 = null;

const setupPlanes = () => {

  const planeGeometry1 = new THREE.PlaneGeometry(50, 50, 150, 150);
  const planeCustomMaterial1 = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader(),
    //wireframe: true
  });
  planeMesh1 = new THREE.Mesh(planeGeometry1, planeCustomMaterial1);
  scene.add(planeMesh1);

  const planeGeometry2 = new THREE.PlaneGeometry(50, 50, 150, 150);
  const planeCustomMaterial2 = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertexShader2(),
    fragmentShader: fragmentShader2(),
  });
  planeMesh2 = new THREE.Mesh(planeGeometry2, planeCustomMaterial2);
  scene.add(planeMesh2);
  planeMesh2.position.x = -50;
  planeMesh2.position.z = -50;

  const planeGeometry3 = new THREE.PlaneGeometry(50, 50, 150, 150);
  const planeCustomMaterial3 = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertexShader2(),
    fragmentShader: fragmentShader2(),
  });
  planeMesh3 = new THREE.Mesh(planeGeometry3, planeCustomMaterial3);
  scene.add(planeMesh3);
  planeMesh3.position.x = 50;
  planeMesh3.position.z = -50;

  const planeGeometry4 = new THREE.PlaneGeometry(50, 50, 150, 150);
  const planeCustomMaterial4 = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertexShader2(),
    fragmentShader: fragmentShader2(),
  });
  planeMesh4 = new THREE.Mesh(planeGeometry4, planeCustomMaterial4);
  scene.add(planeMesh4);
  planeMesh4.position.y = 50;
  planeMesh4.position.z = -50;

  const planeGeometry5 = new THREE.PlaneGeometry(50, 50, 150, 150);
  const planeCustomMaterial5 = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertexShader2(),
    fragmentShader: fragmentShader2(),
  });
  planeMesh5 = new THREE.Mesh(planeGeometry5, planeCustomMaterial5);
  scene.add(planeMesh5);
  planeMesh5.position.y = -50;
  planeMesh5.position.z = -50;

  if(gui != null) {

    const audioWaveGui = gui.addFolder("audio waveform");
    audioWaveGui
      .add(planeCustomMaterial1, "wireframe")
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
      value: 3.1,
    },
    u_data_arr: {
      type: "float[64]",
      value: dataArray,
    },
  };
  
  setupPlanes();
  setupParticles();

  const clock = new THREE.Clock();

  const tick = () => {

    const time = clock.getElapsedTime() * .01;
    
    if(!debug) {
      camera.rotation.z -= 0.001;
      camera.position.z -= 0.1;
      //planeMesh1.position.z -= 0.1;
      //planeMesh2.position.z += 0.1;
      //planeMesh3.position.z += 0.1;
      //planeMesh4.position.z += 0.1;
      //planeMesh5.position.z += 0.1;
    }

    analyser.getByteFrequencyData(dataArray);

    uniforms.u_time.value = time;
    uniforms.u_data_arr.value = dataArray;

    renderer.render(scene, camera);

    requestAnimationFrame(tick);

  }

  tick();

}

const reset = (collection, className) => {
    for(let elt of document.querySelectorAll(collection)) {
      elt.classList.remove(className);
    }
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

  for(let track of document.querySelectorAll('.track')) {
    track.addEventListener('click', () => {
      reset('.track', 'active');
      audioElement = track.querySelector('audio');
      track.classList.add('active');
    });
  }

  menu_cta.addEventListener('click', () => {
    mainElement.style.display = 'none';
    audioElement.play();
    play();
  });

}
