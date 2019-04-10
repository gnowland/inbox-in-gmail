/**
 * ExtractPageVariable class extracts a global variable from the DOM window into our isolated extension execution environment.
 * For XSS security it only accepts incoming messages that are recognized given a predetermined handshake.
 * 
 * @param {string} variableName - The variable you wish to extract
 * @returns {object} ExtractPageVariable.data - The extracted variable's value
 * 
 * Example usage:
 *   const windowData = new ExtractPageVariable('somePageVariable').data;
 *   windowData.then(data => { // Do something here... });
 * 
 * @link https://developer.chrome.com/extensions/content_scripts Documentation
 * @link https://stackoverflow.com/a/55431653/2764290 Credit
 *
 * @since 0.4.2
 * 
 */
class ExtractPageVariable {
  constructor(variableName) {
    this._variableName = variableName;
    this._handShake = this._generateHandshake();
    this._inject();
    this._data = this._listen();
  }

  get data() {
    return this._data;
  }

  // Private

  _generateHandshake() {
    const array = new Uint32Array(5);
    return window.crypto.getRandomValues(array).toString();
  }

  _inject() {
    function propagateVariable(handShake, variableName) {
      const message = { handShake };
      message[variableName] = window[variableName];
      window.postMessage(message, "*");
    }

    const script = `( ${propagateVariable.toString()} )('${this._handShake}', '${this._variableName}');`
    const scriptTag = document.createElement('script');
    const scriptBody = document.createTextNode(script);

    scriptTag.id = 'chromeExtensionDataPropagator';
    scriptTag.appendChild(scriptBody);
    document.body.append(scriptTag);
  }

  _listen() {
    return new Promise(resolve => {
      window.addEventListener("message", ({ data }) => {
        // We only accept messages from ourselves
        if (data.handShake != this._handShake) return;
        resolve(data);
      }, false);
    })
  }
}
