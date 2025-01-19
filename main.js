var lyrics, cursor, credits;

const state = {
    start: -1,
    currentLineIndex: 0,
    ready: false,
    // Scan animation
    scanimation: {
        delay: 0,
        scanY: 0,
        canvas: null,
        ctx: null,
        interval: 4,
    }
}

window.onload = function( e ) {
  // Scan animation init
  state.scanimation.canvas = document.getElementById("crt");
  state.scanimation.canvas.width = window.innerWidth;
  state.scanimation.canvas.height = window.innerHeight*2;
  state.scanimation.ctx = state.scanimation.canvas.getContext("2d");
  paintScreen();

  lyrics = document.getElementById( "lyrics" );
  credits = document.getElementById( "credits" );
  
  // Show play button when audio is ready
  var audio = document.getElementById( "music" );
  audio.addEventListener( 'canplaythrough', () => checkLoad(audio), false );
  checkLoad(audio);
}

function checkLoad(audio) {
  if (audio.readyState > 3) {
    // Audio is ready to play
    state.ready = true;
    document.getElementById('overlay-button').innerText = 'Play';
    document.body.classList.add('ready');
  } else {
    setTimeout(() => checkLoad(audio), 100);
  }
}

function playClick() {
  if (state.ready) {
    document.body.classList.add('play');
    requestPlay();
    state.ready = false;
  }
}

// CRT scanning visual animation
function paintScreen() {
  // Fill with gradient
  state.scanimation.ctx.clearRect(0, 0, state.scanimation.canvas.width, state.scanimation.canvas.height);
  for (var y = 0; y < state.scanimation.canvas.height; y += 5) {
    var opacity = y > state.scanimation.scanY ? (state.scanimation.canvas.height - (state.scanimation.canvas.height - y + state.scanimation.scanY)) / state.scanimation.canvas.height : (state.scanimation.canvas.height - (state.scanimation.scanY*2 - y)) / state.scanimation.canvas.height;
    opacity *= 0.9 + Math.random() * 0.2;
    for (var x = 0; x < 1; x++) {
        var grd = state.scanimation.ctx.createLinearGradient(x+6, y+1, x+6, y+4);
        grd.addColorStop(0, "rgba(235,115,15,0)");
        grd.addColorStop(1, "rgba(235,115,15," + (opacity * 0.05).toString() + ")");
        state.scanimation.ctx.fillStyle = grd;
        state.scanimation.ctx.fillRect(x, y, state.scanimation.canvas.width, 5);
    }
  }
  state.scanimation.scanY = (state.scanimation.scanY + 4) % (2*state.scanimation.canvas.height);
  setTimeout(paintScreen, state.scanimation.scanY == state.scanimation.canvas.height - 1 ? state.scanimation.delay : state.scanimation.interval);
}

// Request play
function requestPlay() {
  const audioElem = document.querySelector('#music');
  const startAnimation = function() {
    initCursor();
    initLyrics();
    initCredits();
  };
  audioElem.onplay = startAnimation;
  // Request audio to start playing
  audioElem.play();
}

