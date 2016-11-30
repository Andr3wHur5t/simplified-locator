var should = require('should'),
	ProgressBar = require('progress'),
	sv = require('./index');

function barFor(count) {
    if ( process.env.NODE_ENV === 'test' ) return undefined;

    return new ProgressBar('     Progress: [:bar] :percent :etas', {
        total: count,
        complete: '=',
        incomplete: ' ',
        width: 40
    });
}

function performanceTest(count, opts) {
    var start, delta, bar, testName,
        max = 0, min = 0, sum = 0;
    if ( typeof opts.action !== 'function' ) {
        throw new Error('Must set action!');
    }

    testName = opts.name || 'items';

    console.log('\n\33[0;36m     Testing ' + count + ' ' + testName + '...' );

    bar = barFor(count);


    for (var q = 0; q < count; ++q ) {
        if ( typeof opts.beforeAction === 'function' ) {
            opts.beforeAction();
        }

        // Time & run action
        start = (new Date()).getTime();
        opts.action();
        delta = ((new Date()).getTime() - start);

        if ( typeof opts.afterAction === 'function' ) {
            opts.afterAction();
        }

        // Record
        max = Math.max(max, delta );
        min = Math.min(min, delta );
        sum += delta;

        if (bar) {
            bar.tick();
        }
    }

    console.log('     Results:');
    console.log('       Avg Δ: ' + sum / count + 'ms');
    console.log('       Max Δ: ' + max + 'ms');
    console.log('       Min Δ: ' + min + 'ms');
    console.log('       ' + count + ' ' + testName +' took ' + sum/1000 + ' seconds\033[0m');
}

function randV(full) {
	return ((Math.random() * full )% full) - full/2;
}

function degToMeter(deg,isLat){
	return deg * (isLat ? 110574.2727 : 111319.458);
}

function meterToFeet(m) {
	return m * 3.28084;
}

function toUnit(val, unit) {
	return parseFloat(val).toFixed(2) + " " + unit;
}

function degToImperial(deg, isLat){
	var f = meterToFeet(degToMeter(deg, isLat));
	if ( f / 5280 >= 1 ) {
		return toUnit(f / 5280, "miles");
	} else if ( f <  1) {
		return toUnit(f * 12, "inches");
	} else {
		return toUnit(f , "feet");
	}
}


function testAccuracy(testCount, accuracy) {
	var maxDev = {lat: 0, long: 0}, minDev = {lat: 0, long: 0},
		sumDev = {lat: 0, long: 0}, devAvg = {lat: 0, long: 0};
	console.log("\n\33[0;36m     Testing " + testCount + " locator encode -> decode resolutions..." +
		"(accuracy " + (accuracy) + ")");

	var bar = barFor(testCount);

	for (var i = testCount; i >= 0; --i ) {
		var out = testLocator(randV(180),randV(360), accuracy, 1000);

		maxDev.lat = Math.max(maxDev.lat, out.lat );
		maxDev.long = Math.max(maxDev.long, out.long );

		minDev.lat = Math.min(maxDev.lat, out.lat );
		minDev.long = Math.min(maxDev.long, out.long );

		sumDev.lat += out.lat;
		sumDev.long += out.long;

		if (bar) bar.tick();
	}

	devAvg.lat = (sumDev.lat / testCount);
	devAvg.long = (sumDev.long / testCount);

	console.log("     Results:" );
	console.log("       Avg Δ Lat: " + degToImperial(devAvg.lat, true) + ", Long: " + degToImperial(devAvg.long, false) );
	console.log("       Max Δ Lat: " + degToImperial(maxDev.lat, true) + ", Long: " + degToImperial(maxDev.long, false));
	console.log("       Min Δ Lat: " + degToImperial(minDev.lat, true) + ", Long: " + degToImperial(minDev.long, false) + "\033[0m");
}

