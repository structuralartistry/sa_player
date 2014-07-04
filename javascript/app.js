var player = {
  initialize: function () {
    $('#jquery_jplayer_1').jPlayer({
      swfPath: '/img',
      supplied: 'mp3, m4a, m4v',
      size: {
        width: '640px',
        height: '360px',
        cssClass: 'jp-video-360p'
      },
      smoothPlayBar: true,
      keyEnabled: true,
      consoleAlerts: true,
      errorAlerts: true,
    });
    // set empty title
    $('.jp-title').find('li').text('');

    this.j_player_element().data('jPlayer').status.media = {};
  },

  j_player_element: function () {
    return $('#jquery_jplayer_1');
  },

  play: function () {
    player.j_player_element().jPlayer().trigger($.jPlayer.event.play)
  },

  pause: function () {
    player.j_player_element().jPlayer().trigger($.jPlayer.event.pause)
  },

  current_clip: function () {
    return this.j_player_element().data('jPlayer').status.media
  },

  load_clip: function (clip) {
    $('#jquery_jplayer_1').jPlayer('setMedia', clip);

    $('.jp-title').find('li').text(clip.title);

    $('#jquery_jplayer_1').bind($.jPlayer.event.ended, function (){

    // execute the end of clip callback method against the object
      //      eval(player.current_clip().end_of_clip_callbacks);
      window[clip.end_of_clip_callbacks]();
      //player[player.current_clip().end_of_clip_callbacks]();
    });
  }
};

var clip_sequence = {
  initialize: function () {
    this.data = null;
    this.current_clip = null;
  },

  load_data: function (data) {
    this.data = data;
    this.current_clip = data[0];
  },

  next_clip: function () {
    var target_clip_sequence_order_id = (this.current_clip.sequence_order_id + 1);
    this.set_current_clip_by_clip_sequence_order_id(target_clip_sequence_order_id);
  },

  previous_clip: function () {
    var target_clip_sequence_order_id = (this.current_clip.sequence_order_id - 1);
    this.set_current_clip_by_clip_sequence_order_id(target_clip_sequence_order_id);
  },

  set_current_clip_by_clip_sequence_order_id: function (target_clip_sequence_order_id) {
    var result = $.grep(this.data, function(e){ return e.sequence_order_id === target_clip_sequence_order_id; });

    // this will cause no change if the clip is not found (i.e. out of range) and fail silently
    if(result[0]) {
      this.current_clip = result[0];
      return true;
    } else {
      return false;
    }
  },

  rewind: function () {
    var target_clip_sequence_order_id = 1;
    this.set_current_clip_by_clip_sequence_order_id(target_clip_sequence_order_id);
  }
}

var transport = {
  initialize: function () {
    transport = jQuery.extend(true, {}, transport, this.create_state_machine());
  },

  create_state_machine: function () {
    return StateMachine.create({
      initial: 'NOT_LOADED',
      events: [
        { name: 'load',      from: 'NOT_LOADED',                        to: 'LOADING'     },

        { name: 'play',      from: 'LOADING',                           to: 'PLAYING'     },

        { name: 'play',      from: 'PAUSED',                            to: 'PLAYING'     },

        { name: 'callback',  from: 'PLAYING',                           to: 'IN_CALLBACK' },

        { name: 'pause',     from: 'LOADING',                           to: 'PAUSED'      },
        { name: 'pause',     from: 'PLAYING',                           to: 'PAUSED'      },
        // we make the meaning of IN_CALLBACK be to load the next clip, and this is a LOADING task
        { name: 'pause',     from: 'IN_CALLBACK',                       to: 'LOADING'     },

        { name: 'next_clip', from: ['PLAYING','IN_CALLBACK','PAUSED'],  to: 'LOADING'     },

        { name: 'rewind',    from: ['PLAYING','IN_CALLBACK','PAUSED'],  to: 'LOADING'     }
      ],
      callbacks: {
        onleaveNOT_LOADED: function (event, from, to) {
          if(clip_sequence.current_clip === null) return false;
        },
        onenterLOADING: function (event, from, to) {
          // operate on the clip sequence based on the reason for LOADING state (the event calling this)
          switch(event) {
            case 'load':
              // does not require as assumed that clip_sequence has a clip to exit NOT_LOADED
              break;
            case 'pause':  // this will only be hit if the from is IN_CALLBACK and in this case we want to go to the next clip
            case 'next_clip':
              clip_sequence.next_clip();
              break;
            case 'rewind':
              clip_sequence.rewind();
              break;
          }

          player.load_clip(clip_sequence.current_clip);

          // maintain the playing state
          switch(from) {
            case 'PLAYING':
              this.play();
              break;
            case 'IN_CALLBACK':
              if(event != 'pause') this.play();
              break;
            case 'NOT_LOADED':
            case 'PAUSED':
              this.pause();
              break;
          }
          // should be no more code here since the above are calling actions on the transport which invoke new states
        },

        onenterPLAYING: function (event, from, to) {
          player.play();
        },
        onenterPAUSED: function (event, from, to) {
          player.pause();
        },
        onenterIN_CALLBACK: function (event, from, to, args) {
          // args will be a csv string of callback methods to be called
          if(args) {
            var _this = this;
            $.each(args.split(/,/), function (index, value) {
              var fn = value.trim();
              _this[fn]();
            });
          }
        },
        onenterstate: function (event, from, to) {
          $('#transport_state').html(to);
        }
      },
      error: function(eventName, from, to, args, errorCode, errorMessage) {
        var message = 'Event: ' + eventName + ', from: ' + from + ', to: ' + to + ', args: ' + args + ', errorCode: ' + errorCode + ', errorMessage: ' + errorMessage;
        console.log(message);
        $('#transport_state').html(message);
      }
    });
  }
}