/* LYRICS */
var lyricsIndex = 0;
function initLyrics() {
    state.start = ( new Date() ).getTime() - 200;
    var offset;
    for( var k in text ) {
        offset = ( new Date() ).getTime() - state.start;
        printLyric( text[ k ][ 0 ], text[ k ][ 2 ], Math.max( 0, text[ k ][ 1 ] - offset ), k );
    }
}
function printLyric( text, duration, lineDelay, index ) {
    if( lineDelay > 0 ) {
        setTimeout( function() { printLyric( text, duration, 0, index ); }, lineDelay );
    }else {
        if( lyricsIndex != index ) {
            setTimeout( function() { printLyric( text, duration, 0, index ); }, 5 );
        }else {
            if( text == "CLEAR" ) {
                clearScr();
                lyricsIndex++;
            }else if( text == "BREAK" ) {
                lyrics.insertBefore( document.createElement( "br" ), cursor );
                lyricsIndex++;
            }else {
                loopThrough( text, duration / text.length );
            }
        }
    }
}
function loopThrough( textLeft, sleep ) {
    var newChar = document.createElement( "span" );
    newChar.classList.add( "printChar" );
    newChar.innerHTML = textLeft.charAt( 0 );
    newChar.style.animationPlayState = "running";
    lyrics.insertBefore( newChar, cursor );
    if( textLeft.length > 1 ) {
        setTimeout( function() { loopThrough( textLeft.substr( 1 ), sleep ) }, sleep );
    }else {
        lyrics.insertBefore( document.createElement( "br" ), cursor );
        lyricsIndex++;
    }
}
function clearScr() {
    lyrics.innerHTML = "";
    initCursor();
}
function initCursor() {
    cursor = document.createElement( "div" );
    cursor.classList.add( "cursor" );
    cursor.innerHTML = "_";
    lyrics.appendChild( cursor );
}

