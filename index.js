var   LONG_BASE = 24, 
      LAT_BASE = 40,  
      MAX_LAT = 180, 
      MAX_LONG = 360
      BASE_24_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXY'
      BASE_40_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcd';

// Needed for cross platform support
function fmod(a,b) { return Number((a - (Math.floor(a / b) * b)).toPrecision(10)); }

function fromBase(base, startChar, char) {
  if ( typeof startChar !== 'string' ) {
    throw new Error('Start char must be a string!');
  }
  if ( typeof char !== 'string' ) {
    throw new Error('Char must be a string!');
  }
  if ( char.charCodeAt(0) > startChar.charCodeAt(0) + base ) {
    throw new Error('Character out of range.');
  }
  return char.charCodeAt(0) - startChar.charCodeAt(0);
}

function toBase(base, startChar, value ) {
  if ( typeof startChar !== 'string' ) {
      throw new Error('Start char must be a string');
    }
    if ( typeof value !== 'number' ) {
      throw new Error('Value must be a string');
    }
    if ( value >= base ) {
      throw new Error('Value must be smaller than base');
    }

    var ret = String.fromCharCode(startChar.charCodeAt(0) + value);
    if ( typeof ret !== 'string' ) {
      throw new Error('Failed to convert');
    }
    return ret;
}

function toBase24(value) {
  return toBase(24, 'A', value);
}

function fromBase24(char) {
  return fromBase(24, 'A', char);
}

function base40Chars() {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcd';
}

function toBase40(value) {
  if ( typeof value !== 'number' ) {
    throw new Error('Value must be a number!');
  }
  if ( value < 0 || value > BASE_40_CHARS.length  ) {
    throw new Error('Value out of range.');
  }
  return BASE_40_CHARS.charAt(value);
}

function fromBase40(char) {
  var index;
  if ( typeof char !== 'string' ) {
    throw new Error('Char must be a string!');
  }
  index = BASE_40_CHARS.indexOf(char);
  if ( index === -1 ) {
    throw new Error('Char out of range.');
  }
  return index;
}

function volumeForDepth(depth) {
  return {
    x: (MAX_LONG / Math.pow(LONG_BASE, depth)),
    y: (MAX_LAT / Math.pow(LAT_BASE / (MAX_LONG / MAX_LAT), depth))
  }
}

function toSimplifiedLocator(lat,long,accuracy) {
  var locator = '', _lat = 0, _long = 0, volume;

  // Normalize Inputs
  _long = Math.min(long + (MAX_LONG / 2), MAX_LONG);
  _lat = Math.min(lat + (MAX_LAT / 2), MAX_LAT);

  // Construct Locator
  for ( var depth = 0; depth < accuracy; ++depth ) {
    // Calculate Volume sizes for current depth
    volume = volumeForDepth(depth + 1);

    // Get Grid Location For Depth and encode it to the locator
    locator += toBase24(_long / volume.x);
    locator += toBase40(_lat / volume.y);

    // Remove the remainder for our current cell volumes
    _long = fmod(_long, volume.x);
    _lat = fmod(_lat, volume.y);
  }

  return locator;
}

function fromSimplifiedLocator(locator) {
  var lat = 0, long = 0, volume, accuracy = locator.length / 2;

  for ( var depth = 0; depth < accuracy; ++depth ) {
    // Calculate Volume sizes for current depth
    volume = volumeForDepth(depth + 1);

    // Convert Grid Locations into volume
    long += fromBase24(locator.charAt( depth * 2 )) * volume.x;
    lat += fromBase40(locator.charAt( (depth * 2) + 1)) * volume.y;
  }

  long = Math.min(long - (MAX_LONG / 2), MAX_LONG);
  lat = Math.min(lat - (MAX_LAT / 2), MAX_LAT);

  return {
      lat: lat,
      long: long,
      accuracy: accuracy
    };
}

module.exports = {
  fromSimplifiedLocator: fromSimplifiedLocator,
  toSimplifiedLocator: toSimplifiedLocator,

  toBase: toBase,
  fromBase: fromBase,

  fromBase40: fromBase40,
  toBase40: toBase40,
  
  fromBase24: fromBase24,
  toBase24: toBase24,
  
  BASE_24_CHARS: BASE_24_CHARS,
  BASE_40_CHARS: BASE_40_CHARS
};
