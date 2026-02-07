// You only need this if you are on an old browser.
//import "abortcontroller-polyfill/dist/abortcontroller-polyfill-only";
//if (typeof AbortController === 'undefined' || typeof AbortSignal === 'undefined') {
//  require('abortcontroller-polyfill/dist/abortsignal-polyfill-only');
//}

const baseUrl = "/";
let controller;

const abortFetch = () => {
  controller && controller.abort();
};

// fetcher takes an array of urls and onSuccess takes an array of json objects (in
// the same order of the urls).
export async function fetcher({ urls, onSuccess, onError }) {
  controller = new AbortController();

  const requests = urls.map(u => 
    fetch(`${baseUrl}${u}.json?v=${process.env.REACT_APP_VERSION}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
    }));

    try {
      const responses = await Promise.all(requests);
      const json = await Promise.all(responses.map(res => res.json()));
      if (onSuccess) {
        onSuccess(json);
      }
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
};

export { abortFetch };