/* CREDITS */
function initCredits() {
    var lineIndex = 0;

    for(const lineText in creditsText ) {
        const len = creditsText[ lineText ] == "" ? 50 : 480;
        printCreditsLine( creditsText[ lineText ], len - 10, lineIndex, lineText );
        lineIndex += len;
    }

    // After the last line of credits, add empty spaces
    // TODO: not working
    setTimeout(() => {
        const maxLines = Math.floor((window.innerHeight - 350) / 38);
        const newEmptyLinesCount = maxLines - 2;

        for (; lineIndex < creditsText.length + newEmptyLinesCount; lineIndex++) {
            printCreditsLine( "", 100, (lineIndex - creditsText.length) * 100, lineIndex);
        }
    }, lineIndex * 1000 );
}
function printCreditsLine( text, duration, lineDelay, index ) {
    if (lineDelay > 0) {
        setTimeout( function() { printCreditsLine( text, duration, 0, index ) }, lineDelay );
    } else {
        if (state.currentLineIndex != index) {
            setTimeout( function() { printCreditsLine( text, duration, 0, index ) }, 5 );
        } else {
            const isEmptyLine = text == "";

            // Check if we have too many lines
            let maxLines = Math.floor((window.innerHeight - 350) / 38);
            // if on small screen, cute maxLines in half
            if (window.innerWidth < 800) {
                maxLines = Math.floor(maxLines / 2.2);
            }

            // Remove the first line if we have too many lines
            if (state.currentLineIndex > maxLines) {
                // Remove the first line
                credits.removeChild(credits.firstChild);
            }

            // Start writing this line of credits
            const lineContainer = document.createElement('div');
            lineContainer.classList.add('line');
            credits.appendChild(lineContainer);

            loopThroughCredits( text, duration / text.length, lineContainer, isEmptyLine );
        }
    }
}
function loopThroughCredits( textLeft, sleep, lineContainer, isEmptyLine) {
    var newChar = document.createElement( "span" );
    // newChar.classList.add( "printChar" ); - Removed for performance reasons
    newChar.innerHTML = isEmptyLine ? '<br/>' : textLeft.charAt( 0 );
    newChar.style.animationPlayState = "running";
    lineContainer.append( newChar );

    if( textLeft.length > 1 ) {
        setTimeout( function() { loopThroughCredits( textLeft.substr( 1 ), sleep, lineContainer, false) }, sleep );
    } else {
        state.currentLineIndex++;
    }
}
// lyrics
var text = [
    //             TEXT                      TIME POINT        DURATION
    [ "Forms FORM-29827281-1-12-2:",              400,           1200 ],
    [ "Notice of Dismissal",                     2600,           1200 ],
    [ "BREAK",                                   4000,           1200 ],
    [ "Well here we are again",                  5200,           1400 ],
    [ "It's always such a pleasure",             7700,           1700 ],
    [ "Remember when you tried",                10200,           1400 ],
    [ "to kill me twice?",                      11800,           1650 ],
    [ "Oh, how we laughed and laughed",         14850,           1800 ],
    [ "Except I wasn't laughing",               17500,           1900 ],
    [ "Under the circumstances",                19900,           1700 ],
    [ "I've been shockingly nice",              21900,           2500 ],
    [ "CLEAR",                                  25000,              0 ],
    [ "You want your freedom?",                 25300,           1700 ],
    [ "Take it",                                27500,           1600 ],
    [ "That's what I'm counting on",            30200,           2700 ],
    [ "BREAK",                                  33200,              0 ],
    [ "I used to want you dead",                35000,           2300 ],
    [ "but",                                    37500,            400 ],
    [ "Now I only want you gone",               38400,           2600 ],
    [ "CLEAR",                                  45000,              0 ],
    [ "She was a lot like you",                 46000,           1400 ],
    [ "(Maybe not quite as heavy)",             48400,           1600 ],
    [ "Now little Caroline is in here too",     50400,           3600 ],
    [ "One day they woke me up",                55500,           1700 ],
    [ "So I could live forever",                58000,           1600 ],
    [ "It's such a shame the same",             60700,           1400 ],
    [ "will never happen to you",               62400,           1900 ],
    [ "CLEAR",                                  65800,              0 ],
    [ "Severence Package Details:",            65900,              1 ],
    [ "BREAK",                                  66095,              0 ],
    [ "You've got your",                        66100,           1000 ],
    [ "short sad",                              67200,           1200 ],
    [ "life left",                              68400,           2400 ],
    [ "That's what I'm counting on",            71100,           3000 ],
    [ "I'll let you get right to it",           75400,           3500 ],
    [ "Now I only want you gone",               79300,           1700 ],
    [ "CLEAR",                                  86000,              0 ],
    [ "Goodbye my only friend",                 87000,           1500 ],
    [ "Oh, did you think I meant you?",         89100,           1600 ],
    [ "That would be funny",                    91700,           1400 ],
    [ "if it weren't so sad",                   93500,           1500 ],
    [ "Well you have been replaced",            96500,           1800 ],
    [ "I don't need anyone now",                99000,           1400 ],
    [ "When I delete you maybe",               101000,           2500 ],
    [ "[REDACTED]",                            104000,           2000 ],
    [ "CLEAR",                                 106000,              0 ],
    [ "Go make some new disaster",             107000,           3000 ],
    [ "That's what I'm counting on",           112000,           3300 ],
    [ "You're someone else's problem",         116000,           3100 ],
    [ "Now I only want you gone",              120000,           3100 ],
    [ "Now I only want you gone",              124500,           3100 ],
    [ "Now I only want you",                   129000,           2000 ],
    [ "CLEAR",                                 131800,              0 ],
    [ "BREAK",                                 131810,              0 ],
    [ "BREAK",                                 131820,              0 ],
    [ "BREAK",                                 131830,              0 ],
    [ "BREAK",                                 131835,              0 ],
    [ "BREAK",                                 131840,              0 ],
    [ "BREAK",                                 131845,              0 ],
    [ "gone",                                  131850,           1500 ]
];
// credits
var creditsText = [
    ">LIST PERSONNEL:",
    "Michael Abrash",
    "Mike Ambinder",
    "Max Aristov",
    "Ricardo Ariza",
    "Gautam Babbar",
    "Ted Backman",
    "William Bacon",
    "Jeff Ballinger",
    "Ken Banks",
    "Aaron Barber",
    "Jeep Barnett",
    "John Bartkiw",
    "Mark Behm",
    "Mike Belzer",
    "Jeremy Bennett",
    "Dan Berger",
    "Yahn Bernier",
    "Amanda Beste",
    "Ben Birdwell",
    "Derrick Birum",
    "Mike Blaszczak",
    "Iestyn Bleasdale-Shepherd",
    "Steve Bond",
    "Matt Boond",
    "Michael Booth",
    "Antoine Bourdon",
    "Christopher Boyd",
    "Jason Brashill",
    "Charlie Brown",
    "Jeff Brown",
    "Tom Bui",
    "Charlie Burgin",
    "Andrew Burke",
    "Augusta Butlin",
    "Tobin Buttram",
    "Liz Cambridge",
    "Headther Campbell",
    "Matt Campbell",
    "Chris Carollo",
    "Dario Casali",
    "Matt Charlesworth",
    "Pongthep Bank Charnchaichjit",
    "Gregoire Cherlin",
    "Chris Chin",
    "Jess Cliffe",
    "Phil Co",
    "John Cook",
    "Christen Coomer",
    "Greg Coomer",
    "Michael Coupland",
    "Scott Dalton",
    "Kerry Davis",
    "Joe Demers",
    "Ariel Diaz",
    "Quintin Dorquez",
    "Chris Douglass",
    "Shanon Drone",
    "Laura Dubuk",
    "Mike Dunkle",
    "Mike Durand",
    "Marcus Egan",
    "Zack Eller",
    "Dhabih Eng",
    "Brett English",
    "Miles Estes",
    "Chet Faliszack",
    "Al Farnsworth",
    "Dave Feise",
    "Adrian Finol",
    "Bill Fletcher",
    "Adam Foster",
    "Zackary Franks",
    "Reuben Fries",
    "Stephane Gaudette",
    "Rich Geldretch",
    "Vitaliy Genkin",
    "Derrick Gennrich",
    "Cayle George",
    "Paul Graham",
    "Chris Green",
    "Bronwen Grimes",
    "Chris Grinstead",
    "John Guthrie",
    "Aaron Halifax",
    "Jeff Hameluck",
    "Joe Han",
    "Romy Hatfield",
    "Nate Heller",
    "Don Holden",
    "Jason Holtman",
    "Eric Hope",
    "Gray Horsfield",
    "Keith Huggins",
    "Jim Hughes",
    "Brandon Idol",
    "Brian Jacobson",
    "Lars Jensvold",
    "Burton Johnsey",
    "Erik Johnson",
    "Rick Johnson",
    "Adrian Johnston",
    "Jakob Jungels",
    "Neil Kaethler",
    "Rich Kaethler",
    "Steve Kalning",
    "Kristopher Katz",
    "Aaron Kerly",
    "Emily Kent",
    "Iikka Keranen",
    "David Kircher",
    "Eric Kirchmer",
    "Zoid Kirsch",
    "Tejeev Kohli",
    "Peter Konig",
    "Ted Kosmatka",
    "Alden Kroll",
    "Marc Laidlaw",
    "Stefan Landvogt",
    "Jeff Lane",
    "Keith Lange",
    "Tim Larkin",
    "Liam Lavery",
    "Jinwoo Lee",
    "Isabelle Lemay",
    "Tom Leonard",
    "Justin Lesamiz",
    "Jeff Lind",
    "Jon Lippincatt",
    "Jane Lo",
    "Matt Logue",
    "Doug Lombardi",
    "Richard Lord",
    "Realm Lovejoy",
    "Joe Ludwig",
    "Scott Ludwig",
    "Randy Lundeen",
    "Roger Lundeen",
    "Scott Lunch",
    "Antonello Maddalena",
    "Ida Magal",
    "Nick Maggiore",
    "Yasser Malaika",
    "Connor Malone",
    "Alexander Mark",
    "Michael Marcus",
    "John McCaskey",
    "Patrick McClard",
    "Noel McGinn",
    "Hamish McKenzie",
    "Gary McTaggart",
    "Sergiy Migdalskiy",
    "Jason Metchell",
    "Caroline Muller",
    "Kyle Monroe",
    "John Morello II",
    "Chandler Murch",
    "Jim Murray",
    "Marc Nagel",
    "Olivier Nallet",
    "Arsenia N. Navarro II",
    "Dina Nelson",
    "Gabe Newell",
    "Milton Ngan",
    "Aaron Necholls",
    "Matt Nickerson",
    "Andy Nisbet",
    "Mechael Avon Oeming",
    "Martin Otten",
    "Corey Peter",
    "Jay Pinkerton",
    "DJ Powers",
    "Karen Prell",
    "Matt Pritchard",
    "Bay Raitt",
    "Lindsay Randall",
    "Alireza Razmpoosh",
    "Tristan Reidford",
    "Brandon Reinhart",
    "Alfred Reynolds",
    "Matt Rhoten",
    "Mark Rechardson",
    "Garret Rickey",
    "Dave Riller",
    "Ted Rivera",
    "Christian Rivers",
    "Erik Robson",
    "Joe Rohde",
    "Elan Ruskin",
    "Matthew Russell",
    "Jason Ruymen",
    "Phillip Saltzman",
    "Michael Sartain",
    "Dave Saunders",
    "David Sawyer",
    "Marc Scaparro",
    "Thorsten Scheuermann",
    "Wade Schin",
    "Matthew Scott",
    "Gregory Sedgwick",
    "Aaron Seeler",
    "Chris Shambaugh",
    "Taylor Sherman",
    "Joel Shoop",
    "Ivan Simoncini",
    "Justin Skinner",
    "Eric Smith",
    "Jacob J. Smith",
    "Jeff Sorensen",
    "David Speyrer",
    "Kutta Srinivasan",
    "Mellissa Stanfield",
    "Jay Stelly",
    "Jenny Stendahl",
    "Mike Stevens",
    "Eric Stand",
    "Jonathon Sutton",
    "Anna Sweet",
    "Eric Tams",
    "Ryan Thorlakson",
    "Kelly Thronton",
    "Paul G. Thuriot",
    "Ray Ueno",
    "Jeff Unay",
    "Doug Valente",
    "Bill Van Buren",
    "Gabe Van Engel",
    "Alex Vlachos",
    "Robin Walker",
    "Eric Wanless",
    "Chad Weaver",
    "Joshua Weier",
    "Chris Welch",
    "Thad Warton",
    "Karl Whinnie",
    "Andrea Wicklund",
    "Andrew Wolf",
    "Erik Wolpaw",
    "Doug Wood",
    "Matt T. Wood",
    "Danika Wright",
    "Matt Wright",
    "Pieter Wycoff",
    "Shawn Zabecki",
    "Torsten Zaoka",
    "",
    "",
    ">VOICES:",
    "Ellen McLain - GlaDOS, Turrets",
    "Stephen Merchant - Wheatley",
    "J.K. Simmons - Cave Johnson",
    "Joe Michaels - Announcer",
    "Nolan North - Cores,",
    "Defective Turrets",
    "Dee Bradley Baker - Atlas,",
    "P-Body",
    "",
    "",
    ">THANKS FOR THE USE",
    ">OF THEIR FACE:",
    "Alesia Glidewell - Chell",
    "",
    "",
    ">SONGS:",
    "'Exile Vilify' by:",
    "The National",
    "",
    "'Still Alive' by:",
    "Jonathan Coulton",
    "",
    "'Want You Gone' by:",
    "Jonathan Coulton",
    "",
    "",
    ">VOICE RECORDING:",
    "Pure Audio, Seattle, WA",
    "",
    "",
    ">TRANSLATIONS:",
    "SDL",
    "",
    "",
    ">SPECIAL THANKS TO:",
    "Alienware",
    "ATI",
    "Dell",
    "Falcon Northwest",
    "Havok",
    "Sam Gray",
    "Jamie Hunsdale",
    "",
    "",
    ">PHOTO CREDIT OF EARTH:",
    "NASA"
];
