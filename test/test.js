describe('ui', function () {

  beforeEach( function () {
    initialize_app();
    jasmine.Ajax.install();
  });

  describe('show progression screen', function () {

    it('shows the selected screen', function () {
      ui.show_progression_screen('progression_end');

      expect($('#progression_start').is(':visible')).toEqual(false);
      expect($('#progression_loading').is(':visible')).toEqual(false);
      expect($('#progression_player').is(':visible')).toEqual(false);
      expect($('#progression_end').is(':visible')).toEqual(true);
    });

  });

  it('shows the progression start div initially', function () {
    expect($('#progression_start').is(':visible')).toEqual(true);
    expect($('#progression_loading').is(':visible')).toEqual(false);
    expect($('#progression_player').is(':visible')).toEqual(false);
    expect($('#progression_end').is(':visible')).toEqual(false);
  });

  it('shows the progression loading div when the progression start has been submitted', function () {
    // keep the post from going out as we are just testing the interim action before response
    spyOn(server_io, "progressions__start").andCallFake(function(){});

    $('#progression_start_submit').click();
    expect($('#progression_loading').is(':visible')).toEqual(true);
  });

  it('submits the progression request information to server', function () {
    $('#progression_start_submit').click();

    request = jasmine.Ajax.requests.mostRecent();

    expect(request.url).toEqual('api/progressions/start')

    expect(request.method).toBe('POST');
    expect(request.data()).toEqual({});

    expect($('#progression_loading').is(':visible')).toEqual(true);
  });

  it('shows the progression player when the server responds to the progression request', function () {
    json = '';
    ui.load_progression(json);

    expect($('#progression_player').is(':visible')).toEqual(true);
  });

  it('loads the progression into the player via the json data', function () {

  });

});


