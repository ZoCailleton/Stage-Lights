const getRandomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const getRandomFloatFromInterval = (min, max, decimals) => {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
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

const reset = (collection, className) => {
  for(let elt of document.querySelectorAll(collection)) {
    elt.classList.remove(className);
  }
}

export {
    getRandomIntFromInterval,
    getRandomFloatFromInterval,
    createHTMLElement,
    reset
}
