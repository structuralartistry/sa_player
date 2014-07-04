Notes on the application:

The app loads in browser using index.html

Index.html contains the test runner, so when you load the page, the tests run. Of course eventually we will separate test from production but for now this is easiest and simplest.

Existing functionality:
  There are four divs, each containing a 'view'. So the whole front-end application is self-contained within this page.
    1) progression_start: is a form that user submits parameters for the program they are to receive. Has been minimally implemented.
    2) progression_loading: this is a 'processing' message that will show until the data is received back from the server and the media is loaded in the player and ready to play
    3) progresion_player: this is where the session plays. This is the most complete part of the app. There is currently a failing spec which tests the callback mechanism which should play the next media file when one ends.
    4) progression_end: this will load after the last media file finishes playing, or if the user clicks 'End Session' on the progression_player view

  I have used mock-ajax (jasmine) to stub out server interaction. See the docs at: https://github.com/pivotal/jasmine-ajax.

  app.js:
    All production javascript is currently in app.js.

    This file is grouped into functional objects:
      player: controls the player itself
      clip_sequence: handles the data of the sequence of clips to be played
      transport: handles movement within the clip_sequence and its loading into the player
      ui: handles ui operations
      server_io: abstraction between app and the server, all data interactions should go through this

    I have a state machine in the player to handle the rather unique operations that this application requires that become a little complex.

Coding Standards
  Use underscore case and not camel case, i.e. this_is_a_variable, not thisIsAVariable.
  Do not code production code or change it without adding or considering a test.
  Work completed that is not backed up by reasonable test(s) will not be accepable.
  I am open to adding or removing anything, libraries, code, etc *if it makes sense* and you mention it to me.
  Use descriptive variable names, do not abbreviate. Long names are fine.
  Add comments to code on *anything* that is not readily understandable by looking at it, and especially in special cases.

Backlog/Next Actions
Following are in order the planned needs for the application.

Mockups/ScreenShots