var ui = {
  show_progression_screen: function (screen_id) {
    var screens = ['progression_start', 'progression_loading', 'progression_player', 'progression_end'];
    var screens_to_hide = _.without(screens, screen_id);
    _.each(screens_to_hide, function (screen_to_hide) { $('#' + screen_to_hide).hide() });

    $('#' + screen_id).show();
  },

  submit_progression_start: function () {
    this.show_progression_screen('progression_loading');

    server_io.progressions__start();
  },

  failed_ajax: function () {
    console.log('ajax failed error');
  },

  load_progression: function () {
    this.show_progression_screen('progression_player');
  }
}

var server_io = {
  progressions__start: function () {
    $.ajax({
      type: "POST",
      url: 'api/progressions/start',
      data: '',
      success: ui.load_progression(),
      error: console.log('ajax error'),
      dataType: 'json'
    });
  }

}

var initialize_app =  function () {
  $('#progression_start').show();
  $('#progression_loading').hide();
  $('#progression_player').hide();
  $('#progression_end').hide();

  player.initialize();
  clip_sequence.initialize();
  transport.initialize();
}

var simulateServerLoad = function (type) {
  var clip_sequence_data_short = [
    {
      title: 'Audio 1',
      mp3: 'audio_1.mp3',
      poster: 'poster_2.jpg',
      end_of_clip_callbacks: 'transport.next_clip',
      sequence_order_id: 2
    },
    {
      title: 'Audio 2',
      mp3: 'audio_2.mp3',
      poster: 'poster_2.jpg',
      end_of_clip_callbacks: 'transport.next_clip',
      sequence_order_id: 3
    },
    {
      title: 'Audio 2',
      mp3: 'audio_2.mp3',
      poster: 'poster_2.jpg',
      end_of_clip_callbacks: '',
      sequence_order_id: 4
    }
  ];

  var clip_sequence_data = [
    {
      title: 'Cat Stretch',
      m4a: 'http://localhost:3000/media/development/audio_instruction_sequences/1_Cat_Stretch.m4a',
      poster: 'poster_1.jpg',
      end_of_clip_callbacks: 'next_clip',
      sequence_order_id: 1
    },
    {
      title: 'MOA',
      m4a: 'http://localhost:3000/media/development/audio_instruction_sequences/5_MOA_5.m4a',
      poster: 'poster_1.jpg',
      end_of_clip_callbacks: 'next_clip',
      sequence_order_id: 1
    }
  ];
  initialize_app();

  if(type) {
    clip_sequence.load_data(clip_sequence_data_short);
  } else {
    clip_sequence.load_data(clip_sequence_data);
  }

  transport.load();
}

$(document).ready(function () {
  initialize_app();
});
