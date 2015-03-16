/**
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Use self instead of window, since this will be used from the SW as well.
self.IOWA = self.IOWA || {};

self.IOWA.Firebase = (function() {
  "use strict";

  var IDB_INSTANCE = 'firebase_info';
  var FIREBASE_PREFIX_KEY = 'prefix';
  var FIREBASE_INSTANCE = 'https://dazzling-torch-1192.firebaseio.com/';

  // We can
  var _firebasePrefixPromise = function() {
    return simpleDB.open(IDB_INSTANCE).then(function(db) {
      return db.get(FIREBASE_PREFIX_KEY).then(function(prefix) {
        if (prefix) {
          return prefix;
        } else if (self.ENV) {
          prefix = FIREBASE_INSTANCE + self.ENV + '/';
          return db.set(FIREBASE_PREFIX_KEY, prefix).then(function() {
            return prefix;
          });
        }
      });
    });
  };

  var getRefUrlPromise = function(path) {
    return _firebasePrefixPromise().then(function(prefix) {
      if (prefix) {
        return prefix + path;
      }
    });
  };

  // This is called from both a controlled page and a SW, so it's important not to do
  // anything that isn't possible via a SW, such as accessing the DOM, etc.
  var updateIDBCache = function(firebaseUrl, val) {
    return simpleDB.open(IDB_INSTANCE).then(function(db) {
      db.set(firebaseUrl, val || []);
    });
  };

  var firebaseOn = function(firebaseUrl, callback) {
    // First invoke the callback with the value from the IndexedDB cache.
    // This ensure that we pass back a value, even if we're offline.
    simpleDB.open(IDB_INSTANCE).then(function(db) {
      return db.get(firebaseUrl).then(function(val) {
        callback(val || []);
      });
    }).then(function() {
      // Then set up a Firebase listener that will invoke the callback with the current value.
      // Any further updates to the value will trigger the callback again, with the updated value.
      var firebaseRef = new Firebase(firebaseUrl);
      firebaseRef.on('value', function(snapshot) {
        var val = snapshot.val();
        callback(val || []);
        updateIDBCache(firebaseUrl, val);
      });
    });
  };

  var firebaseOff = function(firebaseUrl) {
    // Clean up the Firebase listener for this specific Firebase reference.
    var firebaseRef = new Firebase(firebaseUrl);
    firebaseRef.off('value');
  };

  return {
    datasets: {
      SESSIONS: 'sessions',
      SOCIAL: 'social'
    },
    getRefUrlPromise: getRefUrlPromise,
    firebaseOn: firebaseOn,
    firebaseOff: firebaseOff,
    updateIDBCache: updateIDBCache
  };
})();
