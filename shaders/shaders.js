const vertexShader = () => {
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

          //float x_multiplier = (44.0 - x) / 8.0;
          //float y_multiplier = (32.0 - y) / 8.0;

          //z = position.z;
          //z = abs(position.x) + abs(position.y);
          //z = sin(abs(position.x) + abs(position.y));
          //z = sin(abs(position.x) + abs(position.y) + u_time * .005);
          
          z = sin(u_data_arr[int(floor_x)] / 50.0 + u_data_arr[int(floor_y)] / 50.0) * u_amplitude;
          //z = (u_data_arr[int(floor_x)] / 50.0 + u_data_arr[int(floor_y)] / 50.0) * 2.0;
          
          //vec3 zNoise = pnoise(vec3(0., 0., 0.));
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, z, 1.0);
      }
    `;
};

const fragmentShader = () => {
  return /* glsl */`

    varying float x;
    varying float y;
    varying float z;
    varying vec3 vUv;
    
    uniform float u_time;

    void main() {
      // old
      // gl_FragColor = vec4(mix(u_black, u_white, vUv.x), 1.0);
      // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      /* if (vUv.z < .0001) {
          gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
      } else {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }*/
      // gl_FragColor = vec4(abs(sin(u_time * .001)), 0.0, 0.0, 1.0);
      if(z > 3.) {
        gl_FragColor = vec4((32.0 - abs(x)) / 32.0, (32.0 - abs(y)) / 32.0, (abs(x + y) / 2.0) / 32.0, 1.0);
      } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
      //gl_FragColor = vec4((32.0 - abs(z)) / 32.0, (32.0 - abs(z)) / 32.0, (abs(z) / 2.0) / 32.0, 1.0);
    }
  `;
};

const vertexShader2 = () => {
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

          //float x_multiplier = (44.0 - x) / 8.0;
          //float y_multiplier = (32.0 - y) / 8.0;

          //z = position.z;
          //z = abs(position.x) + abs(position.y);
          //z = sin(abs(position.x) + abs(position.y));
          //z = sin(abs(position.x) + abs(position.y) + u_time * .005);

          z = sin(u_data_arr[int(floor_x)] / 30.0 + u_data_arr[int(floor_y)] / 30.0);
          z = z * u_amplitude;
          //z = (u_data_arr[int(floor_x)] / 50.0 + u_data_arr[int(floor_y)] / 50.0) * 2.0;
          
          //vec3 zNoise = pnoise(vec3(0., 0., 0.));
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, z, 1.0);
      }
    `;
};

const fragmentShader2 = () => {
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

const particleVertexShader = () => {
  return /* glsl */`
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 0.);
      }
    `;
};

const particleFragmentShader = () => {
  return /* glsl */`
    void main() {
      gl_FragColor = vec4(1., 1., 1., 1.);
    }
  `;
};

export { vertexShader, vertexShader2, fragmentShader, fragmentShader2, particleVertexShader, particleFragmentShader };