describe('player', function() {

  beforeEach( function() {
    player.initialize();
  });

  factory_create = function (name, attribute_overrides) {
    var factory_object;
    switch(name) {
      case 'clip':
      case 'clip_audio':
        factory_object = {
          title: 'Test Audio Track 1',
          mp3: 'test/media/audio_short_1.mp3',
          poster: 'test/media/poster_1.jpg',
          end_of_clip_callbacks: 'myEndOfTrackCallback',
          sequence_order_id: 1
        }
        break;
      case 'clip_video':
        factory_object = {
          title: 'Test Video Track 1',
          m4v: 'test/media/video_1.m4v',
          poster: 'test/media/poster_2.jpg',
          end_of_clip_callbacks: 'myEndOfTrackCallback',
          sequence_order_id: 1
        }
        break;
      case 'clip_sequence':
        return [
          factory_create('clip_video', { title: 'Track 1', sequence_order_id: 1 }),
          factory_create('clip_audio', { title: 'Track 2', sequence_order_id: 2 }),
          factory_create('clip_audio', { title: 'Track 3', sequence_order_id: 3 })
        ];
        break;
    }

    var new_object = jQuery.extend(true, {}, factory_object, attribute_overrides);

    return new_object;
  };

  set_transport_to_state = function (state) {
    switch(state) {
      case 'PAUSED':
        clip_sequence_data = factory_create('clip_sequence');
        clip_sequence.load_data(clip_sequence_data);
        transport.load();
        break;
      case 'PLAYING':
        clip_sequence_data = factory_create('clip_sequence');
        clip_sequence.load_data(clip_sequence_data);
        transport.load();
        transport.play();
        break;
      case 'IN_CALLBACK':
        clip_sequence_data = factory_create('clip_sequence');
        clip_sequence.load_data(clip_sequence_data);
        set_transport_to_state('PLAYING');
        transport.callback();
        break;
    }
  }

  describe('factory_create', function () {

    it('creates another instance of object', function () {
      var clip_1 = factory_create('clip');
      expect(clip_1.title).toEqual('Test Audio Track 1');

      var clip_2 = factory_create('clip');
      expect(clip_2.title).toEqual('Test Audio Track 1');

      clip_2.title = 'something else';

      expect(clip_1.title).toEqual('Test Audio Track 1');
      expect(clip_2.title).toEqual('something else');
    });

    it('overrides properties', function () {
      var clip = factory_create('clip', { poster: 'none' });
      expect(clip.poster).toEqual('none');
    });

  });

  it('sets default title as empty', function() {
    expect($('.jp-title').find('li').text()).toBe('');
  });

  it('sets the media title', function() {
    var clip = factory_create('clip');
    player.load_clip(clip);
    expect($('.jp-title').find('li').text()).toBe(clip.title);
  });

  it('sets audio media', function () {
    var clip = factory_create('clip_audio');

    player.load_clip(clip);

    // media is loaded
    expect(player.j_player_element().data('jPlayer').status.media).toEqual(clip);

    // src for clip set
    expect(player.j_player_element().data('jPlayer').status.src).toEqual(clip.mp3);

    // poster is displayed
    var posterSrc = player.j_player_element().find("img[id^='jp_poster_']").attr('src');
    expect(posterSrc).toEqual(clip.poster);
  });

  it('sets video media', function () {
    var clip = factory_create('clip_video');

    player.load_clip(clip);

    // media is loaded
    expect(player.j_player_element().data('jPlayer').status.media).toEqual(clip);

    // src for clip set
    expect(player.j_player_element().data('jPlayer').status.src).toEqual(clip.m4v);

    // poster is displayed
    var posterSrc = $(player.j_player_element()).find("img[id^='jp_poster_']").attr('src');
    expect(posterSrc).toEqual(clip.poster);
  });

  it('changes out media based on changing the media attribute', function () {
    var clip = factory_create('clip_video');

    // video
    player.load_clip(clip);
    expect(player.j_player_element().data('jPlayer').status.media).toEqual(clip);

    // audio
    clip = factory_create('clip_audio');
    player.load_clip(clip);
    expect(player.j_player_element().data('jPlayer').status.media).toEqual(clip);

    // video
    clip = factory_create('clip_video');
    player.load_clip(clip);
    expect(player.j_player_element().data('jPlayer').status.media).toEqual(clip);

    // audio
    clip = factory_create('clip_audio');
    player.load_clip(clip);
    expect(player.j_player_element().data('jPlayer').status.media).toEqual(clip);
  });

  it('sets current_clip', function () {
    var clip = factory_create('clip');

    player.load_clip(clip);

    expect(player.current_clip()).toEqual(clip);
  });

  it('invokes callback on end of clip', function () {
    var clip = factory_create('clip');
    clip.end_of_clip_callbacks = 'player.myEndOfTrackCallback'; // just to be explicit here

    player.myEndOfTrackCallback = function () { console.log('called') };

    spyOn(player, 'myEndOfTrackCallback');

    player.load_clip(clip);
    // reality check that right media is loaded
    expect(player.current_clip()).toEqual(clip);

    // this should work to manually trigger a jPlayer event
    player.j_player_element().jPlayer().trigger($.jPlayer.event.ended)

    expect(player.myEndOfTrackCallback).toHaveBeenCalled();
  });

  it('plays the currently loaded clip', function () {
    var clip = factory_create('clip');

    player.load_clip(clip);

    // bind a function to the jplayer event to verify that play has been invoked
    // trouble directly stubbing the jplayer element directly
    player.test_function = function () { };
    spyOn(player, 'test_function');
    player.j_player_element().bind($.jPlayer.event.play, function(event) {
      player.test_function();
    });

    player.play();

    expect(player.test_function).toHaveBeenCalled();
  });

  it('pauses the currently loaded clip', function () {
    var clip = factory_create('clip');

    player.load_clip(clip);

    // bind a function to the jplayer event to verify that play has been invoked
    // trouble directly stubbing the jplayer element directly
    player.test_function = function () { };
    spyOn(player, 'test_function');
    player.j_player_element().bind($.jPlayer.event.pause, function(event) {
      player.test_function();
    });

    player.pause();

    expect(player.test_function).toHaveBeenCalled();
  });

});

