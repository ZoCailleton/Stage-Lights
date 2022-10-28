const introVert = () => {
  return /* glsl */`

      varying float x;
      varying float y;
      varying float z;

      varying vec3 vUv;

      uniform float u_time;
      uniform float u_amplitude;

      uniform float[64] u_data_arr;

      void main() {

          vUv = position;

          x = abs(position.x);
          y = abs(position.y);

          float floor_x = round(x);
          float floor_y = round(y);
          
          z = sin(u_data_arr[int(floor_x)] / 50.0 + u_data_arr[int(floor_y)] / 50.0) * u_amplitude;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, z, 1.0);
      }
    `;
};

const baseVert = () => {
  return /* glsl */`

      varying float x;
      varying float y;
      varying float z;

      varying vec3 vUv;

      uniform float u_time;
      uniform float u_amplitude;

      uniform float[64] u_data_arr;

      void main() {

          vUv = position;

          x = abs(position.x);
          y = abs(position.y);

          float floor_x = round(x);
          float floor_y = round(y);

          z = sin(u_data_arr[int(floor_x)] / 30.0 + u_data_arr[int(floor_y)] / 30.0);
          z = z * u_amplitude;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, z, 1.0);
      }
    `;
};

const introFrag = () => {
  return /* glsl */`

    varying float x;
    varying float y;
    varying float z;
    varying vec3 vUv;
    
    uniform float u_time;

    void main() {
      if(z > 3.) {
        gl_FragColor = vec4((32.0 - abs(x)) / 32.0, (32.0 - abs(y)) / 32.0, (abs(x + y) / 2.0) / 32.0, 1.0);
      } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    }
  `;
};

const baseFrag = () => {
  return /* glsl */`

    varying float x;
    varying float y;
    varying float z;
    varying vec3 vUv;
    
    uniform float u_time;

    void main() {
      if(z > 3.) {
        gl_FragColor = vec4(abs(z), (32.0 - abs(y)) / 32.0, (abs(x + y) / 2.0) / 32.0, 1.0);
      } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    }
  `;
};

const violetFrag = () => {
  return /* glsl */`

    varying float x;
    varying float y;
    varying float z;
    varying vec3 vUv;
    
    uniform float u_time;

    void main() {
      if(z > 3.) {
        gl_FragColor = vec4((abs(x + y) / 2.0) / 32.0, (32.0 - abs(y)) / 32.0, abs(z), 1.0);
      } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    }
  `;
};

const greenFrag = () => {
  return /* glsl */`

    varying float x;
    varying float y;
    varying float z;
    varying vec3 vUv;
    
    uniform float u_time;

    void main() {
      if(z > 3.) {
        gl_FragColor = vec4((abs(x + y) / 2.0) / 32.0, abs(z), (32.0 - abs(y)) / 32.0, 1.0);
      } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    }
  `;
};

const raveFrag = () => {
  return /* glsl */`

    varying float x;
    varying float y;
    varying float z;
    varying vec3 vUv;
    
    uniform float u_time;

    void main() {
      if(z > 2.9) {
        gl_FragColor = vec4(abs(y + z), (32.0 - abs(y)) / 64.0, 0., 1.0);
      } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    }
  `;
};

const blueFrag = () => {
  return /* glsl */`

    varying float x;
    varying float y;
    varying float z;
    varying vec3 vUv;
    
    uniform float u_time;

    void main() {
      if(z > 2.9) {
        gl_FragColor = vec4(abs(z / y) / 32., (32.0 - abs(y)) / 64.0, abs(y + z), 1.0);
      } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    }
  `;
};

export {
  introVert,
  baseVert,
  introFrag,
  baseFrag,
  violetFrag,
  greenFrag,
  raveFrag,
  blueFrag
};