function testLocator(lat, long, accuracy, varience) {
	var loc = sv.toSimplifiedLocator(lat, long, accuracy);
	var output = sv.fromSimplifiedLocator(loc);
	output.accuracy.should.equal(accuracy);
	output.lat.should.be.approximately(lat, varience);
	output.long.should.be.approximately(long, varience);

	return {lat: Math.abs(lat - output.lat), long: Math.abs(long - output.long), loc: loc};
}

describe('Base encoding Helpers', function() {
	it('should encode base 40', function() {
		this.timeout(550 * 1000);
		this.slow(40 * 1000);

		for( var i = 0; i < 40; ++i ) {
			sv.toBase40(i).should.equal(sv.BASE_40_CHARS.charAt(i));
		}
	});

	it('should decode base 40', function() {
		this.timeout(550 * 1000);
		this.slow(40 * 1000);

		for( var i = 0; i < 40; ++i ) {
			sv.fromBase40(sv.BASE_40_CHARS.charAt(i)).should.equal(i);
		}
	});

	it('should encode -> decode base 40', function() {
		this.timeout(550 * 1000);
		this.slow(40 * 1000);

		for( var i = 0; i < 40; ++i ) {
			sv.fromBase40(sv.toBase40(i)).should.equal(i);
		}
	});

	it('should encode base 24', function() {
		this.timeout(550 * 1000);
		this.slow(40 * 1000);
		for( var i = 0; i < 24; ++i ) {
			sv.toBase24(i).should.equal(sv.BASE_24_CHARS.charAt(i));
		}
	});

	it('should decode base 24', function() {
		this.timeout(550 * 1000);
		this.slow(40 * 1000);

		for( var i = 0; i < 25; ++i ) {
			sv.fromBase24(sv.BASE_24_CHARS.charAt(i)).should.equal(i);
		}
	});

	it('should encode -> decode base 24', function() {
		this.timeout(550 * 1000);
		this.slow(40 * 1000);

		for( var i = 0; i < 24; ++i ) {
			sv.fromBase24(sv.toBase24(i)).should.equal(i);
		}
	});

	it('should convert to bases', function() {
		// Given Lat Long get a locator
		sv.fromBase(24,'A',sv.toBase(24, 'A',10)).should.equal(10);
		sv.fromBase(24,'A',sv.toBase(24, 'A',12)).should.equal(12);
		sv.fromBase(24,'A',sv.toBase(24, 'A',15)).should.equal(15);
		sv.fromBase(24,'A',sv.toBase(24, 'A',23)).should.equal(23);
	});

});


describe('Simplified Locator Helper', function() {   

  	it('should encode and decode', function() {
  		const accuracy = 7, dev = 0.05;
  		// Given Lat Long get a locator		
  		testLocator(2.26181,48.81862, accuracy, dev);
  		testLocator(2.19589,49.12602, accuracy, dev);
  		testLocator(39.90974,-116.71875, accuracy, dev);
  		testLocator(-81.30832, -30.9375, accuracy, dev);
  		testLocator(19.31114, 12.65625, accuracy, dev);
  		testLocator(60.23981, 104.0625, accuracy, dev);
  		testLocator(39.90974, -101.25, accuracy, dev);
  		testLocator(7.01367, 158.90625, accuracy, dev);
  		testLocator(39.90974, -122.17346 , accuracy, dev);
  		testLocator(7.01367, 158.90625 , accuracy, dev);
  		testLocator(47.75779 , -122.17346  , accuracy, dev);
  		testLocator(47.58949, -122.32315 , accuracy, dev);
  		testLocator(37.76094, -122.44675 , accuracy, dev);
  		
  	});

	it('should have reasonable accuracy and standard deviation', function() {
		const testCount = 50000, accuracy = 5;
		this.slow(testCount * 2 * accuracy);
		this.timeout(testCount * 2 * accuracy);
		var i = accuracy;
		//for (i=0; i < accuracy; ++i)
			testAccuracy(testCount,i)
	});

	it('should be performant', function() {
		this.timeout(550 * 1000);
		this.slow(40 * 1000);
		performanceTest(3000, {
				name: 'locator encodes & decodes',
				action: function(){
					testLocator(randV(180),randV(360), 9, 1000);
				}
			}
		);
	});
});