describe('clip_sequence', function () {

  beforeEach( function () {
    clip_sequence.initialize();
  });

  it('loads sequence data', function () {
    expect(clip_sequence.data).toEqual(null);

    var clip_sequence_data = factory_create('clip_sequence');
    clip_sequence.load_data(clip_sequence_data);

    expect(clip_sequence.data.length).toEqual(3);
    expect(clip_sequence.data[1]).toEqual(clip_sequence_data[1]);
  });

  it('toggles through clips in sequence', function () {
    expect(clip_sequence.current_clip).toEqual(null);

    var clip_sequence_data = factory_create('clip_sequence');
    clip_sequence.load_data(clip_sequence_data);

    expect(clip_sequence.current_clip).toEqual(clip_sequence_data[0]);

    clip_sequence.next_clip();

    expect(clip_sequence.current_clip).toEqual(clip_sequence_data[1]);

    clip_sequence.next_clip();

    expect(clip_sequence.current_clip).toEqual(clip_sequence_data[2]);
  });

  it('toggles through clips in reverse sequence', function () {
    var clip_sequence_data = factory_create('clip_sequence');
    clip_sequence.load_data(clip_sequence_data);

    expect(clip_sequence_data.length).toEqual(3); // reality check
    clip_sequence.current_clip = clip_sequence_data[2]; // last clip
    expect(clip_sequence.current_clip).toEqual(clip_sequence_data[2]);

    clip_sequence.previous_clip();

    expect(clip_sequence.current_clip).toEqual(clip_sequence_data[1]);

    clip_sequence.previous_clip();

    expect(clip_sequence.current_clip).toEqual(clip_sequence_data[0]);
  });

  it('goes back to the first clip of the sequence', function () {
    var clip_sequence_data = factory_create('clip_sequence');
    clip_sequence.load_data(clip_sequence_data);

    expect(clip_sequence_data.length).toEqual(3); // reality check
    clip_sequence.current_clip = clip_sequence_data[2]; // last clip
    expect(clip_sequence.current_clip).toEqual(clip_sequence_data[2]);

    clip_sequence.rewind();

    expect(clip_sequence.current_clip).toEqual(clip_sequence_data[0]);
  });

  describe('set_current_clip_by_clip_sequence_order_id', function () {

    it('returns true if successfully locates requested clip', function () {
      var clip_sequence_data = factory_create('clip_sequence');
    clip_sequence.load_data(clip_sequence_data);

      // clip exists
      expect(clip_sequence.set_current_clip_by_clip_sequence_order_id(1)).toBeTruthy();
      // clip id < 1
      expect(clip_sequence.set_current_clip_by_clip_sequence_order_id(0)).toBeFalsy();
      // clip id > max
      expect(clip_sequence.set_current_clip_by_clip_sequence_order_id(5)).toBeFalsy();
    });

    it('returns false if fails to locate requested clip', function () {

    });

  });

});

