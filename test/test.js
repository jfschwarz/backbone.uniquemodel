/*jshint unused:true, undef:true, strict:true*/
/*global module, test, equal, ok, start, notEqual, asyncTest, expect, Backbone, _ */
(function () {
  "use strict";

  module('instantiation');

  test('constructor maintains uniques', function () {
    var User = Backbone.Model.extend({});
    var UniqueUser = Backbone.UniqueModel(User);

    var first = new UniqueUser({
      id: 1,
      name: 'Scott'
    });

    equal(1, first.id);
    equal('Scott', first.get('name'));

    var second = new UniqueUser({
      id: 1,
      name: 'Scott Summers'
    });

    equal(1, second.id);
    equal('Scott Summers', second.get('name'));
    equal(first, second);

    // Smoke test
    var third = new UniqueUser({
      id: 2,
      name: 'Jean Grey'
    });

    notEqual(first, third);
  });

  test('collection maintains uniques', function () {
    var User = Backbone.Model.extend({});
    var UniqueUser = Backbone.UniqueModel(User);

    var UserCollection = Backbone.Collection.extend({
      model: UniqueUser
    });

    // Test that models instantiated through a collection are unique.
    var users = new UserCollection([
      { id: 1, name: 'Henry' },
      { id: 2, name: 'Bobby' }
    ]);

    var user = new UniqueUser({
      id: 2,
      name: 'Bobby Drake'
    });

    equal(2, users.length);
    equal('Bobby Drake', user.get('name'));
    ok(_.any(users.models, function (obj) {
      return obj === user;
    }));
  });

  module('localStorage');

  test("storage handler doesn't choke unknown keys", function () {
    Backbone.UniqueModel.storageHandler({ key: '' });
    Backbone.UniqueModel.storageHandler({ key: 'sup' });
    Backbone.UniqueModel.storageHandler({ key: 'hey_User_12345' });

    ok(true, "didn't throw an exception");
  });

  function loadIframe(onload) {
    var frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.src = 'iframe.html';
    frame.onload = _.bind(onload, {}, frame);
    document.body.appendChild(frame);
  }

  asyncTest('local instance creation updates remote', function () {
    expect(1);

    Backbone.UniqueModel.enableLocalStorage();

    var User = Backbone.Model.extend({});
    var UniqueUser = Backbone.UniqueModel(User, 'User');

    loadIframe(function (frame) {
      // Creating a local instance *after* a remote instance already exists,
      // should update remote
      var localInstance = new UniqueUser({
        id: 1,
        name: ['Charles Francis Xavier', (new Date()).getTime()].join(' ')
      });

      _.defer(function () {
        start();
        var remoteInstance = frame.contentWindow.uniqueModelInstance;
        equal(localInstance.get('name'), remoteInstance.get('name'));
      });
    });
  });

  asyncTest('sync updates remote', function () {
    expect(1);

    Backbone.UniqueModel.enableLocalStorage();

    var User = Backbone.Model.extend({});
    var UniqueUser = Backbone.UniqueModel(User, 'User');

    var localInstance = new UniqueUser({
      id: 1,
      name: 'Charles Francis Xavier'
    });

    loadIframe(function (frame) {
      // Syncing a local instance should update remote
      localInstance.set('name', ['Charles Francis Xavier', (new Date()).getTime()].join(' '));

      localInstance.trigger('sync', localInstance);

      // Give browser a chance to flush it's async onstorage handlers
      _.defer(function() {
        start();

        var remoteInstance = frame.contentWindow.uniqueModelInstance;
        equal(localInstance.get('name'), remoteInstance.get('name'));
      });
    });
  });
})();