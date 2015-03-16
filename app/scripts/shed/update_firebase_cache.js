self.updateFirebaseCache = function(dataset) {
  self.IOWA.Firebase.getRefUrlPromise(dataset).then(function(url) {
    if (url) {
      var jsonUrl = url + '.json';
      fetch(url).then(function(response) {
        return response.json();
      }).then(function(json) {
        return self.IOWA.Firebase.updateIDBCache(url, json);
      });
    }
  }).catch(function(error) {
    console.error('Could not update Firebase cache for', dataset, error);
  });
};