describe('transport', function () {
  beforeEach( function () {
    transport.initialize();
  });

  it('default state is unloaded', function () {
    expect(transport.current).toEqual('NOT_LOADED');
  });

  describe('onleaveNOT_LOADED', function () {

    describe('loads the first in clip_sequence', function () {

      describe('success', function () {

        it('loads clip to player', function () {
          var current_clip = factory_create('clip');
          spyOn(player, 'load_clip');
          clip_sequence.current_clip = current_clip;

          transport.load();

          expect(player.load_clip).toHaveBeenCalledWith(current_clip);
        });

      });

      describe('failure', function () {

        it('stays in NOT_LOADED state', function () {
          clip_sequence.current_clip = null;

          transport.load();

          expect(transport.current).toEqual('NOT_LOADED');
        });

      });

    });

  });

  describe('onenterPLAYING', function () {

    it('calls play on the player', function () {
      var current_clip = factory_create('clip');
      clip_sequence.current_clip = current_clip;
      transport.load();

      spyOn(player, 'play');

      transport.play();

      expect(player.play).toHaveBeenCalled();
    });

  });

  describe('onenterPAUSED', function () {

    describe('via PLAYING', function () {

      it('pauses the player', function () {
        transport.load();
        transport.play();

        spyOn(player, 'pause');

        transport.pause();

        expect(player.pause).toHaveBeenCalled();
      });
    });

    describe('via IN_CALLBACK', function () {

      it('calls the next clip in the clip sequence', function () {
        clip_sequence.current_clip = factory_create('clip');
        transport.load();

        spyOn(player, 'play');

        // get it into the callback state via play
        transport.play();
        transport.callback();

        spyOn(clip_sequence, 'next_clip');

        transport.pause();

        expect(clip_sequence.next_clip).toHaveBeenCalled();
      });

      it('loads the next clip to the player in preparation for when play event is called', function () {
        set_transport_to_state('IN_CALLBACK');

        spyOn(clip_sequence, 'next_clip');
        spyOn(player, 'load_clip');

        transport.pause();

        expect(player.load_clip).toHaveBeenCalled();
      })

    });

  });

  describe('onenterREWIND', function () {

    beforeEach( function () {
      clip_sequence.current_clip = factory_create('clip');
      transport.load();
      transport.play();
      spyOn(player, 'play');
      spyOn(clip_sequence, 'rewind');
    });

    describe('via playing state', function () {

      it('calls play on the track rewound to', function () {
        transport.rewind();

        expect(player.play).toHaveBeenCalled();
      });

    });

    describe('via paused state', function () {

      it('does not call play on the track rewound to', function () {
        transport.pause(); // get into paused state

        transport.rewind();

        expect(player.play).not.toHaveBeenCalled();
      });

    });

    it('calls rewind on the clip sequence', function () {
      transport.rewind();

      expect(clip_sequence.rewind).toHaveBeenCalled();
    });

  });

  describe('onenterLOADING', function () {

    describe('calling event is next clip or pause', function () {

      it('calls next clip in the clip sequence', function () {
        set_transport_to_state('PLAYING');
        spyOn(clip_sequence, 'next_clip');

        transport.next_clip();

        expect(clip_sequence.next_clip).toHaveBeenCalled();
      });

    });

    describe('calling event is rewind', function () {

      it('calls rewind on the clip sequence', function () {
        set_transport_to_state('PLAYING');

        spyOn(clip_sequence, 'rewind');

        transport.rewind();

        expect(clip_sequence.rewind).toHaveBeenCalled();
      });
    });

    it('loads the current clip', function () {
      transport.initialize();
      clip_sequence.current_clip = factory_create('clip');
      spyOn(player, 'load_clip');
      transport.load();

      expect(player.load_clip).toHaveBeenCalled();
    });

    describe('via PLAYING', function () {

      beforeEach( function () {
        set_transport_to_state('PLAYING');
        expect(transport.current).toEqual('PLAYING');
      });

      it('calls play on the player to maintain the playing state', function () {
        spyOn(player, 'play');

        transport.next_clip();

        expect(player.play).toHaveBeenCalled();
      });

      it('moves the state to PLAYING', function () {
        transport.next_clip();

        expect(transport.current).toEqual('PLAYING');
      });

    });
    describe('via IN_CALLBACK', function () {

      beforeEach( function () {
        set_transport_to_state('IN_CALLBACK');
      });

      it('calls play on the player to maintain the playing state', function () {
        spyOn(player, 'play');

        transport.next_clip();

        expect(player.play).toHaveBeenCalled();
      });

      it('moves the state to PLAYING', function () {
        transport.next_clip();

        expect(transport.current).toEqual('PLAYING');
      });

      it('does not call play on player if the triggering event is pause', function () {
        spyOn(player, 'play');

        transport.pause();

        expect(player.play).not.toHaveBeenCalled();
      });

    });
    describe('via PAUSED or NOT_LOADED', function () {

      beforeEach( function () {
        set_transport_to_state('PAUSED');
      });

      it('moves the state to PAUSED once complete', function () {
        transport.next_clip();

        expect(transport.current).toEqual('PAUSED');
      });

      it('calls pause on the transport', function () {
        spyOn(transport, 'pause');

        transport.next_clip();

        expect(transport.pause).toHaveBeenCalled();
      });

    });

  });

  describe('onenterIN_CALLBACK', function () {

    describe('end of clip callbacks', function () {

      it('executes passed args as functions on the transport', function () {
        transport.load();
        transport.play();

        transport.a_callback_function = function () {};
        spyOn(transport, 'a_callback_function');

        transport.callback('a_callback_function');

        expect(transport.a_callback_function).toHaveBeenCalled();
      });

      it('handles processing multiple function calls', function () {
        transport.load();
        transport.play();

        transport.callback_function_one = function () {};
        transport.callback_function_two = function () {};
        transport.callback_function_three = function () {};

        spyOn(transport, 'callback_function_one');
        spyOn(transport, 'callback_function_two');
        spyOn(transport, 'callback_function_three');

        transport.callback('callback_function_one, callback_function_two, callback_function_three');

        expect(transport.callback_function_one).toHaveBeenCalled();
        expect(transport.callback_function_two).toHaveBeenCalled();
        expect(transport.callback_function_three).toHaveBeenCalled();
      });

    });

  });

});

describe('plays a sequence of clips', function () {

});

// create transport buttons on page
// wire up buttons and take for spin
// consider adding angular back in as controller to wire up the transport buttons to page
// decide if to do integration coverage


// for this one: do we want to create a separate transport object which talks to both the player and the sequence?
// or include it in sequence? (maybe does not matter)... anyhow the next is to update the player with the state
// of the sequence which now has controls
//it('sends the sequence to the player one by one and plays each and responds to the callback');
//
//describe('between clip logic', function () {
//  it('pauses dynamically between clips which are marked to');
//  it('pauses a fixed amount between clips which are marked to');
//});
